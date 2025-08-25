#!/usr/bin/env node

/**
 * Unit tests for Wang interpreter
 */

import { TestContext, assertEqual, assertAsyncThrows, runTest, runTests } from '../test-utils.js';
import { WangError, UndefinedVariableError } from '../../dist/esm/utils/errors.js';

const tests = [
  runTest('Interpreter: Variable declaration', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 5
      x
    `);
    assertEqual(result, 5, 'Variable value');
  }),

  runTest('Interpreter: Variable assignment', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 5
      x = 10
      x
    `);
    assertEqual(result, 10, 'Updated value');
  }),

  runTest('Interpreter: Arithmetic operations', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let a = 10
      let b = 20
      a + b * 2
    `);
    assertEqual(result, 50, 'Arithmetic result');
  }),

  runTest('Interpreter: String concatenation', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let greeting = "Hello"
      let name = "World"
      greeting + ", " + name + "!"
    `);
    assertEqual(result, "Hello, World!", 'String concatenation');
  }),

  runTest('Interpreter: Boolean operations', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let a = true
      let b = false
      a && !b
    `);
    assertEqual(result, true, 'Boolean result');
  }),

  runTest('Interpreter: Comparison operators', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 10
      x > 5 && x < 20
    `);
    assertEqual(result, true, 'Comparison result');
  }),

  runTest('Interpreter: Function declaration and call', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function add(a, b) {
        return a + b
      }
      add(15, 25)
    `);
    assertEqual(result, 40, 'Function result');
  }),

  runTest('Interpreter: Arrow function', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const multiply = (x, y) => x * y
      multiply(6, 7)
    `);
    assertEqual(result, 42, 'Arrow function result');
  }),

  runTest('Interpreter: Object creation and access', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const person = {
        name: "Alice",
        age: 30
      }
      person.name + " is " + person.age
    `);
    assertEqual(result, "Alice is 30", 'Object access');
  }),

  runTest('Interpreter: Array creation and access', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const numbers = [10, 20, 30, 40, 50]
      numbers[2]
    `);
    assertEqual(result, 30, 'Array access');
  }),

  runTest('Interpreter: Array methods', async () => {
    const ctx = new TestContext();
    ctx.addFunction('sum', (arr) => arr.reduce((a, b) => a + b, 0));
    
    const result = await ctx.execute(`
      const numbers = [1, 2, 3, 4, 5]
      const doubled = map(numbers, x => x * 2)
      sum(doubled)
    `);
    assertEqual(result, 30, 'Array map and sum');
  }),

  runTest('Interpreter: If statement', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 15
      let result
      
      if (x > 10) {
        result = "big"
      } else {
        result = "small"
      }
      
      result
    `);
    assertEqual(result, "big", 'If statement result');
  }),

  runTest('Interpreter: For loop', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let sum = 0
      for (let i = 1; i <= 5; i++) {
        sum = sum + i
      }
      sum
    `);
    assertEqual(result, 15, 'For loop sum');
  }),

  runTest('Interpreter: For-of loop', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const numbers = [10, 20, 30]
      let total = 0
      for (let num of numbers) {
        total = total + num
      }
      total
    `);
    assertEqual(result, 60, 'For-of loop sum');
  }),

  runTest('Interpreter: While loop', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let count = 0
      let sum = 0
      while (count < 5) {
        sum = sum + count
        count = count + 1
      }
      sum
    `);
    assertEqual(result, 10, 'While loop sum');
  }),

  runTest('Interpreter: Conditional expression', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 10
      x > 5 ? "yes" : "no"
    `);
    assertEqual(result, "yes", 'Ternary operator');
  }),

  runTest('Interpreter: Nullish coalescing', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = null
      let y = 42
      x ?? y
    `);
    assertEqual(result, 42, 'Nullish coalescing');
  }),

  runTest('Interpreter: Object destructuring', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const person = { name: "Bob", age: 25 }
      const { name, age } = person
      name + " - " + age
    `);
    assertEqual(result, "Bob - 25", 'Object destructuring');
  }),

  runTest('Interpreter: Array destructuring', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const items = [1, 2, 3, 4, 5]
      const [first, second] = items
      first + second
    `);
    assertEqual(result, 3, 'Array destructuring');
  }),

  runTest('Interpreter: Rest parameters', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function sum(...numbers) {
        let total = 0
        for (let n of numbers) {
          total = total + n
        }
        return total
      }
      sum(1, 2, 3, 4, 5)
    `);
    assertEqual(result, 15, 'Rest parameters');
  }),

  runTest('Interpreter: Spread operator', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const arr1 = [1, 2, 3]
      const arr2 = [4, 5, 6]
      const combined = [...arr1, ...arr2]
      combined.length
    `);
    assertEqual(result, 6, 'Spread operator');
  }),

  runTest('Interpreter: Undefined variable error', async () => {
    const ctx = new TestContext();
    await assertAsyncThrows(
      () => ctx.execute('nonExistent + 1'),
      UndefinedVariableError,
      'Undefined variable'
    );
  }),

  runTest('Interpreter: Nested scopes', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 10
      function inner() {
        let x = 20
        return x
      }
      inner() + x
    `);
    assertEqual(result, 30, 'Nested scopes');
  }),

  runTest('Interpreter: Closure', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function makeAdder(x) {
        return function(y) {
          return x + y
        }
      }
      const add5 = makeAdder(5)
      add5(3)
    `);
    assertEqual(result, 8, 'Closure');
  }),

  runTest('Interpreter: Pipeline operator', async () => {
    const ctx = new TestContext();
    ctx.addFunction('double', x => x * 2);
    ctx.addFunction('addTen', x => x + 10);
    
    const result = await ctx.execute(`
      5 |> double(_) |> addTen(_)
    `);
    assertEqual(result, 20, 'Pipeline operator');
  }),

  runTest('Interpreter: Module import/export', async () => {
    const ctx = new TestContext();
    ctx.addModule('math', `
      export function square(x) {
        return x * x
      }
      export const PI = 3.14159
    `);
    
    const result = await ctx.execute(`
      import { square, PI } from "math"
      square(5) + PI
    `);
    // Note: Due to floating point, comparing approximately
    const expected = 25 + 3.14159;
    if (Math.abs(result - expected) > 0.00001) {
      throw new Error(`Expected ${expected}, got ${result}`);
    }
  }),

  runTest('Interpreter: Try-catch', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let result
      try {
        throw "error"
        result = "not reached"
      } catch (e) {
        result = "caught: " + e
      }
      result
    `);
    assertEqual(result, "caught: error", 'Try-catch');
  }),

  runTest('Interpreter: Update expressions', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      let x = 5
      let y = x++
      let z = ++x
      [x, y, z]
    `);
    assertEqual(result[0], 7, 'Final x value');
    assertEqual(result[1], 5, 'Postfix result');
    assertEqual(result[2], 7, 'Prefix result');
  })
];

runTests(tests);