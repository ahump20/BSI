import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, '3d-showcase'),
  build: {
    outDir: '../../../dist/tools/3d-showcase',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
      '@components': resolve(__dirname, '../components'),
    },
  },
  base: '/tools/3d-showcase/',
});
