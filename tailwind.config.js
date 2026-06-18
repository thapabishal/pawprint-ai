/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D7377',
          light: '#14A085',
          subtle: '#E6F7F6',
          dark: '#0A5559',
        },
        status: {
          catch: '#F59E0B',
          vaccinate: '#3B82F6',
          sterilize: '#8B5CF6',
          recover: '#F97316',
          release: '#10B981',
          observation: '#6B7280',
          critical: '#EF4444',
        },
        dark: '#111827',
        body: '#374151',
        muted: '#6B7280',
        border: '#E5E7EB',
        surface: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        input: '10px',
        badge: '999px',
      },
      boxShadow: {
        card: '0 2px 12px -2px rgba(0,0,0,0.08)',
        elevated: '0 10px 25px -5px rgba(0,0,0,0.1)',
        floating: '0 20px 40px -10px rgba(0,0,0,0.15)',
        'teal-glow': '0 0 15px rgba(13, 115, 119, 0.4)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
