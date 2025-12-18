/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5', // Indigo 600 - Placeholder for premium
        secondary: '#1E293B', // Slate 800
        accent: '#F59E0B', // Amber 500
        background: '#F8FAFC', // Slate 50
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Placeholder
      }
    },
  },
  plugins: [],
}

