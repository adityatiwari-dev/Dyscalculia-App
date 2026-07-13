import { useEffect, useRef, useCallback } from 'react'
import client from '../api/springClient'
import { perfLogger } from './performanceMetrics'

const LOCAL_STORAGE_KEY = 'nc_assessment_progress_backup'

/**
 * Hook to manage fire-and-forget asynchronous autosave with:
 * - LocalStorage offline resilience
 * - Throttling: every 3 answered questions OR every 30 seconds
 * - Automatic exponential backoff retry on failure
 */
export function useAssessmentAutosave(user) {
  const retryTimeoutRef = useRef(null)
  const retryAttemptRef = useRef(0)
  const lastSavedIndexRef = useRef(-1)
  const latestSnapshotRef = useRef(null)
  const sendToServerRef = useRef(null)

  // Save progress locally to localStorage as immediate offline backup
  const saveToLocalStorage = useCallback((payload) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
    } catch (_err) {
      console.warn('Failed to save assessment backup to localStorage')
    }
  }, [])

  const getLocalStorageBackup = useCallback(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (_err) {
      return null
    }
  }, [])

  const clearLocalStorageBackup = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch (_err) {
      // ignore
    }
  }, [])

  // Asynchronous network sync with exponential backoff retry
  const sendToServerAsync = useCallback((payload, attempt = 0) => {
    if (!user?._id) return

    const startTime = performance.now()
    client.post(`/api/v2/assessments/progress?externalUserId=${user._id}`, payload)
      .then(() => {
        const duration = performance.now() - startTime
        perfLogger.logAutosave(duration, 'SUCCESS')
        retryAttemptRef.current = 0
      })
      .catch(() => {
        const duration = performance.now() - startTime
        perfLogger.logAutosave(duration, `FAILED (attempt ${attempt + 1})`)

        // Schedule exponential backoff retry (max 60 seconds)
        const nextAttempt = attempt + 1
        retryAttemptRef.current = nextAttempt
        const delayMs = Math.min(60000, 2000 * Math.pow(2, nextAttempt))

        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = setTimeout(() => {
          if (latestSnapshotRef.current && sendToServerRef.current) {
            sendToServerRef.current(latestSnapshotRef.current, nextAttempt)
          }
        }, delayMs)
      })
  }, [user])

  useEffect(() => {
    sendToServerRef.current = sendToServerAsync
  }, [sendToServerAsync])

  // Trigger autosave if conditions met (every 3 questions OR explicit trigger)
  const triggerAutosave = useCallback((arg1, arg2, arg3, arg4, arg5, arg6) => {
    let questions, currentQuestionIndex, answers, difficulty, secondsLeft, force
    if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
      questions = arg1.questions
      currentQuestionIndex = arg1.currentQuestionIndex
      answers = arg1.answers
      difficulty = arg1.difficulty
      secondsLeft = arg1.secondsLeft
      force = Boolean(arg1.force)
    } else {
      questions = arg1
      currentQuestionIndex = arg2
      answers = arg3
      difficulty = arg4
      secondsLeft = arg5
      force = Boolean(arg6)
    }

    const qArray = Array.isArray(questions) ? questions : []
    const aArray = Array.isArray(answers) ? answers : []
    const idxVal = Number(currentQuestionIndex) || 0
    const diffVal = Number(difficulty) || qArray[idxVal]?.difficulty || 2
    const secVal = Number(secondsLeft) || 30

    const payload = {
      assessmentType: 'ADAPTIVE_SCREENER',
      questions: qArray,
      answers: aArray,
      currentQuestionIndex: idxVal,
      secondsLeft: secVal,
      difficulty: diffVal
    }

    latestSnapshotRef.current = payload
    saveToLocalStorage(payload)

    const answeredCount = idxVal
    const isEveryThreeQuestions = answeredCount > 0 && answeredCount % 3 === 0 && lastSavedIndexRef.current !== idxVal

    if (force || isEveryThreeQuestions) {
      lastSavedIndexRef.current = idxVal
      setTimeout(() => {
        if (sendToServerRef.current) {
          sendToServerRef.current(payload, 0)
        }
      }, 0)
    }
  }, [saveToLocalStorage])

  // Periodic 30-second background sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (latestSnapshotRef.current && user?._id && sendToServerRef.current) {
        sendToServerRef.current(latestSnapshotRef.current, 0)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  // Sync when browser reconnects online
  useEffect(() => {
    const handleOnline = () => {
      const backup = getLocalStorageBackup()
      if (backup && user?._id && sendToServerRef.current) {
        sendToServerRef.current(backup, 0)
      }
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [getLocalStorageBackup, user])

  // Discard / clean up session
  const clearSession = useCallback(async () => {
    clearLocalStorageBackup()
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    latestSnapshotRef.current = null
    if (user?._id) {
      client.delete(`/api/v2/assessments/progress?externalUserId=${user._id}`).catch(() => {})
    }
  }, [clearLocalStorageBackup, user])

  return {
    triggerAutosave,
    getLocalStorageBackup,
    clearLocalStorageBackup,
    clearSession
  }
}
