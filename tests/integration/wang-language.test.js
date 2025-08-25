#!/usr/bin/env node

/**
 * Integration tests for Wang language
 * Tests complete programs and real-world scenarios
 */

import { TestContext, assertEqual, runTest, runTests } from '../test-utils.js';

const tests = [
  runTest('Integration: Fibonacci sequence', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function fibonacci(n) {
        if (n <= 1) {
          return n
        }
        return fibonacci(n - 1) + fibonacci(n - 2)
      }
      
      fibonacci(10)
    `);
    assertEqual(result, 55, 'Fibonacci(10)');
  }),

  runTest('Integration: Array processing pipeline', async () => {
    const ctx = new TestContext();
    ctx.addFunction('sum', arr => arr.reduce((a, b) => a + b, 0));
    
    const result = await ctx.execute(`
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      
      const evens = filter(numbers, n => n % 2 === 0)
      const doubled = map(evens, n => n * 2)
      sum(doubled)
    `);
    assertEqual(result, 60, 'Filter, map, sum pipeline');
  }),

  runTest('Integration: Object-oriented programming', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      class Rectangle {
        constructor(width, height) {
          this.width = width
          this.height = height
        }
        
        area() {
          return this.width * this.height
        }
        
        perimeter() {
          return 2 * (this.width + this.height)
        }
      }
      
      const rect = new Rectangle(5, 3)
      rect.area() + rect.perimeter()
    `);
    assertEqual(result, 31, 'Class methods');
  }),

  runTest('Integration: Higher-order functions', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function compose(f, g) {
        return function(x) {
          return f(g(x))
        }
      }
      
      const addOne = x => x + 1
      const double = x => x * 2
      
      const doubleThenAdd = compose(addOne, double)
      doubleThenAdd(5)
    `);
    assertEqual(result, 11, 'Function composition');
  }),

  runTest('Integration: Recursive data structures', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function sumTree(node) {
        if (!node) return 0
        
        let sum = node.value
        if (node.left) sum = sum + sumTree(node.left)
        if (node.right) sum = sum + sumTree(node.right)
        return sum
      }
      
      const tree = {
        value: 10,
        left: {
          value: 5,
          left: { value: 3 },
          right: { value: 7 }
        },
        right: {
          value: 15,
          left: { value: 12 },
          right: { value: 20 }
        }
      }
      
      sumTree(tree)
    `);
    assertEqual(result, 72, 'Tree sum');
  }),

  runTest('Integration: Complex control flow', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function fizzbuzz(n) {
        const results = []
        
        for (let i = 1; i <= n; i++) {
          if (i % 15 === 0) {
            push(results, "FizzBuzz")
          } else if (i % 3 === 0) {
            push(results, "Fizz")
          } else if (i % 5 === 0) {
            push(results, "Buzz")
          } else {
            push(results, i)
          }
        }
        
        return results
      }
      
      const fb = fizzbuzz(15)
      fb[14]  // Should be "FizzBuzz" for 15
    `);
    assertEqual(result, "FizzBuzz", 'FizzBuzz');
  }),

  runTest('Integration: Module system', async () => {
    const ctx = new TestContext();
    
    ctx.addModule('utils', `
      export function greet(name) {
        return "Hello, " + name
      }
      
      export function farewell(name) {
        return "Goodbye, " + name
      }
      
      export const VERSION = "1.0.0"
    `);
    
    ctx.addModule('math', `
      export function add(a, b) { return a + b }
      export function multiply(a, b) { return a * b }
      export function power(base, exp) {
        let result = 1
        for (let i = 0; i < exp; i++) {
          result = result * base
        }
        return result
      }
    `);
    
    const result = await ctx.execute(`
      import { greet, VERSION } from "utils"
      import { power } from "math"
      
      const message = greet("World")
      const result = power(2, 8)
      
      message + " v" + VERSION + " = " + result
    `);
    assertEqual(result, "Hello, World v1.0.0 = 256", 'Module imports');
  }),

  runTest('Integration: Async/await simulation', async () => {
    const ctx = new TestContext();
    ctx.addFunction('delay', ms => new Promise(resolve => setTimeout(resolve, ms)));
    ctx.addFunction('fetchData', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { status: "success", data: 42 };
    });
    
    const result = await ctx.execute(`
      async function getData() {
        const response = await fetchData()
        return response.data
      }
      
      getData()
    `);
    assertEqual(result, 42, 'Async function');
  }),

  runTest('Integration: Pipeline operator with complex transformations', async () => {
    const ctx = new TestContext();
    ctx.addFunction('split', (str, sep) => str.split(sep));
    ctx.addFunction('trim', str => str.trim());
    ctx.addFunction('upperCase', str => str.toUpperCase());
    
    const result = await ctx.execute(`
      const text = "  hello world  "
      
      text 
        |> trim(_)
        |> upperCase(_)
        |> split(_, " ")
    `);
    assertEqual(result.length, 2, 'Pipeline result length');
    assertEqual(result[0], "HELLO", 'First word');
    assertEqual(result[1], "WORLD", 'Second word');
  }),

  runTest('Integration: Error handling', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function safeDivide(a, b) {
        try {
          if (b === 0) {
            throw "Division by zero"
          }
          return a / b
        } catch (e) {
          return "Error: " + e
        }
      }
      
      const results = []
      push(results, safeDivide(10, 2))
      push(results, safeDivide(10, 0))
      push(results, safeDivide(20, 4))
      results
    `);
    assertEqual(result[0], 5, 'Normal division');
    assertEqual(result[1], "Error: Division by zero", 'Error caught');
    assertEqual(result[2], 5, 'Another division');
  }),

  runTest('Integration: Complex data transformation', async () => {
    const ctx = new TestContext();
    ctx.addFunction('groupBy', (arr, keyFn) => {
      const groups = {};
      for (const item of arr) {
        const key = keyFn(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
      return groups;
    });
    
    const result = await ctx.execute(`
      const people = [
        { name: "Alice", age: 30, city: "NY" },
        { name: "Bob", age: 25, city: "LA" },
        { name: "Charlie", age: 30, city: "NY" },
        { name: "Diana", age: 25, city: "LA" }
      ]
      
      const byAge = groupBy(people, p => p.age)
      const ages30 = byAge[30]
      ages30.length
    `);
    assertEqual(result, 2, 'Grouped by age');
  }),

  runTest('Integration: Memoization pattern', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function memoize(fn) {
        const cache = {}
        return function(n) {
          if (cache[n] !== undefined) {
            return cache[n]
          }
          const result = fn(n)
          cache[n] = result
          return result
        }
      }
      
      function slowFib(n) {
        if (n <= 1) return n
        return slowFib(n - 1) + slowFib(n - 2)
      }
      
      const fastFib = memoize(slowFib)
      
      // This would be slow without memoization
      fastFib(20)
    `);
    assertEqual(result, 6765, 'Memoized fibonacci');
  }),

  runTest('Integration: Factory pattern', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      function createCounter(initial) {
        let count = initial || 0
        
        return {
          increment: function() {
            count = count + 1
            return count
          },
          decrement: function() {
            count = count - 1
            return count
          },
          getValue: function() {
            return count
          }
        }
      }
      
      const counter1 = createCounter(10)
      const counter2 = createCounter(20)
      
      counter1.increment()
      counter1.increment()
      counter2.decrement()
      
      counter1.getValue() + counter2.getValue()
    `);
    assertEqual(result, 31, 'Factory pattern');
  }),

  runTest('Integration: Nested destructuring', async () => {
    const ctx = new TestContext();
    const result = await ctx.execute(`
      const data = {
        user: {
          name: "John",
          address: {
            city: "Boston",
            zip: "02134"
          },
          tags: ["developer", "javascript"]
        }
      }
      
      const { user: { name, address: { city } } } = data
      name + " from " + city
    `);
    assertEqual(result, "John from Boston", 'Nested destructuring');
  })
];

runTests(tests);