import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Team Archetype Builder build config
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'team-archetype-builder'),
  base: '/tools/team-archetype-builder/',
  build: {
    outDir: resolve(__dirname, '../../dist/tools/team-archetype-builder'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'team-archetype-builder/index.html'),
    },
  },
  server: {
    port: 3001,
  },
});
