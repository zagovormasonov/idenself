/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6dd5c3',
          dark: '#2c4a68',
          light: '#7dd3c0',
        },
        secondary: {
          DEFAULT: '#ffd966',
          dark: '#1e3a5f',
        },
        accent: '#f9e06f',
        background: '#f0f4f8',
        surface: '#FFFFFF',
        navy: {
          DEFAULT: '#1e3a5f',
          light: '#2c4a68',
          dark: '#142841',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6dd5c3 0%, #ffd966 100%)',
        'gradient-brand-hover': 'linear-gradient(135deg, #7dd3c0 0%, #f9e06f 100%)',
      }
    },
  },
  plugins: [],
}

