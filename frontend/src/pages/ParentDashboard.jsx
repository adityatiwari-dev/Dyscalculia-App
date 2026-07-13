import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatTopicName(topic) {
  if (!topic || topic === '—') return '—'
  return topic.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function ParentDashboard() {
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [childDashboard, setChildDashboard] = useState(null)
  const [childHistory, setChildHistory] = useState([])
  const [periodType, setPeriodType] = useState('weekly')
  
  // Link Child form state
  const [childExternalId, setChildExternalId] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [linkError, setLinkError] = useState('')
  
  // Loading & Error states
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  // Selected AI Report Modal state
  const [selectedReport, setSelectedReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')

  // Parent Observations states
  const [observations, setObservations] = useState([])
  const [newObservationText, setNewObservationText] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  const parent = getUser()
  const parentId = parent?._id || parent?.id

  const fetchChildren = async () => {
    if (!parentId) {
      setError('Please sign in to view linked children.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await springClient.get('/api/v2/users/children', {
        params: { parentExternalUserId: parentId }
      })
      setChildren(res.data)
      setError('')
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to fetch linked children. Is phase2-backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLinkChild = async (e) => {
    e.preventDefault()
    setLinkError('')
    setLinkSuccess('')

    if (!childExternalId.trim()) {
      setLinkError("Child ID is required.")
      return
    }

    try {
      await springClient.post('/api/v2/users/link-child', {
        parentExternalUserId: parentId,
        childExternalUserId: childExternalId.trim(),
        studentCode: childExternalId.trim()
      })
      setLinkSuccess(`Successfully linked child: ${childExternalId}`)
      setChildExternalId('')
      await fetchChildren() // refresh list immediately
    } catch (err) {
      setLinkError(
        err?.response?.data?.message ||
        'Unable to link child. Double check the Child ID.'
      )
    }
  }

  const fetchChildDetails = async (child) => {
    setSelectedChild(child)
    setChildDashboard(null)
    setChildHistory([])
    setObservations([])
    setSelectedReport(null)
    setDetailLoading(true)

    try {
      // 1. Fetch dashboard data (Recharts trends & stats)
      const dashRes = await springClient.get('/api/v2/progress/dashboard', {
        params: {
          externalUserId: child.externalUserId,
          periodType: periodType
        }
      })
      setChildDashboard(dashRes.data)

      // 2. Fetch assessment history
      const histRes = await springClient.get('/api/v2/assessments/history', {
        params: { externalUserId: child.externalUserId }
      })
      setChildHistory(histRes.data)

      // 3. Fetch observations
      const obsRes = await springClient.get('/api/v2/observations', {
        params: { studentExternalUserId: child.externalUserId }
      })
      setObservations(obsRes.data)
    } catch (err) {
      console.error("Error loading child details:", err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSaveObservation = async (e) => {
    e.preventDefault()
    if (!newObservationText.trim()) return

    setSubmittingNote(true)
    try {
      const res = await springClient.post('/api/v2/observations', {
        studentExternalUserId: selectedChild.externalUserId,
        parentExternalUserId: parentId,
        observationText: newObservationText.trim()
      })
      setObservations(prev => [res.data, ...prev])
      setNewObservationText('')
    } catch (err) {
      console.error("Failed to save observation note:", err)
    } finally {
      setSubmittingNote(false)
    }
  }

  const viewReport = async (assessmentId) => {
    setReportLoading(true)
    setSelectedReport(null)
    setReportError('')

    try {
      const res = await springClient.get(`/api/v2/ai/reports/${assessmentId}`, {
        params: { externalUserId: selectedChild.externalUserId }
      })
      setSelectedReport(res.data)
    } catch (err) {
      setReportError("AI report is not available for this assessment.")
    } finally {
      setReportLoading(false)
    }
  }

  const handleDownloadPdf = async (assessmentId) => {
    if (!selectedChild?.externalUserId) return

    try {
      const res = await springClient.get(`/api/v2/ai/reports/${assessmentId}/pdf`, {
        params: { externalUserId: selectedChild.externalUserId },
        responseType: 'blob'
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `screening_report_${selectedChild.name.replace(/\s+/g, '_')}_${assessmentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF download failed:", err)
      alert("Unable to download report. Please check if the backend is running.")
    }
  }

  const handleDownloadCsv = async (studentExternalUserId, studentName) => {
    try {
      const res = await springClient.get('/api/v2/progress/export/csv', {
        params: { studentExternalUserId },
        responseType: 'blob'
      })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `assessment_report_${studentName.toLowerCase().replace(/\s+/g, '_')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("CSV export failed:", err)
      alert("Failed to export assessment records as CSV.")
    }
  }

  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    const section = searchParams.get('section')
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [searchParams, selectedChild])

  // Refetch child details if period type changes
  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild)
    }
  }, [periodType])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toUpperCase()) {
      case 'HIGH': return 'bg-red-50 text-red-600 border-red-200'
      case 'MODERATE': return 'bg-orange-50 text-orange-600 border-orange-200'
      case 'LOW': return 'bg-green-50 text-green-600 border-green-200'
      default: return 'bg-gray-50 text-gray-500 border-gray-200'
    }
  }

  const topicChartData = childDashboard?.topicBreakdown
    ? Object.keys(childDashboard.topicBreakdown).map(key => ({
        name: formatTopicName(key),
        accuracy: childDashboard.topicBreakdown[key].accuracy
      })).sort((a, b) => b.accuracy - a.accuracy)
    : []

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-black">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold text-black tracking-tight">Parent Dashboard</h2>
          <p className="text-gray-600 text-sm mt-1">
            Monitor learning speeds, screening assessments, and detailed AI insights for linked children.
          </p>
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        {/* Children Grid and Link Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Children List */}
          <div id="children-section" className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold">Linked Children</h3>
            {children.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-center text-gray-500">
                You have not linked any children profiles yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map(child => {
                  const isSelected = selectedChild?.externalUserId === child.externalUserId
                  return (
                    <button
                      key={child.externalUserId}
                      onClick={() => fetchChildDetails(child)}
                      className={`p-5 rounded-2xl text-left border transition w-full flex flex-col justify-between hover:shadow-md ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-xs'
                          : 'bg-white border-gray-100 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-lg text-black block">{child.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getRiskBadgeClass(child.aiRiskLevel)}`}>
                            {child.aiRiskLevel} RISK
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 block mt-1">Grade {child.grade} · Age {child.age}</span>
                        {child.studentCode && (
                          <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-mono font-bold">
                            ID: {child.studentCode}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Avg Accuracy</span>
                          <span className="font-bold text-black">{Math.round(child.overallAccuracy)}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Latest Test</span>
                          <span className="font-bold text-gray-700 truncate block">
                            {formatDate(child.latestAssessmentDate)}
                          </span>
                        </div>
                        <div className="col-span-2 mt-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Weak Area</span>
                          <span className="font-semibold text-red-500 truncate block max-w-full">
                            {formatTopicName(child.weakestTopic)}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Link Child Form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4 h-fit">
            <h3 className="text-base font-bold text-black">Link Child Profile</h3>
            <p className="text-xs text-gray-500">
              Enter the unique Student ID Code (e.g. NB-X8K9M2) from your child&apos;s passport card.
            </p>
            
            <form onSubmit={handleLinkChild} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="e.g. NB-X8K9M2"
                  value={childExternalId}
                  onChange={(e) => setChildExternalId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase"
                />
              </div>
              
              {linkError && <p className="text-xs text-red-500">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-green-600">{linkSuccess}</p>}
              
              <button
                type="submit"
                className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition"
              >
                Link Child
              </button>
            </form>
          </div>

        </div>

        {/* Selected Child Detail Panel */}
        {selectedChild && (
          <div id="progress-section" className="border-t border-gray-200 pt-6 mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-black">
                Performance Breakdown: <span className="text-primary">{selectedChild.name}</span>
              </h3>
              
              {/* Trend Period Toggle */}
              {childDashboard && (
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                  {['daily', 'weekly', 'monthly'].map(type => (
                    <button
                      key={type}
                      onClick={() => setPeriodType(type)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                        periodType === type
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {detailLoading ? (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner size={36} />
              </div>
            ) : childDashboard ? (
              <div className="space-y-6">
                
                {/* Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Average Score</span>
                    <span className="text-3xl font-black text-black">{Math.round(childDashboard.averageScore)}%</span>
                    <div className="text-[10px] text-gray-400 mt-2 font-medium">Best: {Math.round(childDashboard.bestScore)}% · Lowest: {Math.round(childDashboard.lowestScore)}%</div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Response Speed</span>
                    <span className="text-3xl font-black text-black">{formatTime(childDashboard.fastestResponseMs)}</span>
                    <div className="text-[10px] text-gray-400 mt-2 font-medium">Fastest: {formatTime(childDashboard.fastestResponseMs)} · Slowest: {formatTime(childDashboard.slowestResponseMs)}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Strength / Weakness</span>
                    <div className="flex flex-col mt-1">
                      <span className="text-sm font-bold text-green-600">Strongest: {formatTopicName(childDashboard.strongestTopic)}</span>
                      <span className="text-sm font-bold text-red-500 mt-0.5">Weakest: {formatTopicName(childDashboard.weakestTopic)}</span>
                    </div>
                  </div>
                </div>

                {/* Recharts Graphs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Accuracy Line Chart */}
                  <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
                    <h4 className="text-sm font-bold text-black mb-4">Accuracy & Speed Trend ({periodType})</h4>
                    {childDashboard.trends.length === 0 ? (
                      <div className="h-60 flex items-center justify-center text-gray-400 text-xs">
                        No trend data available.
                      </div>
                    ) : (
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={childDashboard.trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="label" stroke="#9ca3af" fontSize={9} tickLine={false} />
                            <YAxis yAxisId="left" stroke="#3b82f6" fontSize={9} domain={[0, 100]} unit="%" tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={9} unit="s" tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Line yAxisId="left" type="monotone" dataKey="accuracy" name="Accuracy" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                            <Line yAxisId="right" type="monotone" dataKey="responseTimeSeconds" name="Speed" stroke="#f97316" strokeWidth={1.5} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Topic Bar Chart */}
                  <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
                    <h4 className="text-sm font-bold text-black mb-4">Accuracy by Category</h4>
                    {topicChartData.length === 0 ? (
                      <div className="h-60 flex items-center justify-center text-gray-400 text-xs">
                        No topic stats available.
                      </div>
                    ) : (
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topicChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={9} domain={[0, 100]} unit="%" tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                            <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]}>
                              {topicChartData.map((entry, index) => {
                                let color = '#ef4444' // red: weak
                                if (entry.accuracy >= 75) color = '#22c55e' // green: proficient
                                else if (entry.accuracy >= 60) color = '#3b82f6' // blue: average
                                return <Cell key={`cell-${index}`} fill={color} />
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                </div>

                {/* Child Assessment History Section */}
                <div id="reports-section" className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-black">Assessment History & AI Reports</h4>
                    <button
                      onClick={() => handleDownloadCsv(selectedChild.externalUserId, selectedChild.name)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition"
                    >
                      📊 Export to CSV
                    </button>
                  </div>
                  {childHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">No assessments synced yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-black border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <th className="pb-3 pr-2">Date</th>
                            <th className="pb-3 pr-2">Type</th>
                            <th className="pb-3 pr-2">Accuracy</th>
                            <th className="pb-3 pr-2">Avg Speed</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {childHistory.map(row => (
                            <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-3 pr-2 font-medium">{formatDate(row.completedAt)}</td>
                              <td className="py-3 pr-2 capitalize">{row.assessmentType}</td>
                              <td className="py-3 pr-2 font-bold text-primary">{Math.round(row.accuracy)}%</td>
                              <td className="py-3 pr-2">{formatTime(row.timeTakenMs / (row.questionsCount || 8))} / Q</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => viewReport(row.id)}
                                  className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 transition"
                                >
                                  View AI Report
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Parent Observations Section */}
                <div id="recommendations-section" className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
                  <h4 className="text-lg font-bold text-black">Behavior & Progress Observations</h4>
                  
                  <form onSubmit={handleSaveObservation} className="space-y-3">
                    <textarea
                      value={newObservationText}
                      onChange={(e) => setNewObservationText(e.target.value)}
                      placeholder="Add observations about your child's daily interactions with numbers, struggles, or positive breakthroughs..."
                      rows={3}
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs text-black focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingNote || !newObservationText.trim()}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        {submittingNote ? 'Saving...' : 'Add Observation Note'}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logged Notes</h5>
                    {observations.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No notes logged yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {observations.map(obs => (
                          <div key={obs.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                            <p className="text-black leading-relaxed">{obs.observationText}</p>
                            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-medium">
                              <span>By {obs.parentName}</span>
                              <span>{formatDate(obs.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-6 text-center text-gray-400">
                Failed to load child details.
              </div>
            )}
          </div>
        )}

        {/* Modal Overlay for AI Report details */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-black">AI Assessment Analysis</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getRiskBadgeClass(selectedReport.riskLevel)}`}>
                    {selectedReport.riskLevel} RISK LEVEL
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-black text-xl p-1"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 flex-1 text-sm text-black">
                
                {/* Summary Section */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Executive Summary</span>
                  <p className="text-gray-700 leading-relaxed font-medium">{selectedReport.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Strengths */}
                  <div className="p-4 rounded-xl border border-green-100 bg-green-50/20">
                    <span className="text-xs uppercase font-bold text-green-700 block mb-2">Strengths</span>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedReport.strengths.map((str, idx) => (
                        <li key={idx}>{formatTopicName(str)}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-4 rounded-xl border border-red-100 bg-red-50/20">
                    <span className="text-xs uppercase font-bold text-red-700 block mb-2">Areas for Practice</span>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedReport.weakAreas.map((weak, idx) => (
                        <li key={idx}>{formatTopicName(weak)}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Suggestions Section */}
                <div className="space-y-4">
                  
                  {/* Parent suggestions */}
                  <div>
                    <h5 className="font-bold text-black mb-1.5 flex items-center gap-1.5">
                      <span>🏡</span> Suggestions for Parents
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                      {selectedReport.parentSuggestions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Teacher suggestions */}
                  <div>
                    <h5 className="font-bold text-black mb-1.5 flex items-center gap-1.5">
                      <span>🏫</span> Suggestions for Teachers
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                      {selectedReport.teacherSuggestions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Practice Plan */}
                  <div>
                    <h5 className="font-bold text-black mb-1.5 flex items-center gap-1.5">
                      <span>📅</span> Recommended Practice Plan
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                      {selectedReport.practicePlan.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-200 flex flex-col items-center gap-2 bg-gray-50/50">
                <p className="text-[10px] text-gray-400 text-center">
                  This report is an educational observation and screening tool, not a medical diagnosis of dyscalculia.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownloadPdf(selectedReport.assessmentId)}
                    className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary/95 transition"
                  >
                    Download PDF Report
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-black text-xs font-bold rounded-xl transition"
                  >
                    Close Report
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
