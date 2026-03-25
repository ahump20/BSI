/**
 * Vitest Configuration — BlazeSportsIntel
 *
 * Test Structure:
 * - /tests/analytics/ — Analytics library tests (ConferenceStrengthModel)
 * - /tests/api/ — API endpoint tests
 * - /tests/components/ — React component tests (ESPN box scores, etc.)
 * - /tests/workers/ — Worker handler tests (run via vitest.workers.config.ts)
 * - /tests/e2e/ — Playwright specs (excluded from Vitest, run separately)
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment
    environment: 'jsdom',

    // Global setup
    globals: true,

    // Test file patterns — exclude Playwright tests (routes, a11y, flows)
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'tests/routes/**',
      'tests/a11y/**',
      'tests/flows/**',
      'tests/smoke/**',
      'tests/workers/**',
      'tests/e2e/**',
      'node_modules/**',
    ],

    // Default timeout (10 seconds)
    testTimeout: 10000,

    // Hook timeouts
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'lib/**/*.{js,ts}',
        'workers/**/*.{js,ts}'
      ],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*'
      ],
      // Target coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Setup files (if needed for global test setup)
    setupFiles: [],

    // Module resolution
    alias: {
      '@': path.resolve(__dirname, './'),
      '@lib': path.resolve(__dirname, './lib'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@lib': path.resolve(__dirname, './lib'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
