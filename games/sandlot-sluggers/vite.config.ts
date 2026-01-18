import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
    // Target modern browsers for smaller bundle
    target: 'es2020',
  },

  server: {
    port: 5173,
    open: true,
    host: true, // Allow external access for mobile testing
  },

  preview: {
    port: 4173,
    open: true,
  },

  // Optimize Three.js imports
  optimizeDeps: {
    include: ['three'],
    esbuildOptions: {
      target: 'es2020',
    },
  },

  // Environment variable prefix
  envPrefix: 'VITE_',

  // Define globals
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
  },
});
