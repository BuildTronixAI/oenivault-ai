/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cellar: {
          950: '#120c0e',
          900: '#1a1214',
          800: '#2a1c20',
          700: '#3d282e',
          600: '#5a3a44',
        },
        burgundy: {
          400: '#c45c7a',
          500: '#9b2d4a',
          600: '#7a1f38',
          700: '#5c1529',
        },
        gold: {
          300: '#e8d5a3',
          400: '#d4b56a',
          500: '#c4a35a',
          600: '#a8863f',
        },
        parchment: {
          50: '#faf7f2',
          100: '#f3ebe0',
          200: '#e6d9c8',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Figtree"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cellar-radial':
          'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(155,45,74,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(196,163,90,0.12), transparent 50%), linear-gradient(160deg, #120c0e 0%, #1a1214 45%, #2a1c20 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s ease-out both',
        'fade-up-delay': 'fade-up 0.55s ease-out 0.12s both',
        'fade-up-delay-2': 'fade-up 0.55s ease-out 0.24s both',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
