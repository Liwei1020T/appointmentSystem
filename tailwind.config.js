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
          DEFAULT: '#F8FAFC',      // 主背景 - 浅灰白
          elevated: '#FFFFFF',     // 卡片背景 - 纯白
          surface: '#F1F5F9',      // 表面 - 浅灰
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
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,0.24)',
        md: '0 8px 20px rgba(15,23,42,0.28)',
        glow: '0 0 0 1px rgba(249,115,22,0.2), 0 8px 24px rgba(249,115,22,0.16)',
      },
      scale: {
        97: '0.97',
      },
    },
  },
  plugins: [],
}
