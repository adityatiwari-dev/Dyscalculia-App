import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUser, logout } from '../auth'

export default function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const user = getUser()

  const doLogout = () => {
    logout()
    navigate('/', { replace: true })
    setOpen(false)
  }

  // Lock background scroll + ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEsc)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const role = user?.role ? user.role.toLowerCase() : 'student'
  const isStudent = !user || (!['parent', 'teacher', 'admin'].includes(role))

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-xs relative z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary tracking-tight">
          <span className="text-2xl" role="img" aria-label="owl">🦉</span>
          <span>Number Buddies</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-5 items-center text-sm font-semibold">
          {/* 1. STUDENT NAVBAR */}
          {isStudent && (
            <>
              <Link to="/assessment" className="hover:text-primary transition">🧠 Assessment</Link>
              <Link to="/activities" className="hover:text-primary transition">🎮 Activities</Link>
              <Link to="/results" className="hover:text-primary transition">📊 Results</Link>
              <Link to="/progress" className="hover:text-primary transition">📈 Progress</Link>
              <Link to="/history" className="hover:text-primary transition">📅 History</Link>
              <Link to="/about" className="hover:text-primary transition text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold">📚 About Dyscalculia</Link>
            </>
          )}

          {/* 2. PARENT NAVBAR */}
          {role === 'parent' && (
            <>
              <Link to="/parent-dashboard" className="hover:text-primary transition font-bold text-primary">🏠 Parent Dashboard</Link>
              <Link to="/parent-dashboard" className="hover:text-primary transition">👶 Child Progress</Link>
              <Link to="/parent-dashboard" className="hover:text-primary transition">📑 Reports</Link>
              <Link to="/parent-dashboard" className="hover:text-primary transition">💡 Recommendations</Link>
              <Link to="/about" className="hover:text-primary transition text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold">📚 About Dyscalculia</Link>
            </>
          )}

          {/* 3. TEACHER NAVBAR */}
          {role === 'teacher' && (
            <>
              <Link to="/teacher-dashboard" className="hover:text-primary transition font-bold text-primary">🎓 Teacher Dashboard</Link>
              <Link to="/teacher-dashboard" className="hover:text-primary transition">👥 Students</Link>
              <Link to="/teacher-dashboard" className="hover:text-primary transition">📑 Reports</Link>
              <Link to="/teacher-dashboard" className="hover:text-primary transition">📈 Analytics</Link>
              <Link to="/about" className="hover:text-primary transition text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold">📚 About Dyscalculia</Link>
            </>
          )}

          {/* 4. ADMIN NAVBAR */}
          {role === 'admin' && (
            <>
              <Link to="/admin" className="hover:text-primary transition font-bold text-primary">🛠️ Admin Dashboard</Link>
              <Link to="/admin" className="hover:text-primary transition">❓ Manage Questions</Link>
              <Link to="/admin" className="hover:text-primary transition">👥 Manage Users</Link>
              <Link to="/admin" className="hover:text-primary transition">📑 Reports</Link>
              <Link to="/admin" className="hover:text-primary transition">💬 Feedback</Link>
              <Link to="/admin" className="hover:text-primary transition">📈 Analytics</Link>
            </>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold uppercase tracking-wider">
                {role}
              </span>
              <span className="text-sm font-medium text-gray-800">
                Hi, <strong>{user.name || user.email}</strong>
              </span>
              <button
                onClick={doLogout}
                className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="px-4 py-1.5 border border-gray-300 hover:border-black rounded-xl text-sm font-bold transition">Sign in</Link>
              <Link to="/register" className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition shadow-sm">Sign up</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-xl text-black hover:bg-gray-100 transition"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />

          <aside
            className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-5 h-full flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-extrabold text-primary flex items-center gap-2">
                  <span>🦉</span>
                  <span>Number Buddies</span>
                </span>
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="text-xl p-2 rounded-xl text-black hover:bg-gray-100 transition"
                >
                  ✕
                </button>
              </div>

              <nav className="flex-1 space-y-2.5">
                {/* 1. STUDENT MOBILE NAV */}
                {isStudent && (
                  <>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/assessment"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-black font-bold transition"
                    >
                      <span className="text-xl">🧠</span>
                      <span>Assessment</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/activities"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">🎮</span>
                      <span>Activities</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/results"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📊</span>
                      <span>Results</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/progress"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📈</span>
                      <span>Progress</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/history"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📅</span>
                      <span>History</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/about"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📚</span>
                      <span>About Dyscalculia</span>
                    </Link>
                  </>
                )}

                {/* 2. PARENT MOBILE NAV */}
                {role === 'parent' && (
                  <>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/parent-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-black font-bold transition"
                    >
                      <span className="text-xl">🏠</span>
                      <span>Parent Dashboard</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/parent-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">👶</span>
                      <span>Child Progress</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/parent-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📑</span>
                      <span>Reports</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/parent-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">💡</span>
                      <span>Recommendations</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/about"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📚</span>
                      <span>About Dyscalculia</span>
                    </Link>
                  </>
                )}

                {/* 3. TEACHER MOBILE NAV */}
                {role === 'teacher' && (
                  <>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/teacher-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-black font-bold transition"
                    >
                      <span className="text-xl">🎓</span>
                      <span>Teacher Dashboard</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/teacher-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">👥</span>
                      <span>Students</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/teacher-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📑</span>
                      <span>Reports</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/teacher-dashboard"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📈</span>
                      <span>Analytics</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/about"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📚</span>
                      <span>About Dyscalculia</span>
                    </Link>
                  </>
                )}

                {/* 4. ADMIN MOBILE NAV */}
                {role === 'admin' && (
                  <>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-black font-bold transition"
                    >
                      <span className="text-xl">🛠️</span>
                      <span>Admin Dashboard</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">❓</span>
                      <span>Manage Questions</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">👥</span>
                      <span>Manage Users</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📑</span>
                      <span>Reports</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">💬</span>
                      <span>Feedback</span>
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-black font-semibold transition"
                    >
                      <span className="text-xl">📈</span>
                      <span>Analytics</span>
                    </Link>
                  </>
                )}
              </nav>

              <div className="my-6 h-px bg-gray-200" />

              <div className="mt-auto space-y-3">
                {user ? (
                  <div className="bg-gray-50 p-4 rounded-2xl border">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{role}</p>
                    <p className="text-sm text-gray-800 font-medium mb-3">
                      Signed in as <strong>{user.name || user.email}</strong>
                    </p>
                    <button
                      onClick={doLogout}
                      className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm transition"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="block py-3 rounded-xl border border-gray-300 text-center font-bold text-black"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="block py-3 rounded-xl bg-primary text-white text-center font-bold"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}
