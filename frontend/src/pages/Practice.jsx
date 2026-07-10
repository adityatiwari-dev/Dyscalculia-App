import { useState } from 'react'
import { Link } from 'react-router-dom'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

const TOPICS = [
  'ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION',
  'PLACE_VALUE', 'NUMBER_SENSE', 'COMPARISON', 'PATTERN_RECOGNITION',
]

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']

function formatTopic(t) {
  return String(t).toLowerCase().replace(/_/g, ' ')
}

export default function Practice() {
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [selectedTopics, setSelectedTopics] = useState([])
  const [phase, setPhase] = useState('setup') // setup | quiz | review
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answerKey, setAnswerKey] = useState({})
  const [answers, setAnswers] = useState({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [submitResult, setSubmitResult] = useState(null)

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const startPractice = async () => {
    setError('')
    setLoading(true)
    const user = getUser()
    try {
      const res = await springClient.post('/api/v2/practice/generate', {
        externalUserId: user._id,
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
        difficulty,
        countPerTopic: 10,
      })
      setSessionId(res.data.sessionId)
      setQuestions(res.data.questions || [])
      setAnswerKey(res.data.answerKey || {})
      setAnswers({})
      setQuestionIndex(0)
      setSubmitResult(null)
      setPhase('quiz')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate practice questions')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (value) => {
    const q = questions[questionIndex]
    if (!q) return
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1)
    } else {
      finishQuiz({ ...answers, [q.id]: value })
    }
  }

  const finishQuiz = async (finalAnswers) => {
    setLoading(true)
    setError('')
    const user = getUser()
    try {
      const payload = {
        sessionId,
        externalUserId: user._id,
        answers: Object.entries(finalAnswers).map(([questionId, userAnswer]) => ({
          questionId,
          userAnswer,
        })),
      }
      const res = await springClient.post('/api/v2/practice/submit', payload)
      setSubmitResult(res.data)
      setPhase('review')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit practice')
    } finally {
      setLoading(false)
    }
  }

  const current = questions[questionIndex]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-4xl w-full kid-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-black">Personalized Practice</h2>
          <Link to="/activities" className="text-primary text-sm font-semibold">← Activities</Link>
        </div>

        <p className="text-sm text-black mb-4">
          10 questions per weak topic. Answers are checked at the end — not a medical diagnosis.
        </p>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        {phase === 'setup' && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-black mb-2">Difficulty</div>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium ${
                      difficulty === d ? 'bg-primary text-white border-primary' : 'text-black'
                    }`}
                  >
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-black mb-2">
                Topics (leave empty to use AI-detected weak areas)
              </div>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTopic(t)}
                    className={`px-3 py-1 rounded-lg border text-xs ${
                      selectedTopics.includes(t)
                        ? 'bg-primary/20 border-primary text-black'
                        : 'text-black'
                    }`}
                  >
                    {formatTopic(t)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startPractice}
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size={20} /> : 'Generate & Start Practice'}
            </button>
          </div>
        )}

        {phase === 'quiz' && current && (
          <div>
            <div className="text-sm text-black mb-3">
              Question {questionIndex + 1} of {questions.length} · {formatTopic(current.topic)}
            </div>
            <div className="text-xl font-medium text-black mb-4">{current.questionText}</div>
            <div className="grid grid-cols-2 gap-3">
              {(current.options || []).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(opt)}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl border-2 border-gray-300 hover:border-primary text-black font-medium"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'review' && submitResult && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-black">
                {Math.round(submitResult.accuracyPercent)}%
              </div>
              <div className="text-sm text-black">
                {submitResult.correctCount} / {submitResult.totalQuestions} correct
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(submitResult.results || []).map((r) => (
                <div
                  key={r.questionId}
                  className={`p-3 rounded-lg text-sm ${
                    r.correct ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="font-medium text-black">{r.questionText}</div>
                  <div className="text-black">
                    Your answer: <strong>{r.userAnswer || '—'}</strong> · Correct:{' '}
                    <strong>{r.correctAnswer}</strong>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('setup')}
              className="w-full py-3 border rounded-xl text-black font-medium"
            >
              Practice Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
