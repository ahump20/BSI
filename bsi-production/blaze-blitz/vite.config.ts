import { defineConfig } from 'vite';

export default defineConfig({
  base: '/blaze-blitz/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core', '@babylonjs/loaders'],
          physics: ['@dimforge/rapier3d'],
          ai: ['yuka']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d']
  }
});
