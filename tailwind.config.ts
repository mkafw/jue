import type { Config } from 'tailwindcss';

/**
 * QA-OS 设计令牌系统
 * 烟光暮山紫 × 瘦金体骨骼 × Claude 文具店社论风
 * 支持亮色/暗色双主题，颜色通过 CSS 变量驱动
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--color-paper) / <alpha-value>)',
          card: 'rgb(var(--color-paper-card) / <alpha-value>)',
          deep: 'rgb(var(--color-paper-deep) / <alpha-value>)',
          input: 'rgb(var(--color-paper-input) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
          ghost: 'rgb(var(--color-ink-ghost) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          soft: 'rgb(var(--color-gold-soft) / <alpha-value>)',
          faint: 'rgb(var(--color-gold-faint) / <alpha-value>)',
        },
        cinnabar: 'rgb(var(--color-cinnabar) / <alpha-value>)',
        wisteria: 'rgb(var(--color-wisteria) / <alpha-value>)',
        celadon: 'rgb(var(--color-celadon) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', '"Newsreader"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Noto Sans SC"', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        ticket: '4px',
        card: '6px',
        input: '8px',
      },
      letterSpacing: {
        shoujin: '0.3em',
        'widest-2': '0.2em',
      },
      boxShadow: {
        none: 'none',
        paper: '0 1px 2px rgba(53, 48, 58, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
