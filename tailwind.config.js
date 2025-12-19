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
        // Kinetic Precision 2.0 tokens
        ink: {
          DEFAULT: '#0F172A',
          elevated: '#111C33',
          surface: '#1E293B',
        },
        border: {
          subtle: 'rgba(148,163,184,0.18)',
        },
        text: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
          tertiary: 'rgba(148,163,184,0.70)',
          onAccent: '#0B1220',
        },
        accent: {
          DEFAULT: '#D4FF00',
          soft: 'rgba(212,255,0,0.14)',
          border: 'rgba(212,255,0,0.38)',
        },
        info: {
          DEFAULT: '#3B82F6',
          soft: 'rgba(59,130,246,0.14)',
        },
        success: '#14B8A6',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
        glow: '0 0 0 1px rgba(212,255,0,0.2), 0 8px 24px rgba(212,255,0,0.16)',
      },
      scale: {
        97: '0.97',
      },
    },
  },
  plugins: [],
}
