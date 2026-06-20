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
        accent: {
          DEFAULT: '#F0A500',
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
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        button: '14px',
        input: '12px',
        badge: '999px',
      },
      boxShadow: {
        card: '0 2px 12px -2px rgba(0,0,0,0.06)',
        elevated: '0 10px 30px -10px rgba(0,0,0,0.12)',
        floating: '0 20px 50px -15px rgba(0,0,0,0.15)',
        'teal-glow': '0 0 20px rgba(13, 115, 119, 0.25)',
        'amber-glow': '0 0 20px rgba(240, 165, 0, 0.25)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
