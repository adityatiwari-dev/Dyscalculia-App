import React from 'react'

export default function BuddyMascot({ mood = 'cheerful', size = 'md', message, className = '' }) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  }[size] || 'w-24 h-24'

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {message && (
        <div className="mb-3 relative bg-white border-2 border-indigo-200 text-gray-800 font-kid font-bold px-4 py-2 rounded-2xl shadow-md text-sm sm:text-base max-w-xs text-center animate-bounce">
          {message}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-indigo-200 rotate-45" />
        </div>
      )}
      <div className={`relative flex items-center justify-center transition-transform duration-300 hover:scale-105 ${sizeClasses}`}>
        {/* SVG Friendly Educational Owl Mascot (Buddy) */}
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg overflow-visible">
          {/* Subtle Back Glow */}
          <circle cx="60" cy="62" r="48" fill="#E0F2FE" className="opacity-70" />

          {/* Owl Body */}
          <path
            d="M32 50 C32 26, 88 26, 88 50 C88 84, 82 102, 60 102 C38 102, 32 84, 32 50 Z"
            fill="#58CC02"
            stroke="#46A302"
            strokeWidth="3.5"
          />

          {/* Owl Ears / Tufts */}
          <path d="M36 34 L28 20 L44 28 Z" fill="#58CC02" stroke="#46A302" strokeWidth="2.5" />
          <path d="M84 34 L92 20 L76 28 Z" fill="#58CC02" stroke="#46A302" strokeWidth="2.5" />

          {/* Belly Feather Pattern */}
          <path
            d="M40 68 C40 56, 80 56, 80 68 C80 94, 74 98, 60 98 C46 98, 40 94, 40 68 Z"
            fill="#BCE875"
          />
          <path d="M52 74 Q60 80 68 74" stroke="#46A302" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M48 84 Q60 90 72 84" stroke="#46A302" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Wings */}
          {mood === 'celebrate' ? (
            <>
              {/* Raised celebrating wings */}
              <path d="M34 54 C16 40, 18 24, 32 44 Z" fill="#46A302" />
              <path d="M86 54 C104 40, 102 24, 88 44 Z" fill="#46A302" />
            </>
          ) : mood === 'waving' ? (
            <>
              {/* Left Wing Normal, Right Wing Waving */}
              <path d="M34 54 C22 66, 24 82, 34 78 Z" fill="#46A302" />
              <path d="M86 54 C104 40, 102 24, 88 44 Z" fill="#46A302" />
            </>
          ) : (
            <>
              {/* Normal Wings */}
              <path d="M34 54 C22 66, 24 82, 34 78 Z" fill="#46A302" />
              <path d="M86 54 C98 66, 96 82, 86 78 Z" fill="#46A302" />
            </>
          )}

          {/* Big Cheerful Eyes (White Disc) */}
          <circle cx="46" cy="46" r="14" fill="#FFFFFF" stroke="#46A302" strokeWidth="2.5" />
          <circle cx="74" cy="46" r="14" fill="#FFFFFF" stroke="#46A302" strokeWidth="2.5" />

          {/* Eye Pupils based on Mood */}
          {mood === 'celebrate' ? (
            <>
              <path d="M40 46 Q46 38 52 46" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M68 46 Q74 38 80 46" stroke="#1E293B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : mood === 'thinking' ? (
            <>
              <circle cx="48" cy="42" r="5" fill="#1E293B" />
              <circle cx="50" cy="40" r="1.5" fill="#FFFFFF" />
              <circle cx="76" cy="42" r="5" fill="#1E293B" />
              <circle cx="78" cy="40" r="1.5" fill="#FFFFFF" />
            </>
          ) : (
            <>
              <circle cx="47" cy="46" r="6" fill="#1E293B" />
              <circle cx="49" cy="44" r="2" fill="#FFFFFF" />
              <circle cx="73" cy="46" r="6" fill="#1E293B" />
              <circle cx="75" cy="44" r="2" fill="#FFFFFF" />
            </>
          )}

          {/* Cute Orange Beak */}
          <polygon points="60,54 53,46 67,46" fill="#FF9600" stroke="#E58600" strokeWidth="1.5" strokeLinejoin="round" />

          {/* Rosy Cheeks */}
          <ellipse cx="36" cy="56" rx="5" ry="3" fill="#FF788D" className="opacity-70" />
          <ellipse cx="84" cy="56" rx="5" ry="3" fill="#FF788D" className="opacity-70" />

          {/* Little Feet */}
          <path d="M46 100 C44 106, 52 106, 50 100 Z" fill="#FF9600" />
          <path d="M74 100 C72 106, 80 106, 78 100 Z" fill="#FF9600" />

          {/* Celebration Stars floating when celebrating */}
          {mood === 'celebrate' && (
            <>
              <polygon points="18,22 20,16 26,18 21,23 23,29 18,25 13,29 15,23 10,18 16,16" fill="#FFC800" />
              <polygon points="102,28 104,22 110,24 105,29 107,35 102,31 97,35 99,29 94,24 100,22" fill="#FFC800" />
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
