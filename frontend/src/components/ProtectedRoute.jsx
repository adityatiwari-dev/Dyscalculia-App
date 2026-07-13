import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken, getUser } from '../auth'

export default function ProtectedRoute({ children, allowedRoles }){
  const token = getToken()
  const user = getUser()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || 'student').toLowerCase()
    const allowed = allowedRoles.map(r => r.toLowerCase())
    if (!allowed.includes(userRole)) {
      if (userRole === 'parent') return <Navigate to="/parent-dashboard" replace />
      if (userRole === 'teacher') return <Navigate to="/teacher-dashboard" replace />
      if (userRole === 'admin') return <Navigate to="/admin" replace />
      return <Navigate to="/assessment" replace />
    }
  }

  return children
}
