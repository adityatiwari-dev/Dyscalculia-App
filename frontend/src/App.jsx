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
import TeacherDashboard from './pages/TeacherDashboard'
import AdminPanel from './pages/AdminPanel'
import AboutDyscalculia from './pages/AboutDyscalculia'
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
            <Route path="/assessment" element={<ProtectedRoute allowedRoles={['student']}><Assessment /></ProtectedRoute>} />
            <Route path="/screening" element={<ProtectedRoute allowedRoles={['student']}><Screening /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute allowedRoles={['student']}><Results /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute allowedRoles={['student']}><AssessmentHistory /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute allowedRoles={['student']}><ProgressDashboard /></ProtectedRoute>} />
            <Route path="/parent-dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/ai-report/:assessmentId" element={<ProtectedRoute allowedRoles={['student', 'parent', 'teacher', 'admin']}><AiReport /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute allowedRoles={['student']}><Activities /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute allowedRoles={['student']}><Practice /></ProtectedRoute>} />
            <Route path="/about" element={<AboutDyscalculia />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
