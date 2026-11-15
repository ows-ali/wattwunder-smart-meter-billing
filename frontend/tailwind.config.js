/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F2A3F',
          amber: '#F5A623',
          'amber-light': '#FDF3E3',
          bg: '#F7F5F0',
          card: '#FFFFFF',
          border: '#E8E4DA',
          muted: '#5A6E7D',
        }
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

