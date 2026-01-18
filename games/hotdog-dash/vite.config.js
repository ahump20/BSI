import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use '/' for standalone pages.dev deployment
  // Change to '/games/hotdog-dash/' if embedding in main BSI site
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5175,
  },
});
