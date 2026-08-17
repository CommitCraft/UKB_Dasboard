/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // EPACK SriCity Brand Color (#00629F) Palette
        brand: {
          DEFAULT: '#00629F',
          50: '#eef7fc',
          100: '#d9eef9',
          200: '#b3def3',
          300: '#8ccded',
          400: '#40abdf',
          500: '#00629F',
          600: '#00568c',
          700: '#004774',
          800: '#00385b',
          900: '#002943',
          950: '#001b2d'
        },
        primary: {
          50: '#eef7fc',
          100: '#d9eef9',
          200: '#b3def3',
          300: '#8ccded',
          400: '#40abdf',
          500: '#00629F',
          600: '#00568c',
          700: '#004774',
          800: '#00385b',
          900: '#002943',
          950: '#001b2d'
        },
        indigo: {
          50: '#eef7fc',
          100: '#d9eef9',
          200: '#b3def3',
          300: '#8ccded',
          400: '#40abdf',
          500: '#00629F',
          600: '#00629F',
          700: '#00568c',
          800: '#004774',
          900: '#00385b',
          950: '#001b2d'
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
