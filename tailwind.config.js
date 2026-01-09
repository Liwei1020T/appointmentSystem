/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Breathing Light - Warm Orange
        ink: {
          DEFAULT: '#F9FAFB',      // 页面背景 - gray-50
          elevated: '#FFFFFF',     // 卡片背景 - white
          surface: '#FFFFFF',      // 表面/微调 - white
        },
        border: {
          subtle: '#F3F4F6',       // gray-100
        },
        text: {
          primary: '#111827',      // gray-900
          secondary: '#6B7280',    // gray-500
          tertiary: '#9CA3AF',     // gray-400
          onAccent: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F97316',
          soft: 'rgba(249,115,22,0.10)',
          border: 'rgba(249,115,22,0.30)',
        },
        info: {
          DEFAULT: '#3B82F6',
          soft: 'rgba(59,130,246,0.12)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        // NEW: Gradient colors
        gradient: {
          start: '#F97316',
          end: '#FDBA74',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,0.08)',
        md: '0 8px 20px rgba(15,23,42,0.12)',
        lg: '0 12px 32px rgba(15,23,42,0.14)',
        glow: '0 0 0 1px rgba(249,115,22,0.18), 0 8px 18px rgba(249,115,22,0.18)',
        'glow-lg': '0 0 0 2px rgba(249,115,22,0.22), 0 12px 28px rgba(249,115,22,0.2)',
        card: '0 1px 2px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.04)',
        'card-hover': '0 8px 22px rgba(15,23,42,0.12), 0 2px 4px rgba(15,23,42,0.04)',
      },
      scale: {
        97: '0.97',
        98: '0.98',
      },
      // NEW: Animation configuration
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(249, 115, 22, 0)' },
        },
      },
    },
  },
  plugins: [],
}
