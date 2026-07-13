import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  const topicColors = {
    high: '#3b82f6', // blue
    medium: '#60a5fa',
    low: '#93c5fd'
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
    <div className="min-h-screen p-6 bg-gray-50 text-black">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-black tracking-tight">Progress Dashboard</h2>
            <p className="text-gray-600 text-sm mt-1">
              Analyze your arithmetic achievements and track improvements over time.
            </p>
          </div>
          
          {/* Trend Period Toggle */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {['daily', 'weekly', 'monthly'].map(type => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                  periodType === type
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
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
            {/* Stats Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Card 1: Scores */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Scores</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">{Math.round(data.averageScore)}%</span>
                    <span className="text-xs text-gray-500 font-medium">avg score</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Best</span>
                    <span className="text-sm font-bold text-green-600">{Math.round(data.bestScore)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Lowest</span>
                    <span className="text-sm font-bold text-red-500">{Math.round(data.lowestScore)}%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Response Speeds */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Response Speed</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">{formatTime(data.fastestResponseMs)}</span>
                    <span className="text-xs text-gray-500 font-medium">fastest response</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Slowest</span>
                    <span className="text-sm font-bold text-orange-500">{formatTime(data.slowestResponseMs)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Qs</span>
                    <span className="text-sm font-bold text-black">{data.totalAssessments * 8}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Overview Activity */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Learning Activity</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">{data.totalAssessments}</span>
                    <span className="text-xs text-gray-500 font-medium">assessments</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Practice Runs</span>
                    <span className="text-sm font-bold text-primary">{data.totalPracticeSessions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Weakest Area</span>
                    <span className="text-sm font-bold text-red-500 truncate block max-w-[120px]" title={formatTopicName(data.weakestTopic)}>
                      {formatTopicName(data.weakestTopic)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Accuracy & Speed Trend */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-bold text-black mb-4">Accuracy & Speed Trend ({periodType})</h3>
                {data.trends.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Not enough trend data. Complete more assessments!
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} domain={[0, 100]} unit="%" tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={10} unit="s" tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="accuracy"
                          name="Accuracy (%)"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="responseTimeSeconds"
                          name="Speed (sec)"
                          stroke="#f97316"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Chart 2: Strengths & Weaknesses by Topic */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-base font-bold text-black mb-4">Accuracy by Learning Topic</h3>
                {topicChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    No topic stats recorded yet.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} domain={[0, 100]} unit="%" tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                        <Bar dataKey="accuracy" name="Accuracy" radius={[6, 6, 0, 0]}>
                          {topicChartData.map((entry, index) => {
                            let color = '#93c5fd'
                            if (entry.accuracy >= 75) color = '#22c55e' // strong: green
                            else if (entry.accuracy < 60) color = '#ef4444' // weak: red
                            else color = '#3b82f6' // medium: blue
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Topic Master Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(data.topicBreakdown).map(key => {
                  const item = data.topicBreakdown[key]
                  const name = formatTopicName(key)
                  const isWeak = item.accuracy < 60
                  const isStrong = item.accuracy >= 75

                  let statusText = 'On Track'
                  let statusClass = 'bg-blue-50 text-blue-600 border-blue-200'
                  if (isWeak) {
                    statusText = 'Needs Practice'
                    statusClass = 'bg-red-50 text-red-600 border-red-200'
                  } else if (isStrong) {
                    statusText = 'Proficient'
                    statusClass = 'bg-green-50 text-green-600 border-green-200'
                  }

                  return (
                    <div key={key} className="p-4 rounded-xl border border-gray-200 bg-white flex justify-between items-center shadow-xs">
                      <div>
                        <span className="font-semibold block text-sm text-black">{name}</span>
                        <span className="text-xs text-gray-500">{item.count} questions answered</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black block text-black">{Math.round(item.accuracy)}%</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Achievements Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Your Badges & Achievements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievements.map(ach => {
                  return (
                    <div
                      key={ach.key}
                      className={`p-4 rounded-xl border flex flex-col items-center text-center space-y-2 transition ${
                        ach.earned
                          ? 'bg-white border-primary/20 shadow-sm'
                          : 'bg-gray-100/50 border-gray-100 opacity-50'
                      }`}
                    >
                      <span className="text-3xl">{ach.earned ? ach.icon : '🔒'}</span>
                      <div>
                        <span className={`font-bold block text-sm ${ach.earned ? 'text-black' : 'text-gray-400'}`}>
                          {ach.title}
                        </span>
                        <span className="text-[10px] text-gray-500 block leading-tight mt-1">
                          {ach.description}
                        </span>
                      </div>
                      {ach.earned ? (
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                          Earned
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center py-4">
          <Link to="/assessment" className="px-6 py-3 bg-primary text-white text-center rounded-xl font-bold shadow-md hover:bg-primary/95 transition">
            Take Assessment
          </Link>
          <Link to="/practice" className="px-6 py-3 border border-gray-300 bg-white text-black text-center rounded-xl font-bold hover:bg-gray-50 transition">
            Personalized Practice
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
