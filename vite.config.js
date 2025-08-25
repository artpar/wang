import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Use global test APIs (describe, it, expect)
    globals: true,
    
    // Test environment
    environment: 'node',
    
    // Setup files
    setupFiles: ['./tests/setup.js'],
    
    // Test match patterns
    include: [
      'tests/**/*.spec.{js,ts}',
      'tests/**/*.test.{js,ts}',
      'tests/unit/*.spec.{js,ts}',
      'tests/integration/*.spec.{js,ts}'
    ],
    exclude: [
      'tests/**/*.legacy.js',
      'tests/smoke.test.js',
      'node_modules/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        'scripts',
        'tests',
        '*.config.{js,ts}',
        'src/generated/**'
      ]
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Retry failed tests
    retry: 0,
    
    // Run tests in parallel
    threads: true,
    
    // Reporter
    reporters: ['verbose']
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './tests')
    }
  }
});