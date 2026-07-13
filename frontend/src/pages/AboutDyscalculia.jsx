import { useState } from 'react'
import springClient from '../api/springClient'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorBanner from '../components/ErrorBanner'

export default function AboutDyscalculia() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('parent')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Interactive Dot Game State
  const [dotsCount, setDotsCount] = useState(4)
  const [showAnswer, setShowAnswer] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      await springClient.post('/api/v2/feedback', {
        name: name.trim(),
        email: email.trim(),
        role: role.toUpperCase(),
        message: message.trim()
      })
      setSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to submit feedback. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const shuffleDots = () => {
    setDotsCount(Math.floor(Math.random() * 7) + 3) // random count between 3 and 9
    setShowAnswer(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8 text-black">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Understanding Dyscalculia</h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            A comprehensive guide for parents, educators, and supporters. Learn how children perceive numbers and how you can support them.
          </p>
        </div>

        {/* Section 1: What is Dyscalculia? */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
          <h2 className="text-xl font-black text-black">What is Dyscalculia?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Dyscalculia is a specific learning disability that affects a person's ability to understand, learn, and perform math and number-based operations. 
            Unlike general learning struggles, it is neurological in nature, making it difficult to process basic concepts like size, value, quantities, and arithmetic symbols.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <span className="text-lg">🧠</span>
              <h4 className="text-xs font-bold text-black uppercase tracking-wider mt-2">Core Number Sense</h4>
              <p className="text-xs text-gray-500 mt-1">Struggles with subitizing (instantly seeing how many dots are shown without counting them one by one).</p>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
              <span className="text-lg">🕒</span>
              <h4 className="text-xs font-bold text-black uppercase tracking-wider mt-2">Sequential Processing</h4>
              <p className="text-xs text-gray-500 mt-1">Difficulty memorizing number sequences, telling time on analog clocks, or understanding schedules.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Spotting the Signs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-black">Common Indicators</h3>
            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Relies heavily on finger counting past age-typical norms.</li>
              <li>Struggles to estimate simple values or compare sizes (e.g., is 9 closer to 10 or 1?).</li>
              <li>Has high anxiety when faced with simple arithmetic games.</li>
              <li>Has difficulty mapping symbols ("5") to words ("five") or actual values (•••••).</li>
            </ul>
          </div>

          {/* Section 3: Interactive Visual Subitizing Cues */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-black">Try a Subitizing Check</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Show this to your child: Can they identify the count immediately without counting?</p>
            </div>

            <div className="h-28 bg-gray-50 border border-dashed rounded-2xl flex items-center justify-center relative p-3">
              <div className="flex gap-2.5 flex-wrap justify-center max-w-[80%]">
                {Array.from({ length: dotsCount }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-primary rounded-full shadow-xs animate-pulse" />
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center gap-3">
              <button
                onClick={shuffleDots}
                className="px-3.5 py-2 border rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                🔄 Shuffle Dots
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {showAnswer ? 'Hide Count' : 'Check Count'}
                </button>
                {showAnswer && (
                  <span className="text-sm font-black text-black">{dotsCount} Dots</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Contact/Feedback form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-black">Feedback & Support Forum</h2>
            <p className="text-xs text-gray-500 mt-1">
              Have questions about Dyscalculia or the diagnostic system? Send us a message, query, or observation comment below.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-xs font-bold text-center">
              ✓ Support message logged successfully! Our team of specialists will reach out shortly.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-3 border rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full p-3 border rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">I am a...</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="specialist">Learning Specialist</option>
                <option value="other">Guest / Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Message or Question</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message, query or feedback here..."
                rows={4}
                className="w-full p-3 border rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 tracking-wider uppercase"
              >
                {submitting ? <LoadingSpinner size={16} /> : 'Send Message'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
