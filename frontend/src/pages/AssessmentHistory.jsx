import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

function formatDuration(ms) {
  if (!ms && ms !== 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function formatType(type) {
  if (type === 'FULL') return 'Full Assessment'
  if (type === 'SCREENING') return 'Screening'
  return type || 'Assessment'
}

export default function AssessmentHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-4xl w-full kid-card">
        <h2 className="text-2xl font-bold mb-2 text-black">Assessment History</h2>
        <p className="text-black mb-4 text-sm">
          Every completed assessment is stored here with score, accuracy, time, and
          difficulty. This supports personalized learning — not a medical diagnosis.
        </p>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        {!error && history.length === 0 && (
          <div className="p-6 bg-white rounded-xl shadow-sm text-center">
            <p className="text-black mb-4">No assessments synced yet.</p>
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <Link
                to="/assessment"
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                Start Assessment
              </Link>
              <Link to="/screening" className="px-4 py-2 border rounded-md text-black">
                Try Screening
              </Link>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-black">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Type</th>
                  <th className="py-3 pr-4 font-semibold">Score</th>
                  <th className="py-3 pr-4 font-semibold">Accuracy</th>
                  <th className="py-3 pr-4 font-semibold">Time Taken</th>
                  <th className="py-3 font-semibold">Difficulty</th>
                  <th className="py-3 font-semibold">Insights</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      {item.completedAt
                        ? new Date(item.completedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-3 pr-4">{formatType(item.assessmentType)}</td>
                    <td className="py-3 pr-4 font-semibold">
                      {Math.round(item.totalScore ?? 0)}%
                    </td>
                    <td className="py-3 pr-4">{Math.round(item.accuracy ?? 0)}%</td>
                    <td className="py-3 pr-4">{formatDuration(item.timeTakenMs)}</td>
                    <td className="py-3 pr-4">
                      {item.avgDifficulty != null ? item.avgDifficulty : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link
                          to={`/ai-report/${item.id}`}
                          className="text-primary font-semibold hover:underline"
                        >
                          View
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => downloadPdf(item.id)}
                          className="text-primary font-semibold hover:underline"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
