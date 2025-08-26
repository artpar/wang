/**
 * Test that the CommonJS package exports work correctly
 * This test ensures the published package can be imported via CommonJS
 */

const assert = require('assert');
const path = require('path');

// Test importing from the built package
const { 
  WangInterpreter, 
  InMemoryModuleResolver,
  WangError,
  VERSION 
} = require('../dist/cjs/index.cjs');

console.log('Testing CommonJS package exports...\n');

// Test 1: Check exports exist
console.log('✓ WangInterpreter exported');
assert(WangInterpreter, 'WangInterpreter should be exported');

console.log('✓ InMemoryModuleResolver exported');
assert(InMemoryModuleResolver, 'InMemoryModuleResolver should be exported');

console.log('✓ WangError exported');
assert(WangError, 'WangError should be exported');

console.log('✓ VERSION exported');
assert(VERSION, 'VERSION should be exported');

// Test 2: Create interpreter instance
const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
    add: (a, b) => a + b
  }
});

console.log('✓ Interpreter instance created successfully');

// Test 3: Execute simple code
(async () => {
  try {
    const result = await interpreter.execute('let x = 5; let y = 10; add(x, y)');
    assert.strictEqual(result, 15, 'Should execute simple arithmetic');
    console.log('✓ Simple code execution works');
    
    // Test 4: Module system
    resolver.addModule('testModule', `
      export function multiply(a, b) {
        return a * b
      }
    `);
    
    interpreter.bindFunction('multiply', (a, b) => a * b);
    
    const moduleResult = await interpreter.execute(`
      import { multiply } from "testModule";
      multiply(3, 4)
    `);
    assert.strictEqual(moduleResult, 12, 'Should handle module imports');
    console.log('✓ Module system works');
    
    console.log('\n✅ All CommonJS package tests passed!');
    console.log(`📦 Package version: ${VERSION}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
})();