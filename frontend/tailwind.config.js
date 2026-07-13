/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        accent: '#f97316',
        soft: '#f8fafc',
        kid: {
          green: '#58CC02',
          greenDark: '#46A302',
          blue: '#1CB0F6',
          blueDark: '#1899D6',
          yellow: '#FFC800',
          yellowDark: '#E5B400',
          purple: '#CE82FF',
          purpleDark: '#A55EEA',
          pink: '#FF4B4B',
          pinkDark: '#D33131',
          orange: '#FF9600'
        }
      },
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        kid: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'duo': '0 4px 0 0 rgba(0, 0, 0, 0.15)',
        'duo-green': '0 4px 0 0 #46A302',
        'duo-blue': '0 4px 0 0 #1899D6',
        'duo-yellow': '0 4px 0 0 #E5B400',
        'duo-purple': '0 4px 0 0 #A55EEA',
        'duo-pink': '0 4px 0 0 #D33131'
      }
    },
  },
  plugins: [],
}
