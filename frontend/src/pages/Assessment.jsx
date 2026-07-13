import React, { useState, useEffect, useRef, useCallback } from 'react'
import client from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import { useNavigate } from 'react-router-dom'
import { syncAssessmentToPhase2 } from '../utils/assessmentSync'
import { usePrefetchCache } from '../utils/usePrefetchCache'
import { useAssessmentAutosave } from '../utils/useAssessmentAutosave'
import { perfLogger } from '../utils/performanceMetrics'

const TOTAL_QUESTIONS = 8
const TIMER_SECONDS = 20

// Memoized Option Button to prevent unnecessary re-renders during 1s timer countdowns
const OptionButton = React.memo(function OptionButton({ optText, onSelect, disabled }) {
  return (
    <button
      onClick={() => onSelect(optText)}
      disabled={disabled}
      className="py-3 px-4 rounded-xl border-2 border-gray-300 font-medium text-black hover:border-primary hover:bg-primary/10 transition"
    >
      {optText}
    </button>
  )
})

export default function Assessment() {
  // Single source of truth for session state (no duplicate state variables)
  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [showResumeModal, setShowResumeModal] = useState(false)
  const [savedProgress, setSavedProgress] = useState(null)
  const [checkingProgress, setCheckingProgress] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const stateRef = useRef({ questions: [], questionIndex: 0, answers: [] })
  const restoredSecondsLeftRef = useRef(null)
  const timerRef = useRef(null)
  const startTsRef = useRef(Date.now())
  const navigate = useNavigate()
  const user = getUser()

  // High-performance hooks
  const { popQuestionSync, prefetchAdjacent, registerExistingQuestions } = usePrefetchCache()
  const { triggerAutosave, getLocalStorageBackup, clearSession } = useAssessmentAutosave(user)

  // Derived current question guaranteed to always be in sync with questions[questionIndex]
  const current = questions[questionIndex] || null

  useEffect(() => {
    stateRef.current = { questions, questionIndex, answers }
  }, [questions, questionIndex, answers])

  /* ================= INIT & SESSION RESUME ================= */
  const startFresh = useCallback(() => {
    const { question: firstQ } = popQuestionSync(2, 0)
    if (!firstQ || firstQ.correctAnswer === undefined || firstQ.correctAnswer === null) {
      console.error('[Assessment] popQuestionSync produced invalid first question!', firstQ)
      return
    }
    const initQuestions = [firstQ]
    setQuestions(initQuestions)
    setQuestionIndex(0)
    setAnswers([])
    stateRef.current = { questions: initQuestions, questionIndex: 0, answers: [] }
    startTsRef.current = Date.now()

    prefetchAdjacent(2)
  }, [popQuestionSync, prefetchAdjacent])

  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    perfLogger.reset()

    const checkSavedSession = async () => {
      const localBackup = getLocalStorageBackup()

      if (!user?._id) {
        setCheckingProgress(false)
        if (localBackup && Array.isArray(localBackup.questions) && localBackup.questions.length > 0) {
          setSavedProgress(localBackup)
          setShowResumeModal(true)
          return
        }
        startFresh()
        return
      }

      try {
        const fetchStart = performance.now()
        const res = await client.get('/api/v2/assessments/progress', {
          params: { externalUserId: user._id }
        })
        perfLogger.logApiFetch('GET /api/v2/assessments/progress', performance.now() - fetchStart, true)

        if (res.status === 200 && res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
          setSavedProgress(res.data)
          setShowResumeModal(true)
        } else if (localBackup && Array.isArray(localBackup.questions) && localBackup.questions.length > 0) {
          setSavedProgress(localBackup)
          setShowResumeModal(true)
        } else {
          startFresh()
        }
      } catch (_err) {
        perfLogger.logApiFetch('GET /api/v2/assessments/progress', 0, false)
        if (localBackup && Array.isArray(localBackup.questions) && localBackup.questions.length > 0) {
          setSavedProgress(localBackup)
          setShowResumeModal(true)
        } else {
          startFresh()
        }
      } finally {
        setCheckingProgress(false)
      }
    }

    checkSavedSession()

    return () => {
      clearInterval(timerRef.current)
    }
  }, [])

  const handleResume = useCallback(() => {
    if (!savedProgress) return

    registerExistingQuestions(savedProgress.questions)
    const resumedQuestions = savedProgress.questions
    const resumedAnswers = savedProgress.answers || []
    const resumeIdx = savedProgress.currentQuestionIndex || 0

    setQuestions(resumedQuestions)
    setAnswers(resumedAnswers)
    setQuestionIndex(resumeIdx)
    stateRef.current = { questions: resumedQuestions, questionIndex: resumeIdx, answers: resumedAnswers }

    if (savedProgress.secondsLeft !== undefined && savedProgress.secondsLeft !== null) {
      restoredSecondsLeftRef.current = savedProgress.secondsLeft
    }

    setShowResumeModal(false)
    startTsRef.current = Date.now()

    const resumedQ = resumedQuestions[resumeIdx] || resumedQuestions[0]
    prefetchAdjacent(resumedQ?.difficulty || 2)
  }, [savedProgress, registerExistingQuestions, prefetchAdjacent])

  const handleDiscard = useCallback(async () => {
    await clearSession()
    setShowResumeModal(false)
    startFresh()
  }, [clearSession, startFresh])

  /* ================= SPEECH SYNTHESIS ================= */
  const speakText = useCallback((text) => {
    if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return
    try {
      const utter = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    } catch (e) {
      console.warn('Speech synthesis error:', e)
    }
  }, [audioEnabled])

  useEffect(() => {
    if (current?.questionText) {
      speakText(current.questionText)
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [current, speakText])

  /* ================= FINAL SUBMISSION ================= */
  const submitAssessment = useCallback(async (finalAnswers, finalQuestions) => {
    if (submitting) return
    setSubmitting(true)

    try {
      perfLogger.printReport()

      const legacyId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)

      const synced = await syncAssessmentToPhase2({
        assessmentType: 'FULL',
        legacyAssessmentId: legacyId,
        questions: finalQuestions,
        answers: finalAnswers,
      })

      if (!synced) {
        throw new Error('Assessment submission failed. Is the Spring Boot backend running?')
      }

      await clearSession()
      navigate('/results', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }, [clearSession, navigate, submitting])

  /* ================= OPTION SELECT / QUESTION TRANSITION (<10ms) ================= */
  const handleSelect = useCallback((opt, responseTime) => {
    const { questions: currQuestions, questionIndex: currIdx, answers: currAnswers } = stateRef.current
    const currQ = currQuestions[currIdx]

    if (!currQ || currQ.correctAnswer === undefined || currQ.correctAnswer === null) {
      console.error('[Assessment] handleSelect encountered null/invalid current question. Aborting.')
      return
    }

    const transitionStartTime = performance.now()
    const updatedAnswers = [...currAnswers, { selected: opt, responseTime }]

    if (currIdx < TOTAL_QUESTIONS - 1) {
      const wasCorrect = opt !== null && String(opt) === String(currQ.correctAnswer)
      const quick = responseTime < 5000

      const nextDifficulty = Math.min(
        5,
        Math.max(
          1,
          (currQ.difficulty || 2) +
            (wasCorrect && quick ? 1 : 0) -
            (!wasCorrect ? 1 : 0)
        )
      )

      const nextIdx = currIdx + 1
      const { question: nextQ, wasCacheHit } = popQuestionSync(nextDifficulty, nextIdx)

      if (!nextQ || nextQ.correctAnswer === undefined || nextQ.correctAnswer === null) {
        console.error('[Assessment] popQuestionSync returned invalid nextQ at index', nextIdx)
        return
      }

      const transitionTimeMs = performance.now() - transitionStartTime
      perfLogger.logTransition(transitionTimeMs, wasCacheHit, nextDifficulty)

      const updatedQuestions = [...currQuestions, nextQ]

      // Synchronize both state and ref in the same tick
      setAnswers(updatedAnswers)
      setQuestions(updatedQuestions)
      setQuestionIndex(nextIdx)
      stateRef.current = { questions: updatedQuestions, questionIndex: nextIdx, answers: updatedAnswers }

      startTsRef.current = Date.now()
      setSecondsLeft(TIMER_SECONDS)

      triggerAutosave(nextIdx, updatedQuestions, updatedAnswers, TIMER_SECONDS)
    } else {
      setAnswers(updatedAnswers)
      stateRef.current = { questions: currQuestions, questionIndex: currIdx, answers: updatedAnswers }
      submitAssessment(updatedAnswers, currQuestions)
    }
  }, [popQuestionSync, submitAssessment, triggerAutosave])

  /* ================= 1-SECOND TIMER ================= */
  const handleSelectRef = useRef(handleSelect)
  useEffect(() => {
    handleSelectRef.current = handleSelect
  }, [handleSelect])

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
          setTimeout(() => {
            if (handleSelectRef.current) {
              handleSelectRef.current(null, TIMER_SECONDS * 1000)
            }
          }, 0)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [current])

  const select = useCallback((opt) => {
    if (submitting) return
    const responseTime = Date.now() - startTsRef.current
    handleSelect(opt, responseTime)
  }, [handleSelect, submitting])

  if (checkingProgress || !current) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  /* ================= UI RENDER ================= */
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
          <span>{current.questionText}</span>
          <button
            onClick={() => speakText(current.questionText)}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition"
            title="Read Question Aloud"
          >
            🔊
          </button>
        </div>

        <div className="text-sm mb-4 text-black">
          Difficulty: {current.difficulty} | ⏱ {secondsLeft}s
        </div>

        {current.dots && (
          <div className="flex gap-2 flex-wrap mb-4">
            {Array.from({ length: current.dots }).map((_, i) => (
              <div key={i} className="w-5 h-5 bg-blue-500 rounded-full" />
            ))}
          </div>
        )}

        {current.shapes && (
          <div className="flex gap-4 mb-4">
            {current.shapes.map((s, i) => (
              <div key={i} className={`w-12 h-12 ${s.color} ${s.shape}`} />
            ))}
          </div>
        )}

        {current.image && (
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
          {(current.options || []).map((opt, i) => (
            <OptionButton
              key={i}
              optText={opt.text}
              onSelect={select}
              disabled={submitting}
            />
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
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md transition hover:opacity-90"
                >
                  Resume Session
                </button>
                <button
                  onClick={handleDiscard}
                  className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition"
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
