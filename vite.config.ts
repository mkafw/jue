import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // 相对路径，适配 GitHub Pages 子路径部署
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            d3: ['d3'],
          },
        },
      },
    },
  };
});
