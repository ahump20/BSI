import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

// Plugin to copy Cloudflare Pages configuration files
const copyCloudflareFiles = () => ({
  name: 'copy-cloudflare-files',
  closeBundle() {
    // Copy _redirects and _headers to dist for Cloudflare Pages
    try {
      copyFileSync('_redirects', 'dist/_redirects');
      copyFileSync('_headers', 'dist/_headers');
      console.log('✅ Copied _redirects and _headers to dist/');
    } catch (err) {
      console.warn('⚠️  Could not copy Cloudflare files:', err.message);
    }
  }
});

export default defineConfig({
  plugins: [
    react(),
    copyCloudflareFiles()
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        football: resolve(__dirname, 'football.html'),
        basketball: resolve(__dirname, 'basketball.html'),
        tools: resolve(__dirname, 'tools.html')
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
});
