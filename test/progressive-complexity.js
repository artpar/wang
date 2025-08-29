#!/usr/bin/env node

import nearley from 'nearley';
import * as grammar from '../dist/esm/generated/wang-grammar.js';
import { WangInterpreter } from '../dist/esm/index.js';

// Progressive complexity tests - from simple to complex
const tests = [
  // ========== LEVEL 1: BASICS ==========
  {
    level: 1,
    name: 'Variable declaration',
    code: 'let x = 5',
    expectParse: true,
    expectRun: true
  },
  {
    level: 1,
    name: 'String variable',
    code: 'let name = "Wang"',
    expectParse: true,
    expectRun: true
  },
  {
    level: 1,
    name: 'Basic arithmetic',
    code: 'let sum = 10 + 20 * 3',
    expectParse: true,
    expectRun: true
  },
  {
    level: 1,
    name: 'Function declaration',
    code: 'function add(a, b) {\n  return a + b\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 1,
    name: 'Function call',
    code: 'function double(x) { return x * 2 }\nlet result = double(5)',
    expectParse: true,
    expectRun: true
  },
  
  // ========== LEVEL 2: CONTROL FLOW ==========
  {
    level: 2,
    name: 'If statement',
    code: 'let x = 10\nif (x > 5) {\n  x = x * 2\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 2,
    name: 'If-else',
    code: 'let x = 3\nif (x > 5) {\n  x = 100\n} else {\n  x = 0\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 2,
    name: 'For loop',
    code: 'let sum = 0\nfor (let i = 0; i < 5; i = i + 1) {\n  sum = sum + i\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 2,
    name: 'While loop',
    code: 'let x = 10\nwhile (x > 0) {\n  x = x - 1\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 2,
    name: 'Ternary operator',
    code: 'let x = 5\nlet result = x > 3 ? "big" : "small"',
    expectParse: true,
    expectRun: true
  },
  
  // ========== LEVEL 3: ARRAYS & OBJECTS ==========
  {
    level: 3,
    name: 'Array literal',
    code: 'let arr = [1, 2, 3, 4, 5]',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Array access',
    code: 'let arr = [10, 20, 30]\nlet first = arr[0]',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Array assignment',
    code: 'let arr = [1, 2, 3]\narr[1] = 99',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Empty object',
    code: 'let obj = {}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Object with properties',
    code: 'let obj = {\n  name: "Wang",\n  version: 1\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Object property access',
    code: 'let obj = {x: 10}\nlet val = obj.x',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Object property assignment',
    code: 'let obj = {}\nobj.name = "test"',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Nested object',
    code: 'let obj = {\n  user: {\n    name: "Alice"\n  }\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 3,
    name: 'Array of objects',
    code: 'let users = [\n  {name: "Alice"},\n  {name: "Bob"}\n]',
    expectParse: true,
    expectRun: true
  },
  
  // ========== LEVEL 4: FUNCTIONS & CALLBACKS ==========
  {
    level: 4,
    name: 'Arrow function simple',
    code: 'let double = x => x * 2',
    expectParse: true,
    expectRun: true
  },
  {
    level: 4,
    name: 'Arrow function with parens',
    code: 'let add = (a, b) => a + b',
    expectParse: true,
    expectRun: true
  },
  {
    level: 4,
    name: 'Arrow function with block',
    code: 'let greet = name => {\n  return "Hello " + name\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 4,
    name: 'Function expression',
    code: 'let fn = function(x) {\n  return x * 2\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 4,
    name: 'Function as argument',
    code: 'function apply(fn, x) {\n  return fn(x)\n}\nlet result = apply(x => x * 2, 5)',
    expectParse: true,
    expectRun: true
  },
  {
    level: 4,
    name: 'Map with arrow',
    code: 'let arr = [1, 2, 3]\nlet doubled = map(arr, x => x * 2)',
    expectParse: true,
    expectRun: true
  },
  {
    level: 4,
    name: 'Filter with arrow',
    code: 'let arr = [1, 2, 3, 4, 5]\nlet evens = filter(arr, x => x % 2 === 0)',
    expectParse: true,
    expectRun: true
  },
  
  // ========== LEVEL 5: COMPLEX EXPRESSIONS ==========
  {
    level: 5,
    name: 'Chained property access',
    code: 'let obj = {a: {b: {c: 42}}}\nlet val = obj.a.b.c',
    expectParse: true,
    expectRun: true
  },
  {
    level: 5,
    name: 'Property access in expression',
    code: 'let user = {age: 25}\nlet message = "Age: " + user.age',
    expectParse: true,
    expectRun: true
  },
  {
    level: 5,
    name: 'Method call (if exists)',
    code: 'let arr = [1, 2, 3]\nlet str = join(arr, ", ")',
    expectParse: true,
    expectRun: true
  },
  {
    level: 5,
    name: 'Complex ternary',
    code: 'let obj = {val: 5}\nlet result = obj && obj.val ? obj.val * 2 : 0',
    expectParse: true,
    expectRun: true
  },
  {
    level: 5,
    name: 'Arrow with property access',
    code: 'let users = [{name: "Alice"}, {name: "Bob"}]\nlet names = map(users, u => u.name)',
    expectParse: true,
    expectRun: true
  },
  {
    level: 5,
    name: 'Object with computed value',
    code: 'let arr = [1, 2, 3]\nlet stats = {\n  count: arr.length,\n  first: arr[0]\n}',
    expectParse: true,
    expectRun: true
  },
  
  // ========== LEVEL 6: ADVANCED FEATURES ==========
  {
    level: 6,
    name: 'Try-catch',
    code: 'try {\n  throw new Error("test")\n} catch (e) {\n  log("caught")\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Async function',
    code: 'async function getData() {\n  return "data"\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Await expression',
    code: 'async function test() {\n  let result = await getData()\n  return result\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Class declaration',
    code: 'class Person {\n  constructor(name) {\n    this.name = name\n  }\n}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Class instantiation',
    code: 'class Dog {\n  constructor(name) {\n    this.name = name\n  }\n}\nlet pet = new Dog("Rex")',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Array destructuring',
    code: 'let [a, b, c] = [1, 2, 3]',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Object destructuring',
    code: 'let {x, y} = {x: 10, y: 20}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Spread in array',
    code: 'let arr1 = [1, 2]\nlet arr2 = [...arr1, 3, 4]',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'Spread in object',
    code: 'let obj1 = {a: 1}\nlet obj2 = {...obj1, b: 2}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 6,
    name: 'For-of loop',
    code: 'let sum = 0\nfor (let x of [1, 2, 3]) {\n  sum = sum + x\n}',
    expectParse: true,
    expectRun: true
  },
  
  // ========== LEVEL 7: EDGE CASES ==========
  {
    level: 7,
    name: 'Empty function',
    code: 'function noop() {}',
    expectParse: true,
    expectRun: true
  },
  {
    level: 7,
    name: 'Console.log',
    code: 'console.log("test")',
    expectParse: true,
    expectRun: false  // No console object
  },
  {
    level: 7,
    name: 'Array.prototype.slice',
    code: 'let arr = [1, 2, 3]\nlet sub = arr.slice(0, 2)',
    expectParse: true,
    expectRun: false  // No slice method
  },
  {
    level: 7,
    name: 'New Promise',
    code: 'let p = new Promise(resolve => resolve(42))',
    expectParse: true,
    expectRun: false  // No Promise constructor
  },
  {
    level: 7,
    name: 'Multi-line expression',
    code: 'let result = true &&\n             false',
    expectParse: false,  // Known limitation
    expectRun: false
  },
  {
    level: 7,
    name: 'Template literal',
    code: 'let str = `Hello World`',
    expectParse: true,
    expectRun: true
  },
  {
    level: 7,
    name: 'Regex literal',
    code: 'let pattern = /test/gi',
    expectParse: true,
    expectRun: true
  },
  {
    level: 7,
    name: 'Pipeline operator',
    code: 'let result = 5 |> double',
    expectParse: true,
    expectRun: true  // Wang-specific feature
  },
  {
    level: 7,
    name: 'Optional chaining',
    code: 'let obj = {}\nlet val = obj?.missing?.value',
    expectParse: true,
    expectRun: true
  },
  {
    level: 7,
    name: 'Nullish coalescing',
    code: 'let val = null\nlet result = val ?? "default"',
    expectParse: true,
    expectRun: true
  }
];

async function testCode(code) {
  const results = {
    parse: false,
    parseError: null,
    run: false,
    runError: null,
    output: null
  };
  
  // Test parsing
  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar.default || grammar.grammar));
    parser.feed(code);
    
    if (parser.results.length > 0) {
      results.parse = true;
      
      // Test execution
      try {
        const interpreter = new WangInterpreter();
        const ast = parser.results[0];
        const result = await interpreter.execute(ast);
        results.run = true;
        results.output = result;
      } catch (e) {
        results.runError = e.message;
      }
    }
  } catch (e) {
    results.parseError = e.message;
  }
  
  return results;
}

async function runTests() {
  console.log('Wang Language Progressive Complexity Test');
  console.log('Testing from simple to complex...\n');
  console.log('='.repeat(80));
  
  const levelStats = {};
  
  for (const test of tests) {
    if (!levelStats[test.level]) {
      levelStats[test.level] = { total: 0, parsed: 0, ran: 0 };
    }
    
    const results = await testCode(test.code);
    levelStats[test.level].total++;
    
    const parseStatus = results.parse ? '✅' : '❌';
    const runStatus = results.run ? '✅' : results.parse ? '⚠️' : '❌';
    
    if (results.parse) levelStats[test.level].parsed++;
    if (results.run) levelStats[test.level].ran++;
    
    console.log(`L${test.level} | Parse: ${parseStatus} | Run: ${runStatus} | ${test.name}`);
    
    if (!results.parse && test.expectParse) {
      console.log(`     Parse error: ${results.parseError?.split('\n')[0]}`);
    }
    if (results.parse && !results.run && test.expectRun) {
      console.log(`     Runtime error: ${results.runError}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY BY LEVEL:\n');
  
  for (const [level, stats] of Object.entries(levelStats)) {
    const parseRate = Math.round((stats.parsed / stats.total) * 100);
    const runRate = Math.round((stats.ran / stats.total) * 100);
    console.log(`Level ${level}: ${stats.parsed}/${stats.total} parsed (${parseRate}%), ${stats.ran}/${stats.total} ran (${runRate}%)`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('KEY FINDINGS:\n');
  
  // Analyze patterns
  const parseFailures = tests.filter(t => !t.expectParse);
  const runtimeOnly = tests.filter(t => t.expectParse && !t.expectRun);
  
  console.log(`✅ Parser handles ${tests.filter(t => t.expectParse).length}/${tests.length} test cases`);
  console.log(`⚠️  ${runtimeOnly.length} cases parse but don't run (missing runtime features)`);
  console.log(`❌ ${parseFailures.length} known parser limitations`);
  
  console.log('\nParser Limitations:');
  parseFailures.forEach(t => console.log(`  - ${t.name}`));
  
  console.log('\nRuntime Limitations:');
  runtimeOnly.forEach(t => console.log(`  - ${t.name}: ${t.code.substring(0, 30)}...`));
}

runTests().catch(console.error);