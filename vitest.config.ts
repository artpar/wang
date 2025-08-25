import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '*.config.ts',
        'scripts/',
        'examples/'
      ]
    },
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});