import React, { useState } from 'react'

export default function StudentIdCard({ student, className = '' }) {
  const [copied, setCopied] = useState(false)

  if (!student) return null

  // Resolve unique Student ID code
  const studentCode = student.studentCode || (student._id ? `NB-${String(student._id).replace(/-/g, '').slice(0, 6).toUpperCase()}` : 'NB-STUDENT')

  const handleCopy = () => {
    navigator.clipboard.writeText(studentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden ${className}`}>
      {/* Decorative background circle */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left Info Section */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <span>🎒 Student Passport ID</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">
            {student.name || 'Student Explorer'}
          </h3>
          <p className="text-xs text-white/80 font-medium">
            Share this unique Student ID with your Parent or Teacher to link accounts.
          </p>

          {/* Student ID Code Display & Copy Button */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="px-4 py-2 bg-black/30 backdrop-blur-md rounded-2xl border border-white/20 font-mono font-black text-lg tracking-widest">
              {studentCode}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-md ${
                copied
                  ? 'bg-green-400 text-gray-900'
                  : 'bg-white text-purple-700 hover:bg-gray-100'
              }`}
            >
              <span>{copied ? '✓ Copied ID!' : '📋 Copy ID'}</span>
            </button>
          </div>
        </div>

        {/* Right QR Code / Visual Badge */}
        <div className="shrink-0 flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-lg border-2 border-white/40">
          {/* SVG QR Code Simulation / Pattern for Student ID */}
          <div className="w-24 h-24 bg-gray-900 rounded-xl flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
            <div className="absolute inset-1 border border-dashed border-purple-400/50 rounded-lg pointer-events-none" />
            <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider">SCAN OR LINK</span>
            <span className="text-xs font-mono font-bold text-white mt-1 break-all px-1">
              {studentCode}
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-wider">
            Number Buddies ID
          </span>
        </div>

      </div>
    </div>
  )
}
