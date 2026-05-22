import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.js so the production build stays decoupled
// from the test toolchain.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
