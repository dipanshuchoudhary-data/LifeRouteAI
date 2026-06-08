/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#06070D',
        'bg-surface': '#0E1018',
        'bg-elevated': '#161820',
        'accent-red': '#EF4444',
        'accent-orange': '#F97316',
        'text-primary': '#FFFFFF',
        'triage-critical': '#EF4444',
        'triage-emergency': '#F97316',
        'triage-clinic': '#EAB308',
        'triage-safe': '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        hero: '-1.5px',
      },
      animation: {
        fadeUp: 'fadeUp 0.3s ease-out forwards',
        pulseRing: 'pulseRing 2s ease-out infinite',
        checkIn: 'checkIn 0.3s ease-out forwards',
        gradientShift: 'gradientShift 6s ease infinite',
        copilotPulse: 'copilotPulse 3s ease-out infinite',
        stepFade: 'fadeUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        checkIn: {
          from: { opacity: '0', transform: 'scale(0.6)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        copilotPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
