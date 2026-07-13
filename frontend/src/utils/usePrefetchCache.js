import { useRef, useCallback } from 'react'
import client from '../api/springClient'
import { perfLogger } from './performanceMetrics'

/**
 * Custom hook for adaptive question prefetching & caching.
 * Guarantees <10ms instantaneous question transitions and ALWAYS returns a valid question object.
 */
export function usePrefetchCache() {
  // Map<difficultyLevel (1..5), Array<QuestionObject>>
  const cacheRef = useRef(new Map([
    [1, []],
    [2, []],
    [3, []],
    [4, []],
    [5, []],
  ]))

  // Tracks IDs served or cached in this session to prevent duplicate questions
  const servedIdsRef = useRef(new Set())
  const inFlightRef = useRef(new Set())

  // Helper: record ID to prevent duplicates
  const markIdServed = (q) => {
    if (q?.id) servedIdsRef.current.add(String(q.id))
    if (q?.localId) servedIdsRef.current.add(String(q.localId))
  }

  // Helper: validate question object
  const isValidQuestion = (q) => {
    return q &&
      typeof q === 'object' &&
      q.correctAnswer !== undefined &&
      q.correctAnswer !== null &&
      q.questionText &&
      Array.isArray(q.options) &&
      q.options.length > 0
  }

  // Tracks difficulties that returned 204 No Content so we never loop requesting them
  const exhaustedDifficultiesRef = useRef(new Set())

  // Background fetcher for a specific difficulty level
  const fetchQuestionBackground = useCallback(async (difficulty) => {
    const diffKey = Math.min(5, Math.max(1, difficulty))
    if (inFlightRef.current.has(diffKey) || exhaustedDifficultiesRef.current.has(diffKey)) return

    const currentQueue = cacheRef.current.get(diffKey) || []
    if (currentQueue.length >= 3) return

    inFlightRef.current.add(diffKey)
    const startTime = performance.now()

    try {
      const excludeIds = Array.from(servedIdsRef.current).join(',')
      const res = await client.get('/api/v2/questions/adaptive', {
        params: {
          difficultyLevel: diffKey,
          excludeIds
        }
      })

      const durationMs = performance.now() - startTime
      perfLogger.logApiFetch('GET /api/v2/questions/adaptive', durationMs, true)

      if (res.status === 204) {
        exhaustedDifficultiesRef.current.add(diffKey)
        return
      }

      if (res.status === 200 && res.data && res.data.id) {
        const dbQ = res.data
        if (!servedIdsRef.current.has(String(dbQ.id)) && dbQ.correctAnswer !== undefined && dbQ.correctAnswer !== null) {
          const formattedQ = {
            id: dbQ.id,
            localId: `db-${dbQ.id}`,
            questionType: dbQ.questionType || 'arithmetic',
            questionText: dbQ.questionText || 'Solve the problem:',
            options: Array.isArray(dbQ.options) ? dbQ.options.map(opt => ({ text: opt })) : [{ text: String(dbQ.correctAnswer) }],
            correctAnswer: String(dbQ.correctAnswer),
            difficulty: diffKey
          }
          if (isValidQuestion(formattedQ)) {
            // Do NOT mark served here; only mark served when actually popped & displayed
            const queue = cacheRef.current.get(diffKey) || []
            queue.push(formattedQ)
            cacheRef.current.set(diffKey, queue)
          }
        }
      }
    } catch (_err) {
      const durationMs = performance.now() - startTime
      perfLogger.logApiFetch('GET /api/v2/questions/adaptive', durationMs, false)
    } finally {
      inFlightRef.current.delete(diffKey)
    }
  }, [])

  // Prefetch questions for target difficulty and adjacent difficulties
  const prefetchAdjacent = useCallback((currentDifficulty) => {
    const diff = Math.min(5, Math.max(1, currentDifficulty))
    // Trigger background fetches (fire-and-forget)
    fetchQuestionBackground(diff)
    if (diff < 5) fetchQuestionBackground(diff + 1)
    if (diff > 1) fetchQuestionBackground(diff - 1)
  }, [fetchQuestionBackground])

  // Synchronous, instantaneous (<10ms) pop from cache or local fallback
  const popQuestionSync = useCallback((difficulty, questionIndex) => {
    const diff = Math.min(5, Math.max(1, difficulty))
    const queue = cacheRef.current.get(diff) || []

    let selectedQ = null
    let wasCacheHit = false

    // Pop first valid question from queue
    while (queue.length > 0 && !selectedQ) {
      const candidate = queue.shift()
      if (isValidQuestion(candidate)) {
        selectedQ = candidate
        wasCacheHit = true
      } else {
        console.warn('[Assessment Cache] Discarded invalid question from queue:', candidate)
      }
    }

    // Fallback if cache empty or invalid
    if (!selectedQ) {
      selectedQ = generateAdaptiveQuestionFallback(diff, questionIndex)
      wasCacheHit = false
    }

    // Final safety guard: ensure selectedQ is 100% valid
    if (!isValidQuestion(selectedQ)) {
      console.error('[Assessment Cache] Produced invalid question object, generating safe arithmetic fallback:', selectedQ)
      selectedQ = generateArithmetic(diff, questionIndex)
      wasCacheHit = false
    }

    markIdServed(selectedQ)

    // Fire background prefetch asynchronously only if more questions are needed
    if (questionIndex < 7) {
      setTimeout(() => {
        prefetchAdjacent(diff)
      }, 0)
    }

    return { question: selectedQ, wasCacheHit }
  }, [prefetchAdjacent])

  // Restore cache or mark existing session IDs served
  const registerExistingQuestions = useCallback((questions) => {
    if (Array.isArray(questions)) {
      questions.forEach(q => markIdServed(q))
    }
  }, [])

  return {
    popQuestionSync,
    prefetchAdjacent,
    registerExistingQuestions
  }
}

/* ================= LOCAL ADAPTIVE GENERATOR FALLBACK ================= */

export function generateAdaptiveQuestionFallback(difficulty, idx) {
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
    localId: `img-${idx}-${Date.now()}`,
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
    localId: `shape-${idx}-${Date.now()}`,
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
    localId: `q-${idx}-${Date.now()}`,
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
