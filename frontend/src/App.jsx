import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import Results from './pages/Results'
import Activities from './pages/Activities'
import Screening from './pages/Screening'
import AssessmentHistory from './pages/AssessmentHistory'
import AiReport from './pages/AiReport'
import Practice from './pages/Practice'
import ProgressDashboard from './pages/ProgressDashboard'
import ParentDashboard from './pages/ParentDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import springClient from './api/springClient'
import { getUser } from './auth'
import './styles/tailwind.css'

function App() {
  const user = getUser()

  useEffect(() => {
    if (user?._id) {
      springClient.post('/api/v2/users/sync', {
        externalUserId: user._id,
        email: user.email,
        name: user.name,
        age: user.age ?? null,
        grade: user.grade ?? null,
        role: user.role ?? 'student'
      }).catch(err => console.warn('[Phase2] User profile sync failed:', err))
    }
  }, [user?._id])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
            <Route path="/screening" element={<ProtectedRoute><Screening /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><AssessmentHistory /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressDashboard /></ProtectedRoute>} />
            <Route path="/parent-dashboard" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
            <Route path="/ai-report/:assessmentId" element={<ProtectedRoute><AiReport /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
