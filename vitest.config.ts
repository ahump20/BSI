import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, 'lib'),
      '@/lib': path.resolve(__dirname, 'lib'),
    },
  },
});
