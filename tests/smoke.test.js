#!/usr/bin/env node

/**
 * Smoke tests - basic functionality check
 */

import { TestContext, assertEqual, runTest, runTests } from './test-utils.js';

const tests = [
  runTest('Smoke: Basic arithmetic', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute('5 + 3');
    assertEqual(result, 8, 'Addition');
  }),

  runTest('Smoke: Variable declaration', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 10
      x
    `);
    assertEqual(result, 10, 'Variable');
  }),

  runTest('Smoke: Function call', async () => {
    const ctx = new TestContext();
    ctx.addFunction('double', x => x * 2);
    const result = await ctx.execute('double(21)');
    assertEqual(result, 42, 'Function call');
  }),

  runTest('Smoke: String operations', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute('"Hello" + " " + "World"');
    assertEqual(result, "Hello World", 'String concat');
  }),

  runTest('Smoke: Array creation', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute('[1, 2, 3]');
    assertEqual(result.length, 3, 'Array length');
    assertEqual(result[0], 1, 'First element');
  }),

  runTest('Smoke: Object creation', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute('{ name: "Test", value: 42 }');
    assertEqual(result.name, "Test", 'Object property');
    assertEqual(result.value, 42, 'Object value');
  })
];

console.log('🔥 Smoke Test Suite\n');
runTests(tests);