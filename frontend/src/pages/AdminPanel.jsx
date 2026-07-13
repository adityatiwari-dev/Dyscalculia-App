import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import springClient from '../api/springClient'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

/**
 * Universal Response Normalizer
 * Extracts an array safely from any API response payload:
 * - Direct arrays: [...]
 * - Envelope objects: { data: [...] }, { content: [...] }, { items: [...] }
 * - Specific key envelope: { [expectedKey]: [...] }
 * - Empty / null / 204 No Content: []
 */
function extractArray(payload, expectedKey) {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    if (expectedKey && Array.isArray(payload[expectedKey])) return payload[expectedKey]
    if (Array.isArray(payload.content)) return payload.content
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload.items)) return payload.items
    const firstArray = Object.values(payload).find(v => Array.isArray(v))
    if (firstArray) return firstArray
  }
  return []
}

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'dashboard'
  const [activeTab, setActiveTabState] = useState(initialTab)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['dashboard', 'users', 'assessments', 'questions'].includes(tab)) {
      setActiveTabState(tab)
    } else if (!tab) {
      setActiveTabState('dashboard')
    }
  }, [searchParams])

  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    setSearchParams({ tab })
  }
  const [stats, setStats] = useState({ totalUsers: 0, totalAssessments: 0 })
  const [users, setUsers] = useState([])
  const [assessments, setAssessments] = useState([])
  const [questions, setQuestions] = useState([])

  // Search & Filter state
  const [userQuery, setUserQuery] = useState('')
  const [assessmentQuery, setAssessmentQuery] = useState('')
  const [questionQuery, setQuestionQuery] = useState('')
  const [questionTopicFilter, setQuestionTopicFilter] = useState('')
  const [questionDiffFilter, setQuestionDiffFilter] = useState('')

  // Loading & Error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Question Form State
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState('arithmetic')
  const [topic, setTopic] = useState('ADDITION')
  const [difficulty, setDifficulty] = useState('EASY')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [modalError, setModalError] = useState('')

  const fetchStats = async () => {
    try {
      const res = await springClient.get('/api/v2/admin/stats')
      const data = res?.data || {}
      setStats({
        totalUsers: Number(data.totalUsers ?? data?.data?.totalUsers ?? 0),
        totalAssessments: Number(data.totalAssessments ?? data?.data?.totalAssessments ?? 0)
      })
    } catch (err) {
      console.warn('Failed to load stats:', err)
      setStats({ totalUsers: 0, totalAssessments: 0 })
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await springClient.get('/api/v2/admin/users')
      const rawArray = extractArray(res?.data, 'users')
      const cleanUsers = rawArray.map(u => ({
        id: String(u?.id || crypto.randomUUID()),
        name: String(u?.name || ''),
        email: String(u?.email || ''),
        role: String(u?.role || 'student'),
        grade: String(u?.grade || ''),
        age: u?.age ?? ''
      }))
      setUsers(cleanUsers)
    } catch (err) {
      console.warn('Failed to load users:', err)
      setUsers([])
    }
  }

  const fetchAssessments = async () => {
    try {
      const res = await springClient.get('/api/v2/admin/assessments')
      const rawArray = extractArray(res?.data, 'assessments')
      const cleanAssessments = rawArray.map(a => ({
        id: String(a?.id || crypto.randomUUID()),
        user: {
          name: String(a?.user?.name || ''),
          email: String(a?.user?.email || '')
        },
        assessmentType: String(a?.assessmentType || 'FULL'),
        totalScore: Number(a?.totalScore || 0),
        accuracy: Number(a?.accuracy || 0)
      }))
      setAssessments(cleanAssessments)
    } catch (err) {
      console.warn('Failed to load assessments:', err)
      setAssessments([])
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await springClient.get('/api/v2/questions')
      const rawArray = extractArray(res?.data, 'questions')
      const cleanQuestions = rawArray.map(q => ({
        id: String(q?.id || crypto.randomUUID()),
        questionType: String(q?.questionType || 'arithmetic'),
        questionText: String(q?.questionText || ''),
        topic: String(q?.topic || 'ADDITION'),
        difficulty: String(q?.difficulty || 'EASY'),
        options: Array.isArray(q?.options) ? q.options : ['', '', '', ''],
        correctAnswer: String(q?.correctAnswer || '')
      }))
      setQuestions(cleanQuestions)
    } catch (err) {
      console.warn('Failed to load questions:', err)
      setQuestions([])
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([fetchStats(), fetchUsers(), fetchAssessments(), fetchQuestions()])
    } catch (err) {
      setError('Unable to load admin data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // User Actions
  const handleUpdateUserRole = async (user, newRole) => {
    try {
      await springClient.put(`/api/v2/admin/users/${user.id}`, { ...user, role: newRole })
      fetchUsers()
    } catch (err) {
      alert('Failed to update user role.')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await springClient.delete(`/api/v2/admin/users/${id}`)
      fetchUsers()
      fetchStats()
    } catch (err) {
      alert('Failed to delete user.')
    }
  }

  // Assessment Actions
  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return
    try {
      await springClient.delete(`/api/v2/admin/assessments/${id}`)
      fetchAssessments()
      fetchStats()
    } catch (err) {
      alert('Failed to delete assessment.')
    }
  }

  // Question Actions
  const handleEditQuestionClick = (q) => {
    setEditingQuestion(q)
    setQuestionText(q.questionText)
    setQuestionType(q.questionType)
    setTopic(q.topic)
    setDifficulty(q.difficulty)
    setOptions(Array.isArray(q.options) && q.options.length > 0 ? q.options : ['', '', '', ''])
    setCorrectAnswer(q.correctAnswer)
    setShowQuestionModal(true)
    setModalError('')
  }

  const handleAddQuestionClick = () => {
    setEditingQuestion(null)
    setQuestionText('')
    setQuestionType('arithmetic')
    setTopic('ADDITION')
    setDifficulty('EASY')
    setOptions(['', '', '', ''])
    setCorrectAnswer('')
    setShowQuestionModal(true)
    setModalError('')
  }

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    try {
      await springClient.delete(`/api/v2/questions/${id}`)
      fetchQuestions()
    } catch (err) {
      alert('Failed to delete question.')
    }
  }

  const handleOptionChange = (idx, value) => {
    const updated = [...options]
    updated[idx] = value
    setOptions(updated)
  }

  const handleSaveQuestion = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!questionText.trim() || !correctAnswer.trim() || options.some(o => !o.trim())) {
      setModalError('All fields must be filled out.')
      return
    }

    const payload = {
      topic,
      difficulty,
      questionType,
      questionText: questionText.trim(),
      options: options.map(o => o.trim()),
      correctAnswer: correctAnswer.trim()
    }

    try {
      if (editingQuestion) {
        await springClient.put(`/api/v2/questions/${editingQuestion.id}`, payload)
      } else {
        await springClient.post('/api/v2/questions', payload)
      }
      setShowQuestionModal(false)
      fetchQuestions()
    } catch (err) {
      setModalError('Failed to save question. Check inputs.')
    }
  }

  // Guaranteed safe filtering on normalized arrays
  const filteredUsers = (Array.isArray(users) ? users : []).filter(u =>
    (u.name || '').toLowerCase().includes(userQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userQuery.toLowerCase())
  )

  const filteredAssessments = (Array.isArray(assessments) ? assessments : []).filter(a =>
    (a.id || '').toLowerCase().includes(assessmentQuery.toLowerCase()) ||
    (a.user?.name || '').toLowerCase().includes(assessmentQuery.toLowerCase())
  )

  const filteredQuestions = (Array.isArray(questions) ? questions : []).filter(q => {
    const matchesQuery = (q.questionText || '').toLowerCase().includes(questionQuery.toLowerCase())
    const matchesTopic = !questionTopicFilter || q.topic === questionTopicFilter
    const matchesDiff = !questionDiffFilter || q.difficulty === questionDiffFilter
    return matchesQuery && matchesTopic && matchesDiff
  })

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
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">System Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Configure users, track assessments, and manage the system Question Bank.</p>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 gap-6">
          {['dashboard', 'users', 'assessments', 'questions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-gray-400">Total Users</span>
                <h2 className="text-4xl font-black text-black mt-2">{stats.totalUsers}</h2>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-gray-400">Total Assessments Completed</span>
                <h2 className="text-4xl font-black text-primary mt-2">{stats.totalAssessments}</h2>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-lg font-bold text-black">User Accounts</h2>
              <input
                type="text"
                placeholder="Search user email or name..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Grade</th>
                    <th className="py-3 px-2">Age</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-5 hover:bg-gray-50">
                      <td className="py-3 px-2 font-semibold text-black">{user.name || '—'}</td>
                      <td className="py-3 px-2 text-gray-700">{user.email || '—'}</td>
                      <td className="py-3 px-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user, e.target.value)}
                          className="p-1 border rounded-lg bg-white font-medium"
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-gray-500">{user.grade || '—'}</td>
                      <td className="py-3 px-2 text-gray-500">{user.age || '—'}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-2.5 py-1 text-red-500 hover:bg-red-50 rounded-lg font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-lg font-bold text-black">Completed Assessments</h2>
              <input
                type="text"
                placeholder="Search by ID or User..."
                value={assessmentQuery}
                onChange={(e) => setAssessmentQuery(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Student</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Score</th>
                    <th className="py-3 px-2">Accuracy</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map(record => (
                    <tr key={record.id} className="border-b border-gray-5 hover:bg-gray-50">
                      <td className="py-3 px-2 font-mono text-gray-500">{record.id.slice(0, 8)}...</td>
                      <td className="py-3 px-2 font-semibold text-black">{record.user?.name || '—'}</td>
                      <td className="py-3 px-2 font-semibold uppercase text-gray-700">{record.assessmentType}</td>
                      <td className="py-3 px-2 font-medium text-gray-600">{record.totalScore} pts</td>
                      <td className="py-3 px-2 font-bold text-primary">{Math.round(record.accuracy)}%</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleDeleteAssessment(record.id)}
                          className="px-2.5 py-1 text-red-500 hover:bg-red-50 rounded-lg font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-black">Question Bank</h2>
                <p className="text-xs text-gray-500">Manage the dynamically queried screening & practice questions.</p>
              </div>
              <button
                onClick={handleAddQuestionClick}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary/95 transition shrink-0"
              >
                + Add Question
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-xl">
              <input
                type="text"
                placeholder="Search question text..."
                value={questionQuery}
                onChange={(e) => setQuestionQuery(e.target.value)}
                className="px-3 py-1.5 border bg-white rounded-xl text-xs focus:outline-none"
              />
              <select
                value={questionTopicFilter}
                onChange={(e) => setQuestionTopicFilter(e.target.value)}
                className="px-3 py-1.5 border bg-white rounded-xl text-xs focus:outline-none"
              >
                <option value="">All Topics</option>
                <option value="ADDITION">Addition</option>
                <option value="SUBTRACTION">Subtraction</option>
                <option value="MULTIPLICATION">Multiplication</option>
                <option value="DIVISION">Division</option>
                <option value="PLACE_VALUE">Place Value</option>
                <option value="NUMBER_SENSE">Number Sense</option>
                <option value="COMPARISON">Comparison</option>
                <option value="PATTERN_RECOGNITION">Pattern Recognition</option>
              </select>
              <select
                value={questionDiffFilter}
                onChange={(e) => setQuestionDiffFilter(e.target.value)}
                className="px-3 py-1.5 border bg-white rounded-xl text-xs focus:outline-none"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-2">Text</th>
                    <th className="py-3 px-2">Topic</th>
                    <th className="py-3 px-2">Difficulty</th>
                    <th className="py-3 px-2">Correct Answer</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map(q => (
                    <tr key={q.id} className="border-b border-gray-5 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-black">{q.questionText}</td>
                      <td className="py-3 px-2 text-gray-600 font-semibold">{q.topic}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                          q.difficulty === 'EASY' ? 'bg-green-50 text-green-600 border-green-200' :
                          q.difficulty === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-700 font-mono">{q.correctAnswer}</td>
                      <td className="py-3 px-2 text-right space-x-2">
                        <button
                          onClick={() => handleEditQuestionClick(q)}
                          className="px-2 py-1 text-primary hover:bg-primary/5 rounded-lg font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-2 py-1 text-red-500 hover:bg-red-50 rounded-lg font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Question Creator/Editor Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setShowQuestionModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-black font-extrabold text-lg"
              >
                ✕
              </button>

              <h3 className="text-xl font-extrabold text-black">
                {editingQuestion ? 'Edit Question Details' : 'Create New Question'}
              </h3>

              {modalError && <p className="text-xs text-red-500">{modalError}</p>}

              <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-500 block mb-1">Concept Topic</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="ADDITION">Addition</option>
                      <option value="SUBTRACTION">Subtraction</option>
                      <option value="MULTIPLICATION">Multiplication</option>
                      <option value="DIVISION">Division</option>
                      <option value="PLACE_VALUE">Place Value</option>
                      <option value="NUMBER_SENSE">Number Sense</option>
                      <option value="COMPARISON">Comparison</option>
                      <option value="PATTERN_RECOGNITION">Pattern Recognition</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-500 block mb-1">Difficulty Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-500 block mb-1">Question Type Identifier</label>
                  <input
                    type="text"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    placeholder="e.g. arithmetic, count_dots, spatial"
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-500 block mb-1">Question Display Text</label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Type the question content..."
                    className="w-full p-2 border rounded-lg h-20 focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-gray-500 block">Answer Choices</label>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((option, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="w-full p-2 border rounded-lg focus:outline-none"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-500 block mb-1">Correct Option Text</label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder="Must exactly match one of the choices above"
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md"
                  >
                    Save Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuestionModal(false)}
                    className="px-5 py-2 bg-gray-50 border rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
