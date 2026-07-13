import { Link } from 'react-router-dom'
import BuddyMascot from '../components/BuddyMascot'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white font-kid text-gray-800">
      <div className="max-w-4xl w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Side Welcome Message */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <span className="inline-block px-4 py-1.5 bg-kid-green/10 text-kid-greenDark rounded-full text-xs sm:text-sm font-black uppercase tracking-wider">
            🌟 Fun Educational Adventures
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Number Buddies
          </h1>
          <p className="text-gray-600 font-bold text-base sm:text-lg max-w-md">
            Learn numbers, unlock cool badges, and conquer fun math quests with your friendly owl mascot Buddy!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <Link
              to="/assessment"
              className="kid-btn-primary text-lg"
            >
              <span>🚀 Start Adventure Quest</span>
            </Link>
            <Link
              to="/activities"
              className="kid-btn-blue text-lg"
            >
              <span>🎮 Play Fun Games</span>
            </Link>
          </div>

          <div className="pt-2 flex justify-center md:justify-start">
            <Link
              to="/progress"
              className="text-sm font-black text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>⭐ View My Trophy Case & Star Progress →</span>
            </Link>
          </div>
        </div>

        {/* Right Side Buddy Mascot & Adventure Badge */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-indigo-50/50 p-6 rounded-3xl border-2 border-indigo-100">
          <BuddyMascot
            mood="celebrate"
            size="xl"
            message="Hi friend! Let's play math together!"
          />
          <div className="mt-4 flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-indigo-100">
            <span className="text-2xl">🏆</span>
            <span className="text-xs font-black text-gray-700">100% Kid Friendly & Dyscalculia Supportive</span>
          </div>
        </div>

      </div>
    </div>
  )
}
