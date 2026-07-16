import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/springClient'
import { setToken, setUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import { validateStudentAge, validateStudentGrade } from '../utils/studentValidation'

export default function Register() {
  const [role, setRole] = useState('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Student specific fields
  const [age, setAge] = useState('')
  const [grade, setGrade] = useState('')
  const [language, setLanguage] = useState('')
  const [educationalBoard, setEducationalBoard] = useState('')

  // Parent specific fields
  const [phoneNumber, setPhoneNumber] = useState('')

  // Teacher specific fields
  const [schoolName, setSchoolName] = useState('')
  const [subject, setSubject] = useState('')

  const [consent, setConsent] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setError('')
    setFieldErrors({})
  }

  const handleAgeChange = (e) => {
    const val = e.target.value
    setAge(val)
    if (role === 'student' && val.trim() !== '') {
      const { isValid, error } = validateStudentAge(val)
      setFieldErrors((prev) => ({ ...prev, age: isValid ? '' : error }))
    } else if (fieldErrors.age && val.trim() === '') {
      setFieldErrors((prev) => ({ ...prev, age: 'Age must be between 5 and 10 years to register.' }))
    }
  }

  const handleAgeBlur = () => {
    if (role === 'student') {
      const { isValid, error } = validateStudentAge(age)
      setFieldErrors((prev) => ({ ...prev, age: isValid ? '' : error }))
    }
  }

  const handleGradeChange = (e) => {
    const val = e.target.value
    setGrade(val)
    if (role === 'student' && val.trim() !== '') {
      const { isValid, error } = validateStudentGrade(val)
      setFieldErrors((prev) => ({ ...prev, grade: isValid ? '' : error }))
    } else if (fieldErrors.grade && val.trim() === '') {
      setFieldErrors((prev) => ({ ...prev, grade: 'Please enter a valid grade.' }))
    }
  }

  const handleGradeBlur = () => {
    if (role === 'student') {
      const { isValid, error } = validateStudentGrade(grade)
      setFieldErrors((prev) => ({ ...prev, grade: isValid ? '' : error }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      if (!name.trim()) throw { clientValidation: true, message: 'Name is required' }
      if (!email.trim()) throw { clientValidation: true, message: 'Email is required' }
      if (!password || password.trim().length < 6) {
        throw { clientValidation: true, message: 'Password must be at least 6 characters' }
      }
      if (!consent) {
        throw { clientValidation: true, message: 'Consent is required to create an account' }
      }

      if (role === 'student') {
        const ageCheck = validateStudentAge(age)
        const gradeCheck = validateStudentGrade(grade)
        const newFieldErrors = {}
        if (!ageCheck.isValid) newFieldErrors.age = ageCheck.error
        if (!gradeCheck.isValid) newFieldErrors.grade = gradeCheck.error

        if (Object.keys(newFieldErrors).length > 0) {
          setFieldErrors(newFieldErrors)
          setLoading(false)
          return
        }
      }

      // Build payload matching role requirements and API expectations
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        consent,
        // Only include age/grade/language/educationalBoard for student role
        age: role === 'student' && age ? Number(age) : null,
        grade: role === 'student' ? grade.trim() : null,
        language: role === 'student' ? language.trim() : null,
        educationalBoard: role === 'student' ? educationalBoard.trim() : null,
        // Optional role-specific metadata
        phoneNumber: role === 'parent' ? phoneNumber.trim() : null,
        schoolName: role === 'teacher' ? schoolName.trim() : null,
        subject: role === 'teacher' ? subject.trim() : null
      }

      const res = await client.post('/api/auth/register', payload)
      const { token, ...userData } = res.data

      try {
        setToken(token)
        setUser(userData)
      } catch (storageErr) {
        console.error('Storage error:', storageErr)
      }

      setMessage('Registered successfully!')
      if (role === 'parent') {
        navigate('/parent-dashboard', { replace: true })
      } else if (role === 'teacher') {
        navigate('/teacher-dashboard', { replace: true })
      } else if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/assessment', { replace: true })
      }
    } catch (err) {
      console.error('Registration failed:', err)
      if (err?.clientValidation) {
        setError(err.message)
      } else {
        const backendErrors = err.response?.data?.errors || err.response?.data?.fieldErrors
        if (backendErrors && typeof backendErrors === 'object') {
          setFieldErrors((prev) => ({ ...prev, ...backendErrors }))
        }
        const backendMsg =
          err.response?.data?.message ||
          (typeof err.response?.data === 'string' ? err.response?.data : null) ||
          'Registration failed. Please check your information.'
        setError(backendMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { id: 'student', label: '🎒 Student', desc: 'Take fun assessments & activities' },
    { id: 'parent', label: '🏠 Parent', desc: 'Monitor your child’s progress' },
    { id: 'teacher', label: '🎓 Teacher', desc: 'Track students & analytics' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-primary tracking-tight">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Select your role to personalize your experience</p>
        </div>

        {/* Dynamic Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6" role="radiogroup" aria-label="Select Role">
          {roleOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleRoleChange(opt.id)}
              className={`p-2.5 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center ${
                role === opt.id
                  ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50/50 font-medium'
              }`}
            >
              <span className="text-sm">{opt.label}</span>
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        <form onSubmit={submit} className="space-y-4 mt-4">
          {/* COMMON FIELDS: NAME, EMAIL, PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          {/* 1. STUDENT DYNAMIC FIELDS */}
          {role === 'student' && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    value={age}
                    onChange={handleAgeChange}
                    onBlur={handleAgeBlur}
                    placeholder="e.g. 8"
                    type="number"
                    min="5"
                    max="10"
                    className={`w-full p-3.5 rounded-2xl border bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                      fieldErrors.age
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                        : 'border-gray-300 focus:ring-primary'
                    }`}
                  />
                  {fieldErrors.age && (
                    <p className="text-xs text-red-600 font-bold mt-1.5">{fieldErrors.age}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Grade
                  </label>
                  <input
                    value={grade}
                    onChange={handleGradeChange}
                    onBlur={handleGradeBlur}
                    placeholder="e.g. Grade 3"
                    className={`w-full p-3.5 rounded-2xl border bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                      fieldErrors.grade
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                        : 'border-gray-300 focus:ring-primary'
                    }`}
                  />
                  {fieldErrors.grade && (
                    <p className="text-xs text-red-600 font-bold mt-1.5">{fieldErrors.grade}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Preferred Language
                </label>
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. English"
                  className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Educational Board
                </label>
                <input
                  value={educationalBoard}
                  onChange={(e) => setEducationalBoard(e.target.value)}
                  placeholder="e.g. CBSE, ICSE, Common Core"
                  className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>
            </div>
          )}

          {/* 2. PARENT DYNAMIC FIELDS */}
          {role === 'parent' && (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
          )}

          {/* 3. TEACHER DYNAMIC FIELDS */}
          {role === 'teacher' && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  School Name
                </label>
                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter school name"
                  className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Special Ed"
                  className="w-full p-3.5 rounded-2xl border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>
            </div>
          )}

          {/* 4. ADMIN: SHOW ONLY NAME, EMAIL, PASSWORD - NOTHING ELSE */}

          {/* CONSENT CHECKBOX */}
          <label className="flex items-start gap-3 text-xs text-gray-600 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary rounded cursor-pointer"
            />
            <span>
              I consent to storing my data for educational and assessment purposes.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-extrabold text-base shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size={22} /> : `Create ${role.charAt(0).toUpperCase() + role.slice(1)} Account`}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm font-bold text-green-700 text-center">
            {message}
          </div>
        )}

        <div className="mt-6 text-center text-sm font-medium text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
