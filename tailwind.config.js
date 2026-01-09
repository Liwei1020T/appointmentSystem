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
        // Paper Court - Quiet Professional
        ink: {
          DEFAULT: '#F7F3EE',      // 页面背景 - paper
          elevated: '#FFFFFF',     // 卡片背景
          surface: '#FFFFFF',      // 表面/微调
        },
        border: {
          subtle: '#E6E1DA',       // paper edge
        },
        text: {
          primary: '#111827',      // slate-900
          secondary: '#4B5563',    // slate-600
          tertiary: '#9CA3AF',     // slate-400
          onAccent: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0F766E',      // deep teal
          soft: 'rgba(15,118,110,0.12)',
          border: 'rgba(15,118,110,0.30)',
          alt: '#84CC16',          // lime accent
        },
        info: {
          DEFAULT: '#2563EB',
          soft: 'rgba(37,99,235,0.12)',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
        // Gradient accents
        gradient: {
          start: '#0F766E',
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
        sm: '0 1px 2px rgba(17,24,39,0.06)',
        md: '0 10px 24px rgba(17,24,39,0.12)',
        lg: '0 18px 36px rgba(17,24,39,0.14)',
        glow: '0 0 0 1px rgba(15,118,110,0.24), 0 10px 26px rgba(15,118,110,0.18)',
        'glow-lg': '0 0 0 2px rgba(15,118,110,0.28), 0 18px 36px rgba(15,118,110,0.22)',
        card: '0 1px 3px rgba(17,24,39,0.08)',
        'card-hover': '0 12px 28px rgba(17,24,39,0.16)',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(15, 118, 110, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(15, 118, 110, 0)' },
        },
      },
    },
  },
  plugins: [],
}
