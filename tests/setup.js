// Global test setup for Vitest
import { expect } from 'vitest';

// Add custom matchers if needed
expect.extend({
  toHaveParseCount(received, expected) {
    const pass = received.length === expected;
    if (pass) {
      return {
        message: () => `expected ${received.length} not to be ${expected} parse(s)`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${expected} parse(s), got ${received.length}`,
        pass: false,
      };
    }
  },
});

// Make test utilities available globally
global.testTimeout = 10000;