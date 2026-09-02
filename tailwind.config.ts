import type { Config } from 'tailwindcss';

/**
 * QA-OS 设计令牌系统
 * 烟光暮山紫 × 瘦金体骨骼 × Claude 文具店社论风
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 宣纸底色系统
        paper: {
          DEFAULT: '#F6F3F8',
          card: '#EFEBF2',
          deep: '#E8E2ED',
          input: '#FAF8FC',
        },
        // 松烟墨迹系统
        ink: {
          DEFAULT: '#35303A',
          soft: '#6B6473',
          faint: '#9B94A3',
          ghost: '#C4BDCC',
        },
        // 暗金徽标
        gold: {
          DEFAULT: '#A88C52',
          soft: '#C4A96E',
          faint: '#E8DCC4',
        },
        cinnabar: '#C12C1F',
        wisteria: '#A194AD',
        celadon: '#7A9B8A',
        line: '#D8D2DE',
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
