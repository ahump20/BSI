import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/game/',
  build: {
    outDir: '../../../public/game',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3001,
    open: true,
  },
});
