import React from 'react'
import { useLocation } from 'react-router-dom'
import client from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import BuddyMascot from '../components/BuddyMascot'
import { detectErrorPatterns } from '../utils/errorAnalysis'

export default function Results() {
  const [results, setResults] = React.useState(null)
  const [error, setError] = React.useState('')
  const [csvLoading, setCsvLoading] = React.useState(false)
  const location = useLocation()
  const stateResult = location.state?.result

  React.useEffect(() => {
    (async () => {
      try {
        const user = getUser()
        const params = {}
        if (user?._id || user?.id) params.externalUserId = user?._id || user?.id
        if (user?.email) params.email = user.email
        const res = await client.get('/api/v2/assessments/results', { params })
        let fetched = Array.isArray(res.data) ? res.data : []
        if (stateResult && fetched.length === 0) {
          const scoreVal = stateResult.totalScore || stateResult.accuracy || 80
          fetched = [{
            _id: stateResult.id || 'recent',
            totalScore: scoreVal,
            accuracy: scoreVal,
            timeTakenMs: stateResult.timeTakenMs || 24000,
            avgDifficulty: stateResult.avgDifficulty || 2.5,
            createdAt: new Date().toISOString(),
            dyscalculiaRiskIndex: scoreVal >= 75 ? 'LOW' : scoreVal >= 50 ? 'MODERATE' : 'HIGH',
            confidenceScore: 85,
            scores: {
              total: scoreVal,
              number_sense: scoreVal,
              arithmetic: scoreVal,
              spatial: scoreVal,
              memory: scoreVal
            },
            questions: stateResult.questions || [],
            answers: stateResult.answers || []
          }]
        }
        setResults(fetched)
      } catch (err) {
        console.error(err)
        if (stateResult) {
          const scoreVal = stateResult.totalScore || stateResult.accuracy || 80
          setResults([{
            _id: stateResult.id || 'recent',
            totalScore: scoreVal,
            accuracy: scoreVal,
            timeTakenMs: stateResult.timeTakenMs || 24000,
            avgDifficulty: stateResult.avgDifficulty || 2.5,
            createdAt: new Date().toISOString(),
            dyscalculiaRiskIndex: scoreVal >= 75 ? 'LOW' : scoreVal >= 50 ? 'MODERATE' : 'HIGH',
            confidenceScore: 85,
            scores: {
              total: scoreVal,
              number_sense: scoreVal,
              arithmetic: scoreVal,
              spatial: scoreVal,
              memory: scoreVal
            },
            questions: stateResult.questions || [],
            answers: stateResult.answers || []
          }])
        } else {
          setError(err.response?.data?.message || 'Failed to load results')
        }
      }
    })()
  }, [stateResult])

  const downloadCSV = async () => {
    setCsvLoading(true)
    try {
      const res = await client.get('/api/v2/assessments/export', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      let filename = 'assessment_results.csv'
      const cd = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition']
      if (cd) {
        const match = cd.match(/filename="?([^";]+)"?/) || cd.match(/filename=([^;]+)/)
        if (match) filename = match[1]
      }

      // Mobile-friendly download
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        const reader = new FileReader()
        reader.onload = function (e) {
          const link = document.createElement('a')
          link.href = e.target.result
          link.setAttribute('download', filename)
          document.body.appendChild(link)
          link.click()
          link.remove()
        }
        reader.readAsDataURL(blob)
      } else {
        // Desktop
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.setAttribute('download', filename)
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to download CSV', err)
      setError(err.response?.data?.message || 'Failed to download CSV')
    } finally {
      setCsvLoading(false)
    }
  }

  if (!results && !error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-indigo-50 font-kid">
      <BuddyMascot mood="cheerful" size="lg" message="Gathering your trophies..." />
      <div className="mt-4">
        <LoadingSpinner size={48} />
      </div>
    </div>
  )

  if (Array.isArray(results) && results.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-indigo-50 font-kid">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-100 text-center">
        <BuddyMascot mood="cheerful" size="lg" message="Ready for an adventure?" />
        <h2 className="text-3xl font-black mt-4 mb-2 text-gray-900">No Assessment Stars Yet!</h2>
        <p className="text-gray-600 mb-6 font-bold">
          You haven't completed any quests yet. Start an adventure screening or assessment to earn badges and discover your superpowers!
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/assessment" className="kid-btn-primary w-full sm:w-auto">
            <span>🚀 Start Adventure</span>
          </a>
          <a href="/screening" className="kid-btn-blue w-full sm:w-auto">
            <span>⚡ Quick Screening</span>
          </a>
        </div>
      </div>
    </div>
  )

  const trend = [...results].reverse().map((r) => ({
    label: new Date(r.createdAt).toLocaleDateString(),
    value: Math.round(r.scores.total || 0),
    raw: r
  }))

  const latest = results[0]
  const patterns = detectErrorPatterns(latest?.questions || [], latest?.answers || [])

  const domainLabel = (k) => {
    const m = {
      number_sense: 'Number Sense',
      arithmetic: 'Arithmetic',
      spatial: 'Spatial',
      memory: 'Working Memory'
    }
    return m[k] || k
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white text-gray-800 font-kid">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Celebration Hero Banner */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center sm:text-left">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                🎉 Quest Completed!
              </span>
              <h1 className="text-3xl sm:text-4xl font-black drop-shadow-sm">
                Awesome Job Buddy!
              </h1>
              <p className="text-white/90 text-sm sm:text-base mt-1">
                Here is your star score and adventure report card!
              </p>
            </div>
            <BuddyMascot
              mood="celebrate"
              size="lg"
              message="You are a super math star! ⭐"
            />
          </div>
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latest Assessment Celebration Card */}
          <div className="p-6 bg-white rounded-3xl shadow-lg border-b-8 border-kid-green border-2 border-green-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-green-700 uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full">
                  🌟 Latest Score
                </span>
                <span className="text-2xl">🏆</span>
              </div>
              <div className="text-5xl font-black text-gray-900 mb-2">
                {Math.round(latest.scores.total || 0)}%
              </div>
              <div className="text-sm font-bold text-gray-600">
                Risk Indicator: <span className="text-indigo-600 font-black">{latest.dyscalculiaRiskIndex}</span> · Confidence: {Math.round(latest.confidenceScore || 0)}%
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <a
                href={`/ai-report/${latest._id}`}
                className="kid-btn-blue text-sm flex-1 text-center py-3"
              >
                <span>🤖 View AI Report</span>
              </a>
              <button
                onClick={async () => {
                  try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}')
                    const externalUserId = user.id || user._id
                    if (!externalUserId) return
                    const res = await client.get(`/api/v2/ai/reports/${latest._id}/pdf`, {
                      params: { externalUserId },
                      responseType: 'blob'
                    })
                    const blob = new Blob([res.data], { type: 'application/pdf' })
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', `screening_report_${latest._id}.pdf`)
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                    window.URL.revokeObjectURL(url)
                  } catch (err) {
                    console.error("PDF download failed:", err)
                    alert("Unable to download PDF. Please try viewing the AI report first.")
                  }
                }}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition flex-1 text-center"
              >
                📥 Download PDF
              </button>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-gray-100">
              <h4 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <span>🧩</span>
                <span>Skill Superpowers</span>
              </h4>
              <div className="w-full">
                <BarChart data={latest.scores} />
              </div>

              <div className="mt-4 p-4 bg-sky-50 rounded-2xl border-2 border-sky-100">
                <div className="text-sm font-black text-gray-900">Detailed Pattern Checklist</div>
                <div className="text-xs font-bold text-gray-600 mt-1">
                  Number reversals: {patterns.numberReversal} · Symbol confusion: {patterns.symbolConfusion} · Sequencing errors: {patterns.sequencingError}
                </div>
                <div className="text-[11px] text-gray-500 mt-2">
                  These are helpful screening hints. For detailed reports, visit your AI Report!
                </div>
              </div>

              {latest.subtypeCounts && Object.keys(latest.subtypeCounts).length > 0 && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                  <div className="text-sm font-black text-gray-900">Subtype breakdown</div>
                  <div className="text-xs font-bold text-gray-700 mt-2 space-y-2">
                    {Object.entries(latest.subtypeCounts).map(([domain, subs]) => (
                      <div key={domain} className="flex items-start gap-3">
                        <div className="w-36 text-sm font-black text-gray-900">{domainLabel(domain)}</div>
                        <div className="flex-1 text-xs">
                          {Object.entries(subs).map(([sub, count]) => (
                            <div key={sub} className="inline-block mr-3"><strong>{sub}</strong>: {count}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trend Chart Card */}
          <div className="p-6 bg-white rounded-3xl shadow-lg border-2 border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>📈</span>
                  <span>My Progress Trend</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-xl text-xs transition">
                    Print
                  </button>
                  <button onClick={downloadCSV} className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5">
                    {csvLoading ? <LoadingSpinner size={14} /> : 'CSV'}
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <TrendChart data={trend} />
              </div>
            </div>
          </div>
        </div>

        {/* Past assessments */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border-2 border-indigo-100">
          <h4 className="text-xl font-black mb-4 text-gray-900 flex items-center gap-2">
            <span>📜</span>
            <span>Past Adventure Quests</span>
          </h4>
          <ul className="space-y-3">
            {results.map(r => (
              <li key={r._id} className="p-4 bg-gradient-to-r from-white to-sky-50/40 rounded-2xl border-2 border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-black text-base text-gray-900">Score: {Math.round(r.scores.total || 0)}% ⭐</div>
                  <div className="text-xs font-bold text-gray-500">Risk: {r.dyscalculiaRiskIndex} · Confidence: {Math.round(r.confidenceScore || 0)}%</div>
                  <div className="mt-1 flex gap-3 text-xs">
                    <a href={`/ai-report/${r._id}`} className="text-kid-blue font-black hover:underline">
                      Read AI Adventure Report →
                    </a>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-400">{new Date(r.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ================= CHART HELPERS ================= */

function TrendChart({ data = [] }) {
  if (!data.length) return <div className="text-sm font-bold text-gray-500 text-center py-10">No trend data</div>
  const w = 400, h = 140, padding = 30
  const maxVal = Math.max(...data.map(d => d.value), 100)
  const stepX = (w - padding * 2) / Math.max(1, data.length - 1)

  const points = data.map((d, i) => {
    const x = padding + i * stepX
    const y = h - padding - ((d.value / maxVal) * (h - padding * 2))
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
      <polyline points={points} fill="none" stroke="#1CB0F6" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = padding + i * stepX
        const y = h - padding - ((d.value / maxVal) * (h - padding * 2))
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={6} fill="#58CC02" stroke="#FFFFFF" strokeWidth={2} />
            <text x={x} y={h - 6} fontSize="11" fontWeight="bold" fill="#374151" textAnchor="middle">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function BarChart({ data = {} }) {
  const ordered = ['number_sense', 'arithmetic', 'spatial', 'memory']
  const labelMap = {
    number_sense: 'Number Sense',
    arithmetic: 'Arithmetic',
    spatial: 'Spatial',
    memory: 'Working Memory'
  }

  const getValue = (k) => {
    if (k in data) return Number(data[k] || 0)
    const camel = k.replace(/_([a-z])/g, g => g[1].toUpperCase())
    if (camel in data) return Number(data[camel] || 0)
    return 0
  }

  const getColor = (v) => {
    if (v >= 75) return 'bg-kid-green'
    if (v >= 50) return 'bg-kid-blue'
    return 'bg-kid-pink'
  }

  return (
    <div className="space-y-4">
      {ordered.map((key) => {
        const v = Math.round(getValue(key) || 0)
        const label = labelMap[key] || key
        return (
          <div key={key} className="flex items-center gap-4">
            <div className="w-36 text-sm font-black text-gray-800">{label}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} score`}>
                <div className={`${getColor(v)} h-full rounded-full transition-all duration-500`} style={{ width: `${v}%` }} />
              </div>
            </div>
            <div className="w-12 text-right text-sm font-black text-gray-800">{v}%</div>
          </div>
        )
      })}
      <div className="mt-2 text-xs font-bold text-gray-500">Legend: green (super star) · blue (growing) · pink (let's practice)</div>
    </div>
  )
}
