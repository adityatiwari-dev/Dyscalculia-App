import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import BuddyMascot from '../components/BuddyMascot'

const TOPICS = [
  { id: 'ADDITION', name: 'Addition', icon: '➕', color: 'from-sky-400 to-blue-500' },
  { id: 'SUBTRACTION', name: 'Subtraction', icon: '➖', color: 'from-amber-400 to-orange-500' },
  { id: 'MULTIPLICATION', name: 'Multiplication', icon: '✖️', color: 'from-purple-400 to-indigo-500' },
  { id: 'DIVISION', name: 'Division', icon: '➗', color: 'from-rose-400 to-pink-500' },
  { id: 'PLACE_VALUE', name: 'Place Value', icon: '🔢', color: 'from-emerald-400 to-teal-500' },
  { id: 'NUMBER_SENSE', name: 'Number Sense', icon: '🧠', color: 'from-cyan-400 to-blue-600' },
  { id: 'COMPARISON', name: 'Comparison', icon: '⚖️', color: 'from-yellow-400 to-amber-600' },
  { id: 'PATTERN_RECOGNITION', name: 'Patterns', icon: '🎨', color: 'from-fuchsia-400 to-purple-600' },
]

const DIFFICULTIES = [
  {
    id: 'EASY',
    title: 'Warm-Up Cadet',
    subtitle: 'Gentle & Friendly',
    desc: 'Relaxed questions to warm up your number powers.',
    icon: '🌱',
    colorClass: 'border-emerald-300 bg-emerald-50/50 text-emerald-800',
    selectedClass: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-lg'
  },
  {
    id: 'MEDIUM',
    title: 'Adventure Ranger',
    subtitle: 'Standard Explorer',
    desc: 'Balanced fun challenge for daily math training.',
    icon: '🧭',
    colorClass: 'border-sky-300 bg-sky-50/50 text-sky-800',
    selectedClass: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white border-indigo-600 shadow-lg'
  },
  {
    id: 'HARD',
    title: 'Master Wizard',
    subtitle: 'Brain Hero',
    desc: 'Tricky number puzzles for ultimate math champions.',
    icon: '🧙‍♂️',
    colorClass: 'border-purple-300 bg-purple-50/50 text-purple-800',
    selectedClass: 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white border-purple-700 shadow-lg'
  }
]

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

  const toggleTopic = (topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
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
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white text-gray-800 font-kid">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Training Academy Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
                  🎓 Number Buddies Training Academy
                </span>
                <Link
                  to="/activities"
                  className="px-3 py-1 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-full text-xs font-bold text-white transition-all"
                >
                  ← Back to Activities
                </Link>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black drop-shadow-sm">
                Personalized Training Quest
              </h1>
              <p className="text-white/90 text-sm sm:text-base mt-1 max-w-lg">
                Level up your number skills! Choose your quest rank and focus topics, or let your AI Buddy design a custom training mission!
              </p>
            </div>
            <BuddyMascot
              mood="cheerful"
              size="lg"
              message="Let's train your brain powers!"
              className="flex-shrink-0"
            />
          </div>
        </motion.div>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        {/* SETUP PHASE */}
        {phase === 'setup' && (
          <div className="space-y-8">

            {/* Learning Path Visualization & Rewards Preview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl p-5 border-2 border-sky-100 shadow-md flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-2xl">
                  1️⃣
                </div>
                <div>
                  <h4 className="font-black text-gray-800 text-sm">Pick Your Rank</h4>
                  <p className="text-xs text-gray-500">Choose Warm-Up, Ranger, or Master level.</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl p-5 border-2 border-purple-100 shadow-md flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl">
                  2️⃣
                </div>
                <div>
                  <h4 className="font-black text-gray-800 text-sm">AI Skill Personalization</h4>
                  <p className="text-xs text-gray-500">Focuses on your specific learning goals.</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -3 }}
                className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200 shadow-md flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-2xl shadow">
                  🎁
                </div>
                <div>
                  <h4 className="font-black text-amber-900 text-sm">Rewards Preview</h4>
                  <p className="text-xs text-amber-700 font-bold">+100 XP & ⭐ 3 Golden Stars</p>
                </div>
              </motion.div>
            </div>

            {/* Section 1: Illustrated Rank Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-indigo-100">
              <h3 className="text-xl font-black text-gray-800 mb-2">
                🛡️ Step 1: Choose Your Training Rank
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Pick how fast and challenging you want your training questions to be.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {DIFFICULTIES.map((d) => {
                  const isSelected = difficulty === d.id
                  return (
                    <motion.button
                      key={d.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDifficulty(d.id)}
                      className={`text-left p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                        isSelected ? d.selectedClass : d.colorClass
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl">{d.icon}</span>
                          {isSelected && (
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-black uppercase">
                              Selected ✓
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-black">{d.title}</h4>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          {d.subtitle}
                        </p>
                        <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                          {d.desc}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Section 2: AI Recommendation & Topic Chips */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-indigo-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-800 mb-1">
                    🎯 Step 2: Choose Training Topics
                  </h3>
                  <p className="text-sm text-gray-500">
                    Tap topics you want to practice, or let Buddy Owl pick automatically!
                  </p>
                </div>

                {/* AI Recommendation Banner */}
                <div className={`px-4 py-3 rounded-2xl border-2 flex items-center gap-3 ${
                  selectedTopics.length === 0
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-900 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-600 font-medium'
                }`}>
                  <span className="text-2xl">🤖</span>
                  <div className="text-xs">
                    {selectedTopics.length === 0 ? (
                      <span><strong>AI Auto-Focus Active:</strong> We will automatically train your weak skills!</span>
                    ) : (
                      <span>Custom topics selected ({selectedTopics.length})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Colorful Animated Chips */}
              <div className="flex flex-wrap gap-3 mt-6">
                {TOPICS.map((t) => {
                  const isSelected = selectedTopics.includes(t.id)
                  return (
                    <motion.button
                      key={t.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTopic(t.id)}
                      className={`px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 border-2 transition-all ${
                        isSelected
                          ? `bg-gradient-to-r ${t.color} text-white border-transparent shadow-md`
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span>{t.name}</span>
                      {isSelected && <span className="ml-1 text-xs">✓</span>}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Large Animated Start Training Quest Button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <button
                onClick={startPractice}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white rounded-3xl font-black text-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size={24} />
                    <span>Preparing Your Quest Cards...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl animate-bounce">🚀</span>
                    <span>Start Training Quest</span>
                  </>
                )}
              </button>
            </motion.div>

          </div>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && current && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-indigo-100 max-w-3xl mx-auto"
          >
            {/* Header: Progress & Topic Tag */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                🏷️ Topic: {formatTopic(current.topic)}
              </span>
              <span className="text-sm font-black text-gray-500">
                Question {questionIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Text */}
            <div className="my-8 text-center">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 leading-relaxed">
                {current.questionText}
              </h3>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {(current.options || []).map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectAnswer(opt)}
                  disabled={loading}
                  className="py-4 px-6 rounded-2xl border-2 border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 hover:border-indigo-400 hover:bg-indigo-50 text-gray-800 font-black text-lg shadow-sm transition-all text-center"
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* REVIEW PHASE */}
        {phase === 'review' && submitResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score & Trophy Summary Card */}
            <div className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-3xl p-8 text-white shadow-xl text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl">
                🏆
              </div>
              <h3 className="text-3xl font-black">Quest Completed!</h3>
              <p className="text-white/90 text-sm mt-1">
                You correctly answered {submitResult.correctCount} out of {submitResult.totalQuestions} questions!
              </p>

              <div className="mt-6 inline-block bg-white text-indigo-900 px-8 py-4 rounded-2xl shadow-lg">
                <div className="text-xs font-bold uppercase text-gray-400">Final Accuracy</div>
                <div className="text-4xl font-black text-indigo-600">
                  {Math.round(submitResult.accuracyPercent)}%
                </div>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-indigo-100">
              <h4 className="text-xl font-black text-gray-800 mb-4">
                📋 Detailed Quest Review
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {(submitResult.results || []).map((r, idx) => (
                  <div
                    key={r.questionId}
                    className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      r.correct
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                      <h5 className="font-black text-gray-800 mt-0.5">{r.questionText}</h5>
                    </div>
                    <div className="text-xs sm:text-right">
                      <div>
                        Your answer:{' '}
                        <strong className={r.correct ? 'text-emerald-700' : 'text-rose-600'}>
                          {r.userAnswer || '—'}
                        </strong>
                      </div>
                      {!r.correct && (
                        <div className="text-gray-600 mt-0.5">
                          Correct answer: <strong className="text-emerald-700">{r.correctAnswer}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setPhase('setup')}
                className="flex-1 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black rounded-2xl shadow-lg hover:opacity-95 transition-all text-center"
              >
                🔄 Practice Another Quest
              </button>
              <Link
                to="/activities"
                className="px-8 py-4 bg-white border-2 border-indigo-200 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-all text-center"
              >
                🎮 Back to Activities
              </Link>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
