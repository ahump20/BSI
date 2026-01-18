import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      compress: true,
    }),
  ],
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
        unsafe: true,
        unsafe_math: true,
        unsafe_arrows: true,
      },
      mangle: {
        properties: {
          regex: /^\$/, // Mangle properties starting with $
        },
      },
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  define: {
    DEBUG: 'false',
    NO_DEBUG: 'true',
    DEBUG_CAMERA: 'undefined',
    DEBUG_FLAG0: 'undefined',
    DEBUG_FLAG1: 'undefined',
    DEBUG_FLAG2: 'undefined',
    DEBUG_FLAG3: 'undefined',
  },
});
