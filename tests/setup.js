/**
 * Vitest Test Setup
 * Global test configuration and utilities
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (for React component tests)
afterEach(() => {
  cleanup();
});

// Custom matchers for sports data
expect.extend({
  toBeValidScore(received) {
    const pass = typeof received === 'number' && received >= 0 && Number.isInteger(received);
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid score`
        : `Expected ${received} to be a valid score (non-negative integer)`
    };
  },

  toBeValidWinPercentage(received) {
    const pass = typeof received === 'number' && received >= 0 && received <= 1;
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid win percentage`
        : `Expected ${received} to be a valid win percentage (between 0 and 1)`
    };
  },

  toBeValidRPI(received) {
    const pass = typeof received === 'number' && received >= 0 && received <= 1;
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid RPI`
        : `Expected ${received} to be a valid RPI (between 0 and 1)`
    };
  }
});

// Mock fetch for API tests
global.fetch = async (url) => {
  console.log(`Mock fetch called for: ${url}`);
  return {
    ok: true,
    json: async () => ({ success: true, data: [] })
  };
};

// Mock localStorage
const localStorageMock = {
  getItem: (key) => null,
  setItem: (key, value) => null,
  removeItem: (key) => null,
  clear: () => null
};
global.localStorage = localStorageMock;
