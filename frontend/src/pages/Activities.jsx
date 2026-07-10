import { Link } from 'react-router-dom'

export default function Activities(){
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full kid-card">
        <h2 className="text-2xl font-bold mb-2 text-black">Activities</h2>
        <p className="text-black mb-4">Playful exercises to strengthen number sense and arithmetic fluency.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            to="/practice"
            className="p-4 bg-primary/10 rounded-xl text-center text-black border-2 border-primary hover:bg-primary/20 transition"
          >
            <div className="text-lg font-semibold mb-1">Personalized Practice</div>
            <div className="text-xs">10 questions per weak topic · Easy / Medium / Hard</div>
          </Link>
          <div className="p-4 bg-soft rounded-xl text-center text-black opacity-60">Matching Numbers (coming soon)</div>
          <div className="p-4 bg-soft rounded-xl text-center text-black opacity-60">Shape Puzzles (coming soon)</div>
        </div>
        <p className="text-xs text-black">
          Practice topics are auto-selected from your latest AI learning insights, or choose your own on the practice page.
        </p>
      </div>
    </div>
  )
}
