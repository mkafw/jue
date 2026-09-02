import type { Config } from 'tailwindcss';

/**
 * QA-OS 设计令牌系统
 * 烟光暮山紫 × 瘦金体骨骼 × Claude 文具店社论风
 * 支持明暗双主题（CSS 变量驱动）
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 宣纸底色系统
        paper: {
          DEFAULT: 'rgb(var(--color-paper) / <alpha-value>)',
          card: 'rgb(var(--color-paper-card) / <alpha-value>)',
          deep: 'rgb(var(--color-paper-deep) / <alpha-value>)',
          input: 'rgb(var(--color-paper-input) / <alpha-value>)',
        },
        // 松烟墨迹系统
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
          ghost: 'rgb(var(--color-ink-ghost) / <alpha-value>)',
        },
        // 暗金徽标
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
        paper: '0 1px 2px rgb(var(--color-ink) / 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
