import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

function formatTopic(topic) {
  return String(topic || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function riskBadgeClass(level) {
  if (level === 'HIGH') return 'bg-rose-100 text-rose-700'
  if (level === 'MODERATE') return 'bg-yellow-100 text-yellow-800'
  return 'bg-emerald-100 text-emerald-700'
}

function ListSection({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm">
      <h3 className="font-semibold text-black mb-2">{title}</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm text-black">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function AiReport() {
  const { assessmentId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = getUser()

  const handleDownloadPdf = async () => {
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
      alert("Unable to download report. Please check if the backend is running.")
    }
  }

  useEffect(() => {
    if (!user?._id) {
      setLoading(false)
      setError('Please sign in to view AI insights.')
      return
    }

    ;(async () => {
      try {
        // Try existing report first; if missing, trigger analysis
        let res
        try {
          res = await springClient.get(`/api/v2/ai/reports/${assessmentId}`, {
            params: { externalUserId: user._id },
          })
        } catch (fetchErr) {
          if (fetchErr?.response?.status === 404) {
            res = await springClient.post('/api/v2/ai/analyze', {
              assessmentId,
              externalUserId: user._id,
            })
          } else {
            throw fetchErr
          }
        }
        setReport(res.data)
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'Unable to load AI insights. Is the Phase 2 backend running?'
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [assessmentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-2xl w-full kid-card">
          {error && <ErrorBanner message={error} />}
          <Link to="/history" className="mt-4 inline-block text-primary font-semibold">
            ← Back to History
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-4xl w-full kid-card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-black">AI Learning Insights</h2>
            <p className="text-sm text-black mt-1">
              Personalized educational recommendations — not a medical diagnosis.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary/95 transition flex items-center gap-1.5"
            >
              <span>📄</span> Download PDF
            </button>
            <Link to="/history" className="text-primary font-semibold text-sm whitespace-nowrap">
              ← History
            </Link>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          {report.disclaimer}
          {report.status === 'FALLBACK' && (
            <span className="block mt-1 text-xs">
              (Generated using rule-based analysis — AI service was unavailable.)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="text-sm text-black">Support Level</div>
            <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${riskBadgeClass(report.riskLevel)}`}>
              {report.riskLevel}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm md:col-span-2">
            <div className="text-sm font-medium text-black mb-1">Summary</div>
            <p className="text-sm text-black">{report.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <h3 className="font-semibold text-black mb-2">Weak Areas</h3>
            <div className="flex flex-wrap gap-2">
              {(report.weakAreas || []).map((area) => (
                <span key={area} className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs">
                  {formatTopic(area)}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <h3 className="font-semibold text-black mb-2">Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {(report.strengths || []).map((area) => (
                <span key={area} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs">
                  {formatTopic(area)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <ListSection title="Suggestions for Parents" items={report.parentSuggestions} />
        <ListSection title="Suggestions for Teachers" items={report.teacherSuggestions} />
        <ListSection title="Practice Plan" items={report.practicePlan} />
      </div>
    </div>
  )
}
