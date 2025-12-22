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
        // Light Theme - Warm Orange
        ink: {
          DEFAULT: '#FFFFFF',      // 全局主背景 - 纯白
          elevated: '#FFFFFF',     // 卡片背景 - 纯白
          surface: '#FFFFFF',      // 表面/微调 - 纯白 (全系统去灰)
        },
        border: {
          subtle: 'rgba(15,23,42,0.10)',
        },
        text: {
          primary: '#0F172A',      // 主文字 - 深蓝灰
          secondary: '#475569',    // 次要文字 - 中灰
          tertiary: 'rgba(71,85,105,0.70)',
          onAccent: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F97316',
          soft: 'rgba(249,115,22,0.12)',
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
          end: '#FB923C',
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
        sm: '0 1px 2px rgba(15,23,42,0.24)',
        md: '0 8px 20px rgba(15,23,42,0.28)',
        lg: '0 12px 32px rgba(15,23,42,0.16)',
        glow: '0 0 0 1px rgba(249,115,22,0.2), 0 8px 24px rgba(249,115,22,0.16)',
        'glow-lg': '0 0 0 2px rgba(249,115,22,0.3), 0 12px 32px rgba(249,115,22,0.24)',
        card: '0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover': '0 8px 24px rgba(249,115,22,0.12), 0 2px 4px rgba(15,23,42,0.04)',
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

