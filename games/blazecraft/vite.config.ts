import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Use '/' for standalone deployment, '/games/blazecraft/' when embedded in BSI
  base: process.env.BSI_EMBED ? '/games/blazecraft/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@data': path.resolve(__dirname, './src/data'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },

  server: {
    port: 5175,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8790',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: '_static',  // Use _static instead of assets to bypass Cloudflare zone conflict
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
  },
});
