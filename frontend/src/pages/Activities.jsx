import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import springClient from '../api/springClient'
import { getUser } from '../auth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Your Personalized Learning Path</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
            Complete the steps on your learning path to strengthen your number sense and arithmetic skills.
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Dynamic Timeline Progression */}
        <div className="relative border-l border-gray-200 ml-4 md:ml-8 space-y-8 py-4">
          {pathNodes.map((node, idx) => {
            const isCompleted = node.status === 'COMPLETED'
            const isActive = node.status === 'ACTIVE'
            const isLocked = node.status === 'LOCKED'

            return (
              <div key={idx} className="relative pl-8 md:pl-12">
                
                {/* Node Status Dot Indicator */}
                <div className={`absolute -left-3 md:-left-4 top-1 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white shadow-sm' :
                  isActive ? 'bg-primary border-primary text-white shadow-md animate-pulse' :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : isLocked ? '🔒' : idx + 1}
                </div>

                {/* Node Content Card */}
                <div className={`p-5 rounded-2xl border transition ${
                  isCompleted ? 'bg-white border-green-100 shadow-xs' :
                  isActive ? 'bg-white border-primary/20 shadow-md ring-2 ring-primary/5' :
                  'bg-gray-100/50 border-gray-100 opacity-60'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className={`text-base font-extrabold tracking-tight ${isLocked ? 'text-gray-400' : 'text-black'}`}>
                        {node.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {node.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    {node.actionLink && !isLocked && (
                      <Link
                        to={node.actionLink}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition tracking-wider shrink-0 ${
                          isCompleted ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' :
                          'bg-primary hover:bg-primary/95 text-white shadow-sm'
                        }`}
                      >
                        {isCompleted ? 'Review' : 'Start'}
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>

        {/* Secondary Navigation Section */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-black uppercase tracking-wider">Independent Activities</h4>
            <p className="text-xs text-gray-500 mt-0.5">Explore general concepts and custom practice modules.</p>
          </div>
          <Link
            to="/practice"
            className="px-5 py-2.5 bg-gray-50 border hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 tracking-wider transition"
          >
            Custom Practice Settings
          </Link>
        </div>

      </div>
    </div>
  )
}
