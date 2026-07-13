import { useState, useEffect, useRef } from 'react'
import client from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import { useNavigate } from 'react-router-dom'
import { syncAssessmentToPhase2 } from '../utils/assessmentSync'

export default function Assessment() {
  const TOTAL_QUESTIONS = 8
  const TIMER_SECONDS = 20

  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [showResumeModal, setShowResumeModal] = useState(false)
  const [savedProgress, setSavedProgress] = useState(null)
  const [checkingProgress, setCheckingProgress] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const restoredSecondsLeftRef = useRef(null)
  const timerRef = useRef(null)
  const startTsRef = useRef(Date.now())
  const navigate = useNavigate()
  const user = getUser()

  const loadNextQuestion = async (diff, idx) => {
    try {
      const shownIds = questions.filter(q => q.id).map(q => q.id).join(',')
      const res = await client.get('/api/v2/questions/adaptive', {
        params: {
          difficultyLevel: diff,
          excludeIds: shownIds
        }
      })
      if (res.status === 204 || !res.data) {
        console.info("All DB questions exhausted for this session. Using local generator fallback.")
        return generateAdaptiveQuestion(diff, idx)
      }
      const dbQ = res.data
      return {
        id: dbQ.id,
        localId: `q-${idx}`,
        questionType: dbQ.questionType,
        questionText: dbQ.questionText,
        options: dbQ.options.map(opt => ({ text: opt })),
        correctAnswer: dbQ.correctAnswer,
        difficulty: diff
      }
    } catch (err) {
      console.warn("Failed to fetch adaptive question from DB, falling back...", err)
      return generateAdaptiveQuestion(diff, idx)
    }
  }

  /* ================= INIT ================= */
  useEffect(() => {
    const checkSavedSession = async () => {
      if (!user?._id) {
        setCheckingProgress(false)
        startFresh()
        return
      }

      try {
        const res = await client.get('/api/v2/assessments/progress', {
          params: { externalUserId: user._id }
        })
        if (res.status === 200 && res.data) {
          setSavedProgress(res.data)
          setShowResumeModal(true)
        } else {
          await startFresh()
        }
      } catch (err) {
        await startFresh()
      } finally {
        setCheckingProgress(false)
      }
    }
    checkSavedSession()

    return () => clearInterval(timerRef.current)
  }, [])

  const startFresh = async () => {
    try {
      const first = await loadNextQuestion(2, 0)
      setQuestions([first])
      setCurrent(first)
    } catch (err) {
      const fallback = generateAdaptiveQuestion(2, 0)
      setQuestions([fallback])
      setCurrent(fallback)
    }
    startTsRef.current = Date.now()
  }

  const saveSessionProgress = async (idx, currentQuestions, currentAnswers, secLeft) => {
    if (!user?._id) return
    try {
      await client.post(`/api/v2/assessments/progress?externalUserId=${user._id}`, {
        assessmentType: 'FULL',
        questions: currentQuestions,
        answers: currentAnswers,
        currentQuestionIndex: idx,
        secondsLeft: secLeft,
        difficulty: currentQuestions[idx]?.difficulty || 2
      })
    } catch (err) {
      console.warn("Failed to autosave progress:", err)
    }
  }

  const handleResume = () => {
    if (!savedProgress) return
    setQuestions(savedProgress.questions)
    setAnswers(savedProgress.answers)
    setQuestionIndex(savedProgress.currentQuestionIndex)
    
    if (savedProgress.secondsLeft !== undefined && savedProgress.secondsLeft !== null) {
      restoredSecondsLeftRef.current = savedProgress.secondsLeft
    }
    
    setCurrent(savedProgress.questions[savedProgress.currentQuestionIndex])
    setShowResumeModal(false)
    startTsRef.current = Date.now()
  }

  const handleDiscard = async () => {
    try {
      await client.delete(`/api/v2/assessments/progress?externalUserId=${user._id}`)
    } catch (err) {
      console.warn("Failed to discard saved session:", err)
    }
    setShowResumeModal(false)
    await startFresh()
  }

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!current) return

    clearInterval(timerRef.current)
    
    if (restoredSecondsLeftRef.current !== null) {
      setSecondsLeft(restoredSecondsLeftRef.current)
      restoredSecondsLeftRef.current = null
    } else {
      setSecondsLeft(TIMER_SECONDS)
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          setTimeout(() => handleTimeout(), 0)
          return 0
        }
        
        // Autosave progress periodically
        if (s % 3 === 0 && user?._id) {
          saveSessionProgress(questionIndex, questions, answers, s - 1)
        }
        
        return s - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [current])

  const speakText = (text) => {
    if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return
    try {
      const utter = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    } catch (e) {
      console.warn("Speech synthesis error:", e)
    }
  }

  useEffect(() => {
    if (current?.questionText) {
      speakText(current.questionText)
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [current, audioEnabled])

  /* ================= HANDLERS ================= */
  const handleTimeout = () => {
    handleSelect(null, TIMER_SECONDS * 1000)
  }

  const select = (opt) => {
    if (submitting) return
    const responseTime = Date.now() - startTsRef.current
    handleSelect(opt, responseTime)
  }

  const handleSelect = async (opt, responseTime) => {
    const updated = [...answers, { selected: opt, responseTime }]
    setAnswers(updated)

    if (questionIndex < TOTAL_QUESTIONS - 1) {
      const wasCorrect =
        opt !== null && String(opt) === String(current.correctAnswer)
      const quick = responseTime < 5000

      const nextDifficulty = Math.min(
        5,
        Math.max(
          1,
          current.difficulty +
            (wasCorrect && quick ? 1 : 0) -
            (!wasCorrect ? 1 : 0)
        )
      )

      let nextQ
      try {
        nextQ = await loadNextQuestion(nextDifficulty, questionIndex + 1)
      } catch (err) {
        nextQ = generateAdaptiveQuestion(nextDifficulty, questionIndex + 1)
      }

      if (!nextQ) {
        setError("All available questions have been completed! Submitting assessment...")
        setTimeout(() => {
          submitAssessment(updated)
        }, 1500)
        return
      }

      const newQuestions = [...questions, nextQ]
      setQuestions(newQuestions)
      setCurrent(nextQ)
      setQuestionIndex((i) => i + 1)
      startTsRef.current = Date.now()

      saveSessionProgress(questionIndex + 1, newQuestions, updated, TIMER_SECONDS)
    } else {
      submitAssessment(updated)
    }
  }

  /* ================= SUBMIT ================= */
  const submitAssessment = async (finalAnswers) => {
    if (submitting) return
    setSubmitting(true)

    try {
      const legacyId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const synced = await syncAssessmentToPhase2({
        assessmentType: 'FULL',
        legacyAssessmentId: legacyId,
        questions,
        answers: finalAnswers,
      })

      if (!synced) {
        throw new Error('Assessment submission failed. Is the Spring Boot backend running?')
      }

      // Clear progress on completion
      if (user?._id) {
        await client.delete(`/api/v2/assessments/progress?externalUserId=${user._id}`).catch(() => {})
      }

      navigate('/results', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 text-black">
      <div className="max-w-3xl w-full bg-white rounded-2xl p-5 shadow-sm text-black relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Assessment</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition ${
                audioEnabled
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              {audioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
            </button>
            <span className="text-sm text-black">
              Q {questionIndex + 1}/{TOTAL_QUESTIONS}
            </span>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="mb-3 text-lg font-medium text-black flex items-center gap-2">
          <span>{current?.questionText}</span>
          <button
            onClick={() => speakText(current?.questionText)}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition"
            title="Read Question Aloud"
          >
            🔊
          </button>
        </div>

        <div className="text-sm mb-4 text-black">
          Difficulty: {current?.difficulty} | ⏱ {secondsLeft}s
        </div>

        {current?.dots && (
          <div className="flex gap-2 flex-wrap mb-4">
            {Array.from({ length: current.dots }).map((_, i) => (
              <div key={i} className="w-5 h-5 bg-blue-500 rounded-full" />
            ))}
          </div>
        )}

        {current?.shapes && (
          <div className="flex gap-4 mb-4">
            {current.shapes.map((s, i) => (
              <div key={i} className={`w-12 h-12 ${s.color} ${s.shape}`} />
            ))}
          </div>
        )}

        {current?.image && (
          <img
            src={current.image}
            alt="question"
            loading="lazy"
            width={160}
            height={160}
            className="w-40 mb-4 rounded-xl border"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          {(current?.options || []).map((opt, i) => (
            <button
              key={i}
              onClick={() => select(opt.text)}
              disabled={submitting}
              className="py-3 px-4 rounded-xl border-2 border-gray-300 font-medium text-black hover:border-primary hover:bg-primary/10 transition"
            >
              {submitting ? <LoadingSpinner size={18} /> : opt.text}
            </button>
          ))}
        </div>

        {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
              <h3 className="text-xl font-extrabold text-black">Resume Assessment?</h3>
              <p className="text-sm text-gray-500">
                We found an unfinished assessment session. Would you like to resume from where you left off?
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleResume}
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md animate-bounce"
                >
                  Resume Session
                </button>
                <button
                  onClick={handleDiscard}
                  className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm"
                >
                  Start New Assessment
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* ================= HELPERS ================= */

function generateAdaptiveQuestion(difficulty, idx) {
  const types = [
    'arithmetic',
    'count_dots',
    'comparison',
    'missing',
    'image_based',
    'shape_color',
  ]
  const type = types[randInt(0, types.length - 1)]

  switch (type) {
    case 'count_dots':
      return generateCountDots(difficulty, idx)
    case 'comparison':
      return generateComparison(difficulty, idx)
    case 'missing':
      return generateMissing(difficulty, idx)
    case 'image_based':
      return generateImageQuestion(difficulty, idx)
    case 'shape_color':
      return generateShapeColor(difficulty, idx)
    default:
      return generateArithmetic(difficulty, idx)
  }
}

function generateArithmetic(difficulty, idx) {
  const a = randInt(1, difficulty * 5)
  const b = randInt(1, difficulty * 5)
  return build(`${a} + ${b} = ?`, a + b, difficulty, idx, 'arithmetic')
}

function generateCountDots(difficulty, idx) {
  const dots = randInt(3, difficulty * 4)
  return { ...build('How many dots?', dots, difficulty, idx, 'number_sense'), dots }
}

function generateComparison(difficulty, idx) {
  const a = randInt(1, difficulty * 10)
  const b = randInt(1, difficulty * 10)
  return build(`${a} ? ${b}`, a > b ? '>' : '<', difficulty, idx, 'number_sense')
}

function generateMissing(difficulty, idx) {
  const start = randInt(1, 10)
  const step = randInt(1, difficulty + 1)
  return build(
    `Find missing: ${start}, ${start + step}, ?, ${start + step * 3}`,
    start + step * 2,
    difficulty,
    idx,
    'number_sense'
  )
}

function generateImageQuestion(difficulty, idx) {
  const fruits = ['Apple', 'Banana', 'Orange', 'Grapes']
  return {
    localId: `img-${idx}`,
    questionType: 'spatial',
    questionText: 'Which fruit is this?',
    image: `/images/${fruits[idx % fruits.length].toLowerCase()}.svg`,
    options: fruits.map((f) => ({ text: f })),
    correctAnswer: fruits[idx % fruits.length],
    difficulty,
  }
}

function generateShapeColor(difficulty, idx) {
  return {
    localId: `shape-${idx}`,
    questionType: 'spatial',
    questionText: 'What color are the shapes?',
    shapes: [
      { shape: 'rounded-full', color: 'bg-red-500' },
      { shape: 'rounded-full', color: 'bg-red-500' },
    ],
    options: generateOptions('Red'),
    correctAnswer: 'Red',
    difficulty,
  }
}

function build(text, correct, difficulty, idx, questionType) {
  return {
    localId: `q-${idx}`,
    questionType,
    questionText: text,
    options: generateOptions(String(correct)),
    correctAnswer: String(correct),
    difficulty,
  }
}

function generateOptions(correct) {
  if (!isNaN(Number(correct))) {
    const set = new Set([String(correct)])
    while (set.size < 4) {
      set.add(String(Number(correct) + randInt(-5, 5)))
    }
    return [...set].map((v) => ({ text: v })).sort(() => Math.random() - 0.5)
  }

  const pool = ['Red', 'Blue', 'Green', 'Yellow', 'Apple', 'Banana', 'Orange', 'Grapes', '>', '<']
  const set = new Set([correct])

  while (set.size < 4) {
    set.add(pool[randInt(0, pool.length - 1)])
  }

  return [...set].map((v) => ({ text: v })).sort(() => Math.random() - 0.5)
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
