/**
 * Vitest Configuration
 *
 * Test configuration for BlazeSportsIntel college baseball analytics platform.
 *
 * Test Structure:
 * - /tests/analytics/ - Analytics library tests (ConferenceStrengthModel, ScheduleOptimizer)
 * - /tests/api/ - API endpoint tests (scheduling/optimize)
 * - /tests/components/ - React component tests (future)
 *
 * Environment:
 * - jsdom for React component testing
 * - node for API and analytics library testing
 *
 * Timeouts:
 * - Default: 10 seconds
 * - API tests: 30 seconds (configured in test files)
 *
 * Coverage:
 * - Target: >80% coverage for all code
 * - Includes: lib/, functions/
 * - Excludes: node_modules, dist, tests
 *
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
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

    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
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
        'functions/**/*.{js,ts}'
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
      '@functions': path.resolve(__dirname, './functions'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@lib': path.resolve(__dirname, './lib'),
      '@functions': path.resolve(__dirname, './functions'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
