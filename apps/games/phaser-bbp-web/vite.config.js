import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/games/bbp-web/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  server: {
    port: 8080,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
