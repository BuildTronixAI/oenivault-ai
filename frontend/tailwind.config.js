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
      boxShadow: {
        panel: '0 18px 50px rgba(0, 0, 0, 0.35)',
        'glow-gold': '0 0 0 1px rgba(196,163,90,0.15), 0 10px 30px rgba(122,31,56,0.25)',
      },
      backgroundImage: {
        'cellar-radial':
          'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(155,45,74,0.32), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(196,163,90,0.12), transparent 50%), linear-gradient(160deg, #120c0e 0%, #1a1214 45%, #2a1c20 100%)',
        'cellar-lattice':
          'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c4a35a\' fill-opacity=\'0.07\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
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
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(12px,-10px,0)' },
        },
        'drift-slow': {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(-14px,8px,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s ease-out both',
        'fade-up-delay': 'fade-up 0.55s ease-out 0.12s both',
        'fade-up-delay-2': 'fade-up 0.55s ease-out 0.24s both',
        'fade-in': 'fade-in 0.4s ease-out both',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        drift: 'drift 12s ease-in-out infinite',
        'drift-slow': 'drift-slow 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
