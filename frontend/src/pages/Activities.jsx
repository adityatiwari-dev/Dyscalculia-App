import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'
import BuddyMascot from '../components/BuddyMascot'

export default function Activities() {
  const [pathNodes, setPathNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = getUser()

  const fetchLearningPath = async () => {
    if (!user?._id) {
      setError('Please sign in to view your learning path.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await springClient.get('/api/v2/learning-path', {
        params: { externalUserId: user._id }
      })
      setPathNodes(res.data)
      setError('')
    } catch (err) {
      setError('Failed to retrieve learning path details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLearningPath()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-indigo-50 font-kid">
        <BuddyMascot mood="waving" size="lg" message="Rolling out your adventure map..." />
        <div className="mt-4">
          <LoadingSpinner size={48} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white py-8 px-4 sm:px-6 font-kid text-gray-800">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Adventure Map Hero Header */}
        <div className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center sm:text-left">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                🗺️ Adventure Learning Map
              </span>
              <h1 className="text-3xl sm:text-4xl font-black drop-shadow-sm">
                My Number Superpower Trail
              </h1>
              <p className="text-white/90 text-sm sm:text-base mt-1">
                Hop from island to island, conquer number quests, and unlock shiny new badges!
              </p>
            </div>
            <BuddyMascot
              mood="cheerful"
              size="lg"
              message="Let's pick our next island quest! ⭐"
            />
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Gamified Adventure Islands / Path Nodes */}
        {pathNodes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-100 text-center">
            <BuddyMascot mood="thinking" size="lg" message="Map loading soon..." />
            <h3 className="text-2xl font-black mt-4 mb-2 text-gray-900">Your Trail is Being Prepared!</h3>
            <p className="text-gray-600 font-bold mb-6">
              Complete a quick screening so we can draw your personalized learning islands!
            </p>
            <Link to="/assessment" className="kid-btn-primary inline-flex">
              <span>🚀 Start First Adventure</span>
            </Link>
          </div>
        ) : (
          <div className="relative space-y-6 max-w-3xl mx-auto">
            {pathNodes.map((node, idx) => {
              const isCompleted = node.status === 'COMPLETED'
              const isActive = node.status === 'ACTIVE'
              const isLocked = node.status === 'LOCKED'

              const borderTheme = isCompleted
                ? 'border-b-8 border-kid-green border-2 border-green-200 bg-white'
                : isActive
                ? 'border-b-8 border-kid-blue border-4 border-sky-300 bg-white ring-4 ring-sky-100'
                : 'border-b-8 border-gray-300 border-2 border-gray-200 bg-gray-50/80 opacity-60'

              const badgeIcon = isCompleted ? '⭐' : isLocked ? '🔒' : '🎯'

              return (
                <div key={idx} className="relative flex items-center gap-4 sm:gap-6">
                  {/* Level Circle Island Icon */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-3xl shrink-0 flex items-center justify-center font-black text-xl shadow-md border-4 ${
                      isCompleted
                        ? 'bg-kid-green text-white border-green-300 shadow-duo-green'
                        : isActive
                        ? 'bg-kid-blue text-white border-sky-300 shadow-duo-blue animate-bounce'
                        : 'bg-gray-200 text-gray-500 border-gray-300'
                    }`}
                  >
                    <span>{badgeIcon}</span>
                  </div>

                  {/* Island Quest Card */}
                  <div className={`flex-1 p-6 rounded-3xl shadow-lg transition transform hover:-translate-y-1 ${borderTheme}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                            isCompleted
                              ? 'bg-green-100 text-green-700'
                              : isActive
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            Level {idx + 1}
                          </span>
                          {isCompleted && (
                            <span className="text-xs font-black text-green-600">✓ Mastered!</span>
                          )}
                        </div>
                        <h3 className={`text-xl font-black ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                          {node.title}
                        </h3>
                        <p className="text-sm font-bold text-gray-600 mt-1">
                          {node.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      {node.actionLink && !isLocked && (
                        <Link
                          to={node.actionLink}
                          className={isCompleted ? 'kid-btn-yellow text-sm py-3 px-5' : 'kid-btn-blue text-sm py-3 px-5'}
                        >
                          <span>{isCompleted ? '⭐ Play Again' : '🚀 Start Quest'}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Secondary Fun Practice Module Card */}
        <div className="bg-white border-4 border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎮</span>
            <div>
              <h4 className="text-xl font-black text-gray-900">Want Extra Arcade Practice?</h4>
              <p className="text-sm font-bold text-gray-600">
                Customize your own practice game and choose your favorite topics!
              </p>
            </div>
          </div>
          <Link
            to="/practice"
            className="kid-btn-purple text-base shrink-0"
          >
            <span>🎮 Custom Arcade</span>
          </Link>
        </div>

      </div>
    </div>
  )
}
