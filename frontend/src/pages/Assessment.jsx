import React, { useState, useEffect, useRef, useCallback } from 'react'
import client from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import BuddyMascot from '../components/BuddyMascot'
import { useNavigate } from 'react-router-dom'
import { syncAssessmentToPhase2 } from '../utils/assessmentSync'
import { usePrefetchCache } from '../utils/usePrefetchCache'
import { useAssessmentAutosave } from '../utils/useAssessmentAutosave'
import { perfLogger } from '../utils/performanceMetrics'

const TOTAL_QUESTIONS = 8
const TIMER_SECONDS = 20

// Memoized Option Button styled like tactile 3D Duolingo / Khan Academy Kids buttons
const OptionButton = React.memo(function OptionButton({ optText, onSelect, disabled, index }) {
  const colorThemes = [
    'border-b-8 border-kid-blue bg-white hover:bg-sky-50 text-gray-800 border-2 border-sky-300',
    'border-b-8 border-kid-green bg-white hover:bg-green-50 text-gray-800 border-2 border-green-300',
    'border-b-8 border-kid-yellowDark bg-white hover:bg-yellow-50 text-gray-800 border-2 border-yellow-300',
    'border-b-8 border-kid-purple bg-white hover:bg-purple-50 text-gray-800 border-2 border-purple-300'
  ]
  const theme = colorThemes[index % colorThemes.length]

  return (
    <button
      onClick={() => onSelect(optText)}
      disabled={disabled}
      className={`py-5 px-6 rounded-3xl font-kid font-black text-2xl sm:text-3xl shadow-md transform transition-all duration-150 active:translate-y-1.5 focus:outline-none ${theme} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
      }`}
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
        const res = await client.get('/api/v2/assessments/progress', {
          params: { userId: user._id }
        })
        if (res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
          setSavedProgress(res.data)
          setShowResumeModal(true)
        } else if (localBackup && Array.isArray(localBackup.questions) && localBackup.questions.length > 0) {
          setSavedProgress(localBackup)
          setShowResumeModal(true)
        } else {
          startFresh()
        }
      } catch (err) {
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
  }, [user?._id, getLocalStorageBackup, startFresh])

  const handleResume = () => {
    if (savedProgress) {
      registerExistingQuestions(savedProgress.questions)
      setQuestions(savedProgress.questions)
      setQuestionIndex(savedProgress.currentQuestionIndex || 0)
      setAnswers(savedProgress.answers || [])

      if (typeof savedProgress.secondsLeft === 'number' && savedProgress.secondsLeft >= 0) {
        restoredSecondsLeftRef.current = savedProgress.secondsLeft
      }

      const curDifficulty = savedProgress.difficulty || 2
      prefetchAdjacent(curDifficulty)
    }
    setShowResumeModal(false)
  }

  const handleDiscard = () => {
    clearSession()
    setShowResumeModal(false)
    startFresh()
  }

  /* ================= SPEECH ASSIST ================= */
  const speakText = (text) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (current && audioEnabled) {
      speakText(current.questionText)
    }
  }, [current, audioEnabled])

  /* ================= SUBMISSION FUNCTION ================= */
  const submitFinalAssessment = useCallback(async (finalQuestions, finalAnswers) => {
    setSubmitting(true)
    clearInterval(timerRef.current)

    const legacyId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)

    try {
      const syncedResult = await syncAssessmentToPhase2({
        assessmentType: 'ADAPTIVE_SCREENER',
        legacyAssessmentId: legacyId,
        questions: finalQuestions,
        answers: finalAnswers,
      })

      clearSession()
      navigate('/results', { state: { result: syncedResult }, replace: true })
    } catch (err) {
      console.error('[Assessment] Submission failed:', err)
      setError('Submission failed. Check network or server connection.')
      setSubmitting(false)
    }
  }, [navigate, clearSession])

  /* ================= OPTION SELECTION ================= */
  const handleSelectRef = useRef(null)

  const handleSelect = useCallback((optText, responseTimeMs) => {
    const { questions: curQs, questionIndex: curIdx, answers: curAns } = stateRef.current
    const curQ = curQs[curIdx]

    if (!curQ) {
      console.error('[Assessment] handleSelect called with null or invalid current question at index:', curIdx)
      return
    }

    const t0 = performance.now()

    const isCorrect = String(optText) === String(curQ.correctAnswer)

    let nextDiff = curQ.difficulty || 2
    if (isCorrect) {
      if (responseTimeMs < 5000 && nextDiff < 5) nextDiff++
    } else {
      if (nextDiff > 1) nextDiff--
    }

    const newAnswer = {
      questionId: curQ.id || curQ.localId,
      selected: optText,
      selectedAnswer: optText,
      selectedOption: optText,
      isCorrect,
      responseTimeMs,
      difficulty: curQ.difficulty || 2
    }

    const updatedAnswers = [...curAns, newAnswer]
    const nextIdx = curIdx + 1

    if (nextIdx < TOTAL_QUESTIONS) {
      const { question: nextQ, source } = popQuestionSync(nextDiff, nextIdx)
      if (!nextQ || nextQ.correctAnswer === undefined || nextQ.correctAnswer === null) {
        console.error('[Assessment] popQuestionSync produced invalid question for nextIdx:', nextIdx)
        return
      }

      const updatedQuestions = [...curQs, nextQ]

      const transitionMs = performance.now() - t0
      perfLogger.logTransition(transitionMs, source === 'cache')

      setQuestions(updatedQuestions)
      setAnswers(updatedAnswers)
      setQuestionIndex(nextIdx)
      stateRef.current = { questions: updatedQuestions, questionIndex: nextIdx, answers: updatedAnswers }
      startTsRef.current = Date.now()

      prefetchAdjacent(nextDiff)
      triggerAutosave(updatedQuestions, nextIdx, updatedAnswers, nextDiff, TIMER_SECONDS)
    } else {
      setAnswers(updatedAnswers)
      stateRef.current = { ...stateRef.current, answers: updatedAnswers }
      clearSession()
      submitFinalAssessment(curQs, updatedAnswers)
    }
  }, [popQuestionSync, prefetchAdjacent, triggerAutosave, clearSession, submitFinalAssessment])

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
    handleSelect(opt.text !== undefined ? opt.text : opt, responseTime)
  }, [handleSelect, submitting])

  if (checkingProgress || !current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-indigo-50 font-kid">
        <BuddyMascot mood="cheerful" size="lg" message="Getting your quest ready..." />
        <div className="mt-4">
          <LoadingSpinner size={48} />
        </div>
      </div>
    )
  }

  // Calculate timer color theme
  const timerColor =
    secondsLeft > 10
      ? 'bg-kid-green'
      : secondsLeft > 5
      ? 'bg-kid-yellow'
      : 'bg-kid-pink animate-pulse'

  /* ================= UI RENDER ================= */
  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white text-gray-800 font-kid">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-indigo-100 relative">
        
        {/* Top Header & Segmented Progress Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b-2 border-indigo-50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Number Quest</h2>
              <span className="text-xs font-bold text-gray-500">
                Question {questionIndex + 1} of {TOTAL_QUESTIONS}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`text-xs px-3 py-1.5 rounded-2xl font-bold border-2 transition flex items-center gap-1.5 ${
                audioEnabled
                  ? 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              {audioEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
            </button>
          </div>
        </div>

        {/* Colorful Segmented Progress Bar */}
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-6 flex gap-1 p-0.5 border border-gray-200">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${
                i < questionIndex
                  ? 'bg-kid-green'
                  : i === questionIndex
                  ? 'bg-kid-blue animate-pulse'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Main Question Box with Buddy Mascot */}
        <div className="bg-gradient-to-r from-sky-50/70 to-indigo-50/70 rounded-3xl p-6 border-2 border-indigo-100 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                Level {current.difficulty} Challenge
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center justify-center sm:justify-start gap-3">
              <span>{current.questionText}</span>
              <button
                onClick={() => speakText(current.questionText)}
                className="p-2 hover:bg-white rounded-2xl text-kid-blue hover:text-kid-blueDark transition shadow-xs"
                title="Read Question Aloud"
              >
                🔊
              </button>
            </div>
          </div>

          <BuddyMascot
            mood="cheerful"
            size="md"
            message={questionIndex === 0 ? "You've got this!" : "Great focus!"}
          />
        </div>

        {/* Visual Countdown Timer Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-1">
            <span>⏱ Time Remaining</span>
            <span className="text-base font-black text-gray-800">{secondsLeft}s</span>
          </div>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${timerColor}`}
              style={{ width: `${(secondsLeft / TIMER_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        {/* Visual Aids (Dots / Shapes / Images) rendered playfully */}
        {current.dots && (
          <div className="flex gap-3 flex-wrap justify-center mb-6 p-4 bg-sky-50/50 rounded-2xl border-2 border-dashed border-sky-200">
            {Array.from({ length: current.dots }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-kid-blue rounded-full shadow-duo-blue transform hover:scale-110 transition"
              />
            ))}
          </div>
        )}

        {current.shapes && (
          <div className="flex gap-5 justify-center mb-6 p-4 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-200">
            {current.shapes.map((s, i) => (
              <div key={i} className={`w-14 h-14 ${s.color} ${s.shape} drop-shadow-md`} />
            ))}
          </div>
        )}

        {current.image && (
          <div className="flex justify-center mb-6">
            <img
              src={current.image}
              alt="question"
              loading="lazy"
              className="w-48 rounded-3xl border-4 border-indigo-100 shadow-lg"
            />
          </div>
        )}

        {/* Tactile 3D Option Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(current.options || []).map((opt, i) => (
            <OptionButton
              key={i}
              index={i}
              optText={typeof opt === 'object' ? opt.text : opt}
              onSelect={select}
              disabled={submitting}
            />
          ))}
        </div>

        {/* Kid-Friendly Resume Modal */}
        {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-kid">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border-4 border-indigo-200">
              <BuddyMascot mood="waving" size="md" />
              <h3 className="text-2xl font-black text-gray-900">Welcome Back Buddy!</h3>
              <p className="text-sm font-bold text-gray-600">
                We saved your spot on Question {savedProgress?.currentQuestionIndex + 1 || 1}! Would you like to keep going?
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleResume}
                  className="kid-btn-primary w-full"
                >
                  <span>⭐ Continue Adventure</span>
                </button>
                <button
                  onClick={handleDiscard}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-sm transition"
                >
                  Start Over Fresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
