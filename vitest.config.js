import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setupTests.js',
    globals: true,
    include: ['tests/components/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['tests/integration/**', 'context7-enhanced/**', 'tests/api-endpoints.test.js']
  }
})
