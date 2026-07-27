/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef6e9', 100: '#fce8c3', 200: '#f9d896', 300: '#f5c469',
          400: '#f0ae47', 500: '#e8912a', 600: '#c96f1e', 700: '#a1541a',
          800: '#7d4119', 900: '#653517',
        },
        leaf: {
          50: '#f0f9ee', 100: '#dcf0d6', 200: '#bae1b0', 300: '#8fca80',
          400: '#66b054', 500: '#479437', 600: '#357628', 700: '#2b5d22',
          800: '#254a1e', 900: '#1f3d1b',
        },
        cream: '#fffaf0',
        ink: '#2a2118',
      },
      fontFamily: {
        display: ['"Poppins"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(101, 53, 23, 0.08)',
        cardHover: '0 12px 30px rgba(101, 53, 23, 0.16)',
        soft: '0 1px 3px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn .4s ease-out',
        'slide-up': 'slideUp .4s ease-out',
        shimmer: 'shimmer 1.6s infinite linear',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-700px 0' }, '100%': { backgroundPosition: '700px 0' } },
      },
    },
  },
  plugins: [],
}
