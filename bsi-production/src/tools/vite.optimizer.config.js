import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Monte Carlo Composition Optimizer build config
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'composition-optimizer'),
  base: '/tools/composition-optimizer/',
  build: {
    outDir: resolve(__dirname, '../../dist/tools/composition-optimizer'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'composition-optimizer/index.html'),
    },
  },
  server: {
    port: 3002,
  },
});
