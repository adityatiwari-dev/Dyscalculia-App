import { useEffect, useState } from 'react'
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

export default function TeacherDashboard() {
  const [students, setStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDashboard, setStudentDashboard] = useState(null)
  const [studentHistory, setStudentHistory] = useState([])
  const [periodType, setPeriodType] = useState('weekly')
  
  // Link Student form state
  const [studentExternalId, setStudentExternalId] = useState('')
  const [linkClass, setLinkClass] = useState('')
  const [linkSection, setLinkSection] = useState('')
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

  // Student Observations state
  const [observations, setObservations] = useState([])
  const [newObservationText, setNewObservationText] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  const teacher = getUser()

  const fetchStudents = async () => {
    if (!teacher?._id) {
      setError('Please sign in to view assigned students.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await springClient.get('/api/v2/teacher/students', {
        params: { teacherExternalUserId: teacher._id }
      })
      setStudents(res.data)
      setError('')
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to load students list. Is the Spring Boot backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLinkStudent = async (e) => {
    e.preventDefault()
    setLinkError('')
    setLinkSuccess('')

    if (!studentExternalId.trim()) {
      setLinkError("Student ID is required.")
      return
    }

    try {
      await springClient.post('/api/v2/teacher/link-student', {
        teacherExternalUserId: teacher._id,
        studentExternalUserId: studentExternalId.trim(),
        studentCode: studentExternalId.trim(),
        className: linkClass.trim() || null,
        sectionName: linkSection.trim() || null
      })
      setLinkSuccess(`Successfully linked student: ${studentExternalId}`)
      setStudentExternalId('')
      setLinkClass('')
      setLinkSection('')
      fetchStudents() // refresh list
    } catch (err) {
      setLinkError(
        err?.response?.data?.message ||
        'Unable to link student. Double check the Student ID.'
      )
    }
  }

  const fetchStudentDetails = async (student) => {
    setSelectedStudent(student)
    setStudentDashboard(null)
    setStudentHistory([])
    setObservations([])
    setSelectedReport(null)
    setDetailLoading(true)

    try {
      // 1. Fetch dashboard data (Recharts trends & stats)
      const dashRes = await springClient.get('/api/v2/progress/dashboard', {
        params: {
          externalUserId: student.externalUserId,
          periodType: periodType
        }
      })
      setStudentDashboard(dashRes.data)

      // 2. Fetch assessment history
      const histRes = await springClient.get('/api/v2/assessments/history', {
        params: { externalUserId: student.externalUserId }
      })
      setStudentHistory(histRes.data)

      // 3. Fetch observations
      const obsRes = await springClient.get('/api/v2/observations', {
        params: { studentExternalUserId: student.externalUserId }
      })
      setObservations(obsRes.data)
    } catch (err) {
      console.warn("Error fetching student details:", err)
    } finally {
      setDetailLoading(false)
    }
  }

  const viewReport = async (assessmentId) => {
    setReportLoading(true)
    setSelectedReport(null)
    setReportError('')

    try {
      const res = await springClient.get(`/api/v2/ai/reports/${assessmentId}`, {
        params: { externalUserId: selectedStudent.externalUserId }
      })
      setSelectedReport(res.data)
    } catch (err) {
      setReportError("AI report is not available for this assessment.")
    } finally {
      setReportLoading(false)
    }
  }

  const handleDownloadPdf = async (assessmentId) => {
    if (!selectedStudent?.externalUserId) return

    try {
      const res = await springClient.get(`/api/v2/ai/reports/${assessmentId}/pdf`, {
        params: { externalUserId: selectedStudent.externalUserId },
        responseType: 'blob'
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `screening_report_${selectedStudent.name.replace(/\s+/g, '_')}_${assessmentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF download failed:", err)
      alert("Unable to download report.")
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

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetails(selectedStudent)
    }
  }, [periodType])

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.grade && student.grade.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toUpperCase()) {
      case 'HIGH': return 'bg-red-50 text-red-600 border-red-200'
      case 'MODERATE': return 'bg-orange-50 text-orange-600 border-orange-200'
      case 'LOW': return 'bg-green-50 text-green-600 border-green-200'
      default: return 'bg-gray-50 text-gray-500 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, <span className="font-semibold text-black">{teacher?.name}</span>. Monitor and manage your assigned students.
            </p>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Top Grid: Student List & Search + Linking form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Student Directory */}
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <h2 className="text-lg font-bold text-black">Student Directory</h2>
              <input
                type="text"
                placeholder="Search by name or grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl text-gray-400">
                {searchQuery ? 'No matching students found.' : 'No students assigned yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredStudents.map(student => {
                  const isSelected = selectedStudent?.externalUserId === student.externalUserId
                  return (
                    <button
                      key={student.externalUserId}
                      onClick={() => fetchStudentDetails(student)}
                      className={`p-5 rounded-2xl text-left border transition w-full flex flex-col justify-between hover:shadow-md ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-xs'
                          : 'bg-white border-gray-100 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-lg text-black block truncate">{student.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full shrink-0 ${getRiskBadgeClass(student.aiRiskLevel)}`}>
                            {student.aiRiskLevel} RISK
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 block mt-1">Grade {student.grade} · Age {student.age}</span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {student.studentCode && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-mono font-bold">
                              ID: {student.studentCode}
                            </span>
                          )}
                          {student.className && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold">
                              Class: {student.className}
                            </span>
                          )}
                          {student.sectionName && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold">
                              Section: {student.sectionName}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Avg Accuracy</span>
                          <span className="font-bold text-black">{Math.round(student.overallAccuracy)}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Latest Test</span>
                          <span className="font-bold text-gray-700 truncate block">
                            {formatDate(student.latestAssessmentDate)}
                          </span>
                        </div>
                        <div className="col-span-2 mt-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Weak Area</span>
                          <span className="font-semibold text-red-500 truncate block max-w-full">
                            {formatTopicName(student.weakestTopic)}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Link Student Form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4 h-fit">
            <h3 className="text-base font-bold text-black">Link Student</h3>
            <p className="text-xs text-gray-500">
              Enter the unique Student ID Code (e.g. NB-X8K9M2) to link and assign a class.
            </p>
            
            <form onSubmit={handleLinkStudent} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Student ID Code *</label>
                <input
                  type="text"
                  placeholder="e.g. NB-X8K9M2"
                  value={studentExternalId}
                  onChange={(e) => setStudentExternalId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Class / Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. Math 3"
                    value={linkClass}
                    onChange={(e) => setLinkClass(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. Sec A"
                    value={linkSection}
                    onChange={(e) => setSectionName ? setLinkSection(e.target.value) : setLinkSection(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>
              
              {linkError && <p className="text-xs text-red-500">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-green-600">{linkSuccess}</p>}
              
              <button
                type="submit"
                className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition"
              >
                Link Student
              </button>
            </form>
          </div>

        </div>

        {/* Selected Student Detail Panel */}
        {selectedStudent && (
          <div className="border-t border-gray-200 pt-6 mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-black">
                Performance Breakdown: <span className="text-primary">{selectedStudent.name}</span>
              </h3>
              
              {studentDashboard && (
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
              <div className="py-20 flex justify-center">
                <LoadingSpinner size={36} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Metrics Overview */}
                <div className="space-y-6">
                  {studentDashboard && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Assessments</span>
                        <span className="text-2xl font-extrabold text-black mt-1 block">
                          {studentDashboard.assessmentsCompleted || 0}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Avg Accuracy</span>
                        <span className="text-2xl font-extrabold text-primary mt-1 block">
                          {Math.round(studentDashboard.averageAccuracy || 0)}%
                        </span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Completed Practices</span>
                        <span className="text-xl font-bold text-green-600 mt-1 block">
                          {studentDashboard.practiceSessionsCompleted || 0}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Active Streak</span>
                        <span className="text-xl font-bold text-orange-600 mt-1 block">
                          {studentDashboard.activeStreak || 0} days
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Weak topics details */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-black uppercase tracking-wider">Concept Strengths & Weaknesses</h4>
                    {studentDashboard?.topicSummaries && Object.keys(studentDashboard.topicSummaries).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(studentDashboard.topicSummaries).map(([topic, summary]) => {
                          const percent = Math.round(summary.accuracy || 0)
                          const colorClass = percent >= 75 ? 'bg-green-500' : percent >= 45 ? 'bg-orange-500' : 'bg-red-500'
                          return (
                            <div key={topic} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-gray-700">{formatTopicName(topic)}</span>
                                <span className="text-black">{percent}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-4 text-center">No concept stats available yet.</p>
                    )}
                  </div>
                </div>

                {/* Right Recharts Plots */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Accuracy History Line Chart */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-black uppercase tracking-wider">Accuracy Trend</h4>
                    {studentDashboard?.trends && studentDashboard.trends.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={studentDashboard.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="period" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                            <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={10} tickLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                        No trend data available yet.
                      </div>
                    )}
                  </div>

                  {/* History List */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-black uppercase tracking-wider">Assessment History</h4>
                      <button
                        onClick={() => handleDownloadCsv(selectedStudent.externalUserId, selectedStudent.name)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition"
                      >
                        📊 Export to CSV
                      </button>
                    </div>
                    {studentHistory.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">No assessments completed yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-2">Type</th>
                              <th className="py-3 px-2">Score</th>
                              <th className="py-3 px-2">Accuracy</th>
                              <th className="py-3 px-2">Date</th>
                              <th className="py-3 px-2 text-right">Reports</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentHistory.map(record => (
                              <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-3 px-2 font-semibold text-black uppercase">{record.assessmentType}</td>
                                <td className="py-3 px-2 font-medium text-gray-700">{record.totalScore} pts</td>
                                <td className="py-3 px-2 text-primary font-bold">{Math.round(record.accuracy)}%</td>
                                <td className="py-3 px-2 text-gray-500">{formatDate(record.completedAt)}</td>
                                <td className="py-3 px-2 text-right space-x-2">
                                  <button
                                    onClick={() => viewReport(record.id)}
                                    className="px-2.5 py-1 border border-primary text-primary hover:bg-primary/5 rounded-lg font-bold"
                                  >
                                    View Report
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPdf(record.id)}
                                    className="px-2.5 py-1 bg-gray-50 border hover:bg-gray-100 rounded-lg text-gray-700 font-bold"
                                  >
                                    PDF
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Parent Observations logs */}
                  <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
                    <h4 className="text-lg font-bold text-black">Parent Observations & Comments</h4>
                    {observations.length === 0 ? (
                      <p className="text-sm text-gray-500">No observations logged by parents yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {observations.map(obs => (
                          <div key={obs.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">"{obs.observationText}"</p>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                              <span>By Parent: {obs.parentName}</span>
                              <span>{formatDate(obs.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* AI Report View Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
              <button
                onClick={() => setSelectedReport(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-black font-extrabold text-lg"
              >
                ✕
              </button>

              <div>
                <h3 className="text-2xl font-extrabold text-black">Screening Analysis Report</h3>
                <p className="text-xs text-gray-500 mt-1">Student: {selectedStudent?.name}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">AI Screening Risk Level</span>
                  <span className="text-xl font-extrabold text-black uppercase mt-1 block">
                    {selectedReport.riskLevel} Risk
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 border rounded-full uppercase tracking-wider ${getRiskBadgeClass(selectedReport.riskLevel)}`}>
                  {selectedReport.riskLevel}
                </span>
              </div>

              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <div>
                  <h4 className="font-bold text-black uppercase tracking-wider text-xs">Summary Analysis</h4>
                  <p className="mt-1 text-gray-600">{selectedReport.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-red-500 uppercase tracking-wider text-xs">Weak Areas</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-gray-600">
                      {selectedReport.weakAreas?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      )) || <li>None noted</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-600 uppercase tracking-wider text-xs">Strengths</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-gray-600">
                      {selectedReport.strengths?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      )) || <li>None noted</li>}
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold text-black uppercase tracking-wider text-xs">Teacher Action Plan</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1.5 text-xs text-gray-600">
                    {selectedReport.teacherSuggestions?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    )) || <li>No suggestions available</li>}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => handleDownloadPdf(selectedReport.assessmentId || selectedReport.id)}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Download full PDF Report
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-5 py-2.5 bg-gray-50 border hover:bg-gray-100 rounded-xl font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
