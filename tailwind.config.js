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
        // Courtline Studio - Athletic Calm
        ink: {
          DEFAULT: '#F6F4F1',      // 页面背景 - warm off-white
          elevated: '#FFFFFF',     // 卡片背景
          surface: '#FFFFFF',      // 表面/微调
        },
        border: {
          subtle: '#E7E5E4',       // stone-200
        },
        text: {
          primary: '#111827',      // slate-900
          secondary: '#4B5563',    // slate-600
          tertiary: '#9CA3AF',     // slate-400
          onAccent: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#16A34A',      // rally green
          soft: 'rgba(22,163,74,0.12)',
          border: 'rgba(22,163,74,0.30)',
        },
        info: {
          DEFAULT: '#2563EB',
          soft: 'rgba(37,99,235,0.12)',
        },
        success: '#0D9488',
        warning: '#F59E0B',
        danger: '#EF4444',
        // Gradient accents
        gradient: {
          start: '#16A34A',
          end: '#84CC16',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
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
        md: '0 10px 24px rgba(15,23,42,0.12)',
        lg: '0 18px 36px rgba(15,23,42,0.14)',
        glow: '0 0 0 1px rgba(22,163,74,0.2), 0 10px 26px rgba(22,163,74,0.18)',
        'glow-lg': '0 0 0 2px rgba(22,163,74,0.24), 0 18px 36px rgba(22,163,74,0.2)',
        card: '0 1px 3px rgba(15,23,42,0.08)',
        'card-hover': '0 12px 28px rgba(15,23,42,0.16)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(22, 163, 74, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(22, 163, 74, 0)' },
        },
      },
    },
  },
  plugins: [],
}
