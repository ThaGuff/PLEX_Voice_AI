import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/voice': { target: 'http://localhost:3001', changeOrigin: true },
      '/setup': { target: 'http://localhost:3001', changeOrigin: true },
      '/webhooks': { target: 'http://localhost:3001', changeOrigin: true },
    }
  },
  build: { outDir: 'dist', sourcemap: false }
});
