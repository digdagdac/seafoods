import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2B4B',
          medium: '#2C3E6B',
          tint: '#E8ECF5',
          light: '#F4F6FB',
        },
        severity: {
          critical: '#DC2626',   // L5 — 영업취소, 폐쇄명령
          high: '#EA580C',       // L4 — 영업정지 2개월 이상
          medium: '#D97706',     // L3 — 영업정지 1개월 미만
          low: '#2563EB',        // L2 — 시정명령
          minimal: '#64748B',    // L1 — 경고
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'var(--font-noto-sans-kr)', 'sans-serif'],
        korean: ['var(--font-noto-sans-kr)', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(27, 43, 75, 0.08), 0 1px 2px -1px rgba(27, 43, 75, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(27, 43, 75, 0.12), 0 2px 4px -1px rgba(27, 43, 75, 0.08)',
        nav: '0 -1px 0 0 rgba(27, 43, 75, 0.08), 0 -4px 16px 0 rgba(27, 43, 75, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dot': 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'nav-height': '4rem',
      },
    },
  },
  plugins: [],
}

export default config
