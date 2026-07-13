import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import BuddyMascot from '../components/BuddyMascot'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area
} from 'recharts'

function formatDuration(ms) {
  if (!ms && ms !== 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function formatTypeBadge(type) {
  if (type === 'FULL') return { label: 'Full Adventure', color: 'bg-purple-500 text-white', icon: '🚀' }
  if (type === 'SCREENING') return { label: 'Screening Quest', color: 'bg-sky-500 text-white', icon: '🌟' }
  if (type === 'PRACTICE') return { label: 'Practice Training', color: 'bg-emerald-500 text-white', icon: '⚡' }
  return { label: type || 'Adventure', color: 'bg-indigo-500 text-white', icon: '🎯' }
}

export default function AssessmentHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('adventures') // 'adventures' | 'badges' | 'charts'

  const downloadPdf = async (assessmentId) => {
    const user = getUser()
    if (!user?._id) return

    try {
      const res = await springClient.get(`/api/v2/ai/reports/${assessmentId}/pdf`, {
        params: { externalUserId: user._id },
        responseType: 'blob'
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `screening_report_${assessmentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF download failed:", err)
      alert("Unable to download PDF. Please try viewing the AI report first.")
    }
  }

  useEffect(() => {
    const user = getUser()
    if (!user?._id) {
      setLoading(false)
      setError('Please sign in to view assessment history.')
      return
    }

    ;(async () => {
      try {
        const res = await springClient.get('/api/v2/assessments/history', {
          params: { externalUserId: user._id },
        })
        setHistory(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'Unable to load history. Is the Phase 2 backend running?'
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white font-kid">
        <BuddyMascot mood="cheerful" size="lg" message="Gathering all your adventure trophies..." />
        <div className="mt-4">
          <LoadingSpinner size={48} />
        </div>
      </div>
    )
  }

  // Calculate statistics
  const totalAdventures = history.length
  const highestScore = totalAdventures > 0
    ? Math.max(...history.map(h => Math.round(h.totalScore ?? 0)), 0)
    : 0
  const avgAccuracy = totalAdventures > 0
    ? Math.round(history.reduce((sum, h) => sum + (h.accuracy ?? 0), 0) / totalAdventures)
    : 0
  const streakCount = totalAdventures > 0 ? Math.min(totalAdventures, 7) : 0

  // Calculate Badges
  const badgesList = [
    {
      id: 'first_quest',
      title: 'First Adventure',
      desc: 'Completed your very first quest',
      icon: '🌟',
      unlocked: totalAdventures >= 1,
      color: 'from-amber-400 to-yellow-500'
    },
    {
      id: 'math_explorer',
      title: 'Math Explorer',
      desc: 'Completed 3 learning quests',
      icon: '🧭',
      unlocked: totalAdventures >= 3,
      color: 'from-sky-400 to-blue-500'
    },
    {
      id: 'high_flyer',
      title: 'High Flyer',
      desc: 'Scored 80% or higher on any quest',
      icon: '🏆',
      unlocked: history.some(h => (h.totalScore ?? 0) >= 80),
      color: 'from-purple-400 to-indigo-500'
    },
    {
      id: 'speed_wizard',
      title: 'Speed Wizard',
      desc: 'Finished a quest in under 3 minutes',
      icon: '⚡',
      unlocked: history.some(h => h.timeTakenMs > 0 && h.timeTakenMs <= 180000),
      color: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'perfect_100',
      title: 'Perfect 100',
      desc: 'Achieved a flawless 100% score',
      icon: '💎',
      unlocked: history.some(h => Math.round(h.totalScore ?? 0) >= 100),
      color: 'from-rose-400 to-pink-500'
    },
    {
      id: 'owl_scholar',
      title: 'Buddy Owl Scholar',
      desc: 'Completed 5+ learning adventures',
      icon: '🦉',
      unlocked: totalAdventures >= 5,
      color: 'from-cyan-400 to-indigo-600'
    }
  ]

  // Prepare chart data (reverse chronological to show chronological order)
  const chartData = [...history].reverse().map((item, idx) => ({
    name: `Quest #${idx + 1}`,
    date: item.completedAt ? new Date(item.completedAt).toLocaleDateString() : `Q${idx + 1}`,
    score: Math.round(item.totalScore ?? 0),
    accuracy: Math.round(item.accuracy ?? 0)
  }))

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white text-gray-800 font-kid">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center sm:text-left">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                🏆 Trophies & Journey
              </span>
              <h1 className="text-3xl sm:text-4xl font-black drop-shadow-sm">
                My Adventure History
              </h1>
              <p className="text-white/90 text-sm sm:text-base mt-1 max-w-lg">
                Look back at every quest you completed! See your scores, review insights, and collect shiny badges!
              </p>
            </div>
            <BuddyMascot
              mood="celebrate"
              size="lg"
              message={totalAdventures > 0 ? `Wow! You've done ${totalAdventures} adventure${totalAdventures > 1 ? 's' : ''}!` : "Let's start your adventure!"}
              className="flex-shrink-0"
            />
          </div>
        </motion.div>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-5 shadow-md border-2 border-sky-100 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-2xl shadow-inner">
              🚀
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Total Quests</p>
              <p className="text-2xl sm:text-3xl font-black text-sky-600">{totalAdventures}</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-5 shadow-md border-2 border-amber-100 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Highest Score</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-500">{highestScore}%</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-5 shadow-md border-2 border-emerald-100 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl shadow-inner">
              🎯
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Avg Accuracy</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{avgAccuracy}%</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-5 shadow-md border-2 border-purple-100 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl shadow-inner">
              🔥
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Quest Streak</p>
              <p className="text-2xl sm:text-3xl font-black text-purple-600">{streakCount} 🔥</p>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        {totalAdventures > 0 && (
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveTab('adventures')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'adventures'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              🚀 Adventure Cards ({totalAdventures})
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'badges'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              🏅 My Badges
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'charts'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📈 Progress Charts
            </button>
          </div>
        )}

        {/* Empty State Illustration */}
        {!error && totalAdventures === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-10 shadow-lg border-2 border-dashed border-indigo-200 text-center max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-indigo-50 rounded-full flex items-center justify-center text-5xl">
              🗺️
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">
              Your Adventure Journal is Empty!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ready to embark on your first math journey? Complete a quest to unlock trophies, charts, and personalized insights!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/assessment"
                className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                🚀 Start Screening Quest
              </Link>
              <Link
                to="/activities"
                className="px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-all"
              >
                🎮 Explore Fun Activities
              </Link>
            </div>
          </motion.div>
        )}

        {/* Content Section: Adventure Cards */}
        {totalAdventures > 0 && activeTab === 'adventures' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {history.map((item, index) => {
                const badge = formatTypeBadge(item.assessmentType)
                const scoreVal = Math.round(item.totalScore ?? 0)
                const accuracyVal = Math.round(item.accuracy ?? 0)

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl border-2 border-indigo-100 flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Top Bar: Badge & Date */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${badge.color}`}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '—'}
                        </span>
                      </div>

                      {/* Main Score Ring & Trophy */}
                      <div className="flex items-center gap-4 py-3 bg-gradient-to-r from-sky-50 to-indigo-50/60 rounded-2xl p-4 mb-4 border border-sky-100">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-black text-indigo-600">{scoreVal}%</span>
                          <span className="text-[10px] font-bold uppercase text-gray-400">Score</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-gray-800">
                            {scoreVal >= 80 ? '🌟 Excellent Adventure!' : scoreVal >= 60 ? '👍 Great Effort!' : '🎯 Good Practice!'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Accuracy: <strong className="text-gray-700">{accuracyVal}%</strong>
                          </p>
                        </div>
                      </div>

                      {/* Info Chips */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 mb-5">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-2">
                          <span>⏱️</span>
                          <span>Time: {formatDuration(item.timeTakenMs)}</span>
                        </div>
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-2">
                          <span>📊</span>
                          <span>Level: {item.avgDifficulty != null ? `Lv ${item.avgDifficulty}` : 'Standard'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Preserve exact functionality */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Link
                        to={`/ai-report/${item.id}`}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs text-center rounded-xl shadow hover:opacity-95 transition-all"
                      >
                        🧠 View AI Report
                      </Link>
                      <button
                        onClick={() => downloadPdf(item.id)}
                        title="Download Report PDF"
                        className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        <span>📥</span>
                        <span>PDF</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Content Section: Badges */}
        {totalAdventures > 0 && activeTab === 'badges' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-indigo-100">
            <h3 className="text-xl font-black text-gray-800 mb-2">
              🏅 My Trophy Cabinet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Complete quests and reach special milestones to unlock all your adventure badges!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {badgesList.map((b) => (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    b.unlocked
                      ? 'bg-gradient-to-r from-white to-sky-50/50 border-sky-200 shadow-md'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
                    b.unlocked ? 'bg-gradient-to-br ' + b.color + ' text-white shadow-md' : 'bg-gray-200'
                  }`}>
                    {b.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-gray-800">{b.title}</h4>
                      {b.unlocked ? (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                          Unlocked!
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-bold">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Section: Charts */}
        {totalAdventures > 0 && activeTab === 'charts' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-indigo-100 space-y-6">
            <div>
              <h3 className="text-xl font-black text-gray-800 mb-1">
                📈 Score & Accuracy Journey
              </h3>
              <p className="text-sm text-gray-500">
                Watch your number powers climb higher with each adventure!
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="accColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <YAxis domain={[0, 100]} stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" name="Total Score %" />
                  <Area type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#accColor)" name="Accuracy %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
