import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import StudentIdCard from '../components/StudentIdCard'
import BuddyMascot from '../components/BuddyMascot'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts'

function formatTime(ms) {
  if (!ms && ms !== 0) return '—'
  const seconds = (ms / 1000).toFixed(1)
  return `${seconds}s`
}

function formatTopicName(topic) {
  if (!topic || topic === '—') return '—'
  return topic.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function ProgressDashboard() {
  const [data, setData] = useState(null)
  const [periodType, setPeriodType] = useState('weekly')
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    const user = getUser()
    if (!user?._id) {
      setError('Please sign in to view your progress.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await springClient.get('/api/v2/progress/dashboard', {
        params: {
          externalUserId: user._id,
          periodType: periodType
        }
      })
      setData(res.data)

      // Fetch achievements
      const achRes = await springClient.get('/api/v2/achievements', {
        params: { externalUserId: user._id }
      })
      setAchievements(achRes.data)

      setError('')
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to load progress. Is the Spring Boot backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [periodType])

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-indigo-50">
        <BuddyMascot mood="cheerful" size="lg" message="Loading your fun adventure..." />
        <div className="mt-4">
          <LoadingSpinner size={48} />
        </div>
      </div>
    )
  }

  // Map topic breakdown data for chart rendering
  const topicChartData = data?.topicBreakdown
    ? Object.keys(data.topicBreakdown).map(key => ({
        name: formatTopicName(key),
        accuracy: data.topicBreakdown[key].accuracy,
        count: data.topicBreakdown[key].count
      })).sort((a, b) => b.accuracy - a.accuracy)
    : []

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white text-gray-800 font-kid">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Playful Hero Banner */}
        <div className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center sm:text-left">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                🌟 Student Adventure Map
              </span>
              <h1 className="text-3xl sm:text-4xl font-black drop-shadow-sm">
                My Learning Dashboard
              </h1>
              <p className="text-white/90 text-sm sm:text-base mt-1 max-w-lg">
                Explore your star progress, unlock cool badges, and practice your number superpowers!
              </p>
            </div>
            <BuddyMascot
              mood="celebrate"
              size="lg"
              message="You are doing super awesome! Keep going! 🚀"
            />
          </div>
        </div>

        {/* Period Selector & Passport */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-auto">
            <StudentIdCard student={getUser()} />
          </div>

          <div className="flex bg-white rounded-2xl p-1.5 shadow-md border-2 border-indigo-100">
            {['daily', 'weekly', 'monthly'].map(type => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-150 ${
                  periodType === type
                    ? 'bg-kid-blue text-white shadow-duo-blue'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        {data && (
          <>
            {/* Colorful Gamified Stats Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Card 1: Star Scores */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border-b-8 border-yellow-400 flex flex-col justify-between transform transition hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-yellow-600 uppercase tracking-widest bg-yellow-100 px-3 py-1 rounded-full">
                      ⭐ Star Accuracy
                    </span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900">{Math.round(data.averageScore)}%</span>
                    <span className="text-sm text-gray-500 font-bold">average</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t-2 border-yellow-50">
                  <div className="bg-green-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-green-700 block">🏆 Best Score</span>
                    <span className="text-base font-black text-green-600">{Math.round(data.bestScore)}%</span>
                  </div>
                  <div className="bg-orange-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-orange-700 block">⚡ Keep Trying</span>
                    <span className="text-base font-black text-orange-600">{Math.round(data.lowestScore)}%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Speedy Numbers */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border-b-8 border-sky-400 flex flex-col justify-between transform transition hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-sky-700 uppercase tracking-widest bg-sky-100 px-3 py-1 rounded-full">
                      🚀 Lightning Speed
                    </span>
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900">{formatTime(data.fastestResponseMs)}</span>
                    <span className="text-sm text-gray-500 font-bold">fastest answer</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t-2 border-sky-50">
                  <div className="bg-sky-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-sky-700 block">🐢 Careful Pace</span>
                    <span className="text-base font-black text-sky-600">{formatTime(data.slowestResponseMs)}</span>
                  </div>
                  <div className="bg-indigo-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">🧩 Total Qs</span>
                    <span className="text-base font-black text-indigo-600">{data.totalAssessments * 8}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Adventure Quests */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border-b-8 border-green-400 flex flex-col justify-between transform transition hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-green-700 uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full">
                      🎮 Quests Played
                    </span>
                    <span className="text-2xl">🌟</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900">{data.totalAssessments}</span>
                    <span className="text-sm text-gray-500 font-bold">completed</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t-2 border-green-50">
                  <div className="bg-purple-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">🎯 Practice Runs</span>
                    <span className="text-base font-black text-purple-600">{data.totalPracticeSessions}</span>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">💪 Focus Area</span>
                    <span className="text-sm font-black text-rose-600 truncate block max-w-[120px]" title={formatTopicName(data.weakestTopic)}>
                      {formatTopicName(data.weakestTopic)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Accuracy & Speed Trend */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📈</span>
                  <h3 className="text-lg font-black text-gray-900">My Learning Curve ({periodType})</h3>
                </div>
                {data.trends.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-sky-50/50 rounded-2xl border-2 border-dashed border-sky-200">
                    <span className="text-4xl mb-2">🎈</span>
                    <p className="font-bold text-gray-600">No trend chart yet!</p>
                    <p className="text-xs text-gray-500 mt-1">Complete a fun assessment quest to see your power chart!</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="label" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={11} unit="s" tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '2px solid #e0f2fe', fontWeight: 'bold' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="accuracy"
                          name="Star Accuracy (%)"
                          stroke="#1CB0F6"
                          strokeWidth={4}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="responseTimeSeconds"
                          name="Speed (sec)"
                          stroke="#FF9600"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Chart 2: Strengths & Weaknesses by Topic */}
              <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🧩</span>
                  <h3 className="text-lg font-black text-gray-900">Topic Superpowers</h3>
                </div>
                {topicChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-sky-50/50 rounded-2xl border-2 border-dashed border-sky-200">
                    <span className="text-4xl mb-2">🧸</span>
                    <p className="font-bold text-gray-600">No topic stars unlocked yet!</p>
                    <p className="text-xs text-gray-500 mt-1">Play games or assessments to reveal your superpowers!</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '2px solid #e0f2fe', fontWeight: 'bold' }} />
                        <Bar dataKey="accuracy" name="Accuracy" radius={[10, 10, 0, 0]}>
                          {topicChartData.map((entry, index) => {
                            let color = '#1CB0F6' // blue
                            if (entry.accuracy >= 75) color = '#58CC02' // strong: green
                            else if (entry.accuracy < 60) color = '#FF4B4B' // weak: pink/red
                            return <Cell key={`cell-${index}`} fill={color} />
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </div>

            {/* Custom List of Topics details */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border-2 border-indigo-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span>🏅</span>
                  <span>Skill Badge Board</span>
                </h3>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Keep Practicing!
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(data.topicBreakdown).map(key => {
                  const item = data.topicBreakdown[key]
                  const name = formatTopicName(key)
                  const isWeak = item.accuracy < 60
                  const isStrong = item.accuracy >= 75

                  let statusText = '👍 On Track'
                  let statusClass = 'bg-sky-100 text-sky-700 border-sky-300'
                  let badgeIcon = '⭐'
                  if (isWeak) {
                    statusText = '🌱 Keep Growing'
                    statusClass = 'bg-rose-100 text-rose-700 border-rose-300'
                    badgeIcon = '💡'
                  } else if (isStrong) {
                    statusText = '👑 Super Star'
                    statusClass = 'bg-green-100 text-green-700 border-green-300'
                    badgeIcon = '🌟'
                  }

                  return (
                    <div key={key} className="p-4 rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-white to-sky-50/30 flex justify-between items-center shadow-sm hover:shadow-md transition">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{badgeIcon}</span>
                        <div>
                          <span className="font-black block text-sm sm:text-base text-gray-900">{name}</span>
                          <span className="text-xs font-bold text-gray-500">{item.count} questions solved</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black block text-gray-900">{Math.round(item.accuracy)}%</span>
                        <span className={`text-[11px] font-black px-2.5 py-1 border-2 rounded-xl block mt-1 ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Achievements Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border-2 border-indigo-100">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-3xl">🏆</span>
                <div>
                  <h3 className="text-xl font-black text-gray-900">My Trophy Case & Badges</h3>
                  <p className="text-xs font-bold text-gray-500">Collect cool trophies by completing number challenges!</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievements.map(ach => {
                  return (
                    <div
                      key={ach.key}
                      className={`p-5 rounded-3xl border-2 flex flex-col items-center text-center space-y-2 transition transform hover:-translate-y-1 ${
                        ach.earned
                          ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-300 shadow-md'
                          : 'bg-gray-100/70 border-gray-200 opacity-60'
                      }`}
                    >
                      <span className="text-4xl">{ach.earned ? ach.icon : '🔒'}</span>
                      <div>
                        <span className={`font-black block text-base ${ach.earned ? 'text-gray-900' : 'text-gray-400'}`}>
                          {ach.title}
                        </span>
                        <span className="text-xs font-bold text-gray-500 block leading-tight mt-1">
                          {ach.description}
                        </span>
                      </div>
                      {ach.earned ? (
                        <span className="text-xs font-black uppercase tracking-wider bg-green-500 text-white shadow-duo-green px-3 py-1 rounded-full">
                          ⭐ Unlocked!
                        </span>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-wider bg-gray-200 text-gray-500 px-3 py-1 rounded-full">
                          Locked
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </>
        )}

        {/* Action Callouts */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center py-6">
          <Link
            to="/assessment"
            className="kid-btn-primary text-lg"
          >
            <span>🚀 Start Adventure Quest</span>
          </Link>
          <Link
            to="/activities"
            className="kid-btn-blue text-lg"
          >
            <span>🎮 Fun Practice Games</span>
          </Link>
        </div>

        {/* disclaimer disclaimer */}
        <p className="text-center text-xs text-gray-500 border-t border-gray-200 pt-6 mt-8">
          This is an educational screening tool, not a medical diagnosis of dyscalculia.
        </p>

      </div>
    </div>
  )
}
