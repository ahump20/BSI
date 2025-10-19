import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json-summary'],
      include: ['lib/**/*.ts']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
