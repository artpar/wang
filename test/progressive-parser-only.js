#!/usr/bin/env node

import nearley from 'nearley';
import * as grammar from '../dist/esm/generated/wang-grammar.js';

// Progressive complexity tests - parser only
const tests = [
  // ========== LEVEL 1: BASICS ==========
  {
    level: 1,
    name: 'Variable declaration',
    code: 'let x = 5'
  },
  {
    level: 1,
    name: 'String variable',
    code: 'let name = "Wang"'
  },
  {
    level: 1,
    name: 'Basic arithmetic',
    code: 'let sum = 10 + 20 * 3'
  },
  {
    level: 1,
    name: 'Function declaration',
    code: 'function add(a, b) {\n  return a + b\n}'
  },
  {
    level: 1,
    name: 'Function call',
    code: 'function double(x) { return x * 2 }\nlet result = double(5)'
  },
  
  // ========== LEVEL 2: CONTROL FLOW ==========
  {
    level: 2,
    name: 'If statement',
    code: 'let x = 10\nif (x > 5) {\n  x = x * 2\n}'
  },
  {
    level: 2,
    name: 'If-else',
    code: 'let x = 3\nif (x > 5) {\n  x = 100\n} else {\n  x = 0\n}'
  },
  {
    level: 2,
    name: 'For loop',
    code: 'let sum = 0\nfor (let i = 0; i < 5; i = i + 1) {\n  sum = sum + i\n}'
  },
  {
    level: 2,
    name: 'While loop',
    code: 'let x = 10\nwhile (x > 0) {\n  x = x - 1\n}'
  },
  {
    level: 2,
    name: 'Ternary operator',
    code: 'let x = 5\nlet result = x > 3 ? "big" : "small"'
  },
  
  // ========== LEVEL 3: ARRAYS & OBJECTS ==========
  {
    level: 3,
    name: 'Array literal',
    code: 'let arr = [1, 2, 3, 4, 5]'
  },
  {
    level: 3,
    name: 'Array access',
    code: 'let arr = [10, 20, 30]\nlet first = arr[0]'
  },
  {
    level: 3,
    name: 'Array assignment',
    code: 'let arr = [1, 2, 3]\narr[1] = 99'
  },
  {
    level: 3,
    name: 'Empty object',
    code: 'let obj = {}'
  },
  {
    level: 3,
    name: 'Object with properties',
    code: 'let obj = {\n  name: "Wang",\n  version: 1\n}'
  },
  {
    level: 3,
    name: 'Object property access',
    code: 'let obj = {x: 10}\nlet val = obj.x'
  },
  {
    level: 3,
    name: 'Object property assignment',
    code: 'let obj = {}\nobj.name = "test"'
  },
  {
    level: 3,
    name: 'Nested object',
    code: 'let obj = {\n  user: {\n    name: "Alice"\n  }\n}'
  },
  {
    level: 3,
    name: 'Array of objects',
    code: 'let users = [\n  {name: "Alice"},\n  {name: "Bob"}\n]'
  },
  {
    level: 3,
    name: 'Object with array property',
    code: 'let data = {\n  items: [1, 2, 3],\n  count: 3\n}'
  },
  {
    level: 3,
    name: 'Object with expression value',
    code: 'let arr = [1, 2, 3]\nlet obj = {\n  size: arr.length\n}'
  },
  
  // ========== LEVEL 4: FUNCTIONS & CALLBACKS ==========
  {
    level: 4,
    name: 'Arrow function simple',
    code: 'let double = x => x * 2'
  },
  {
    level: 4,
    name: 'Arrow function with parens',
    code: 'let add = (a, b) => a + b'
  },
  {
    level: 4,
    name: 'Arrow function with block',
    code: 'let greet = name => {\n  return "Hello " + name\n}'
  },
  {
    level: 4,
    name: 'Arrow with property access',
    code: 'let getName = user => user.name'
  },
  {
    level: 4,
    name: 'Arrow block with property access',
    code: 'let process = item => {\n  return item.value * 2\n}'
  },
  {
    level: 4,
    name: 'Function expression',
    code: 'let fn = function(x) {\n  return x * 2\n}'
  },
  {
    level: 4,
    name: 'Function as argument',
    code: 'function apply(fn, x) {\n  return fn(x)\n}\nlet result = apply(x => x * 2, 5)'
  },
  {
    level: 4,
    name: 'Map with arrow',
    code: 'let arr = [1, 2, 3]\nlet doubled = map(arr, x => x * 2)'
  },
  {
    level: 4,
    name: 'Map with arrow and property',
    code: 'let users = [{name: "Alice"}]\nlet names = map(users, u => u.name)'
  },
  {
    level: 4,
    name: 'Map with index parameter',
    code: 'let arr = [10, 20, 30]\nlet indexed = map(arr, (val, idx) => val + idx)'
  },
  {
    level: 4,
    name: 'Filter with arrow',
    code: 'let arr = [1, 2, 3, 4, 5]\nlet evens = filter(arr, x => x % 2 === 0)'
  },
  
  // ========== LEVEL 5: COMPLEX EXPRESSIONS ==========
  {
    level: 5,
    name: 'Chained property access',
    code: 'let obj = {a: {b: {c: 42}}}\nlet val = obj.a.b.c'
  },
  {
    level: 5,
    name: 'Property in string concat',
    code: 'let user = {age: 25}\nlet message = "Age: " + user.age'
  },
  {
    level: 5,
    name: 'Method call syntax',
    code: 'let arr = [1, 2, 3]\nlet str = arr.join(", ")'
  },
  {
    level: 5,
    name: 'Complex ternary',
    code: 'let obj = {val: 5}\nlet result = obj && obj.val ? obj.val * 2 : 0'
  },
  {
    level: 5,
    name: 'Nested ternary',
    code: 'let x = 5\nlet type = x > 10 ? "big" : x > 5 ? "medium" : "small"'
  },
  {
    level: 5,
    name: 'Mixed operations',
    code: 'let data = {items: [1, 2, 3]}\nlet result = data.items[0] + data.items.length'
  },
  {
    level: 5,
    name: 'Console.log with property',
    code: 'let report = {count: 10}\nconsole.log("Count: " + report.count)'
  },
  {
    level: 5,
    name: 'Multi-line expression (should fail)',
    code: 'let result = (a > b) &&\n             (b > c)',
    expectFail: true
  },
  
  // ========== LEVEL 6: ADVANCED FEATURES ==========
  {
    level: 6,
    name: 'Try-catch',
    code: 'try {\n  throw new Error("test")\n} catch (e) {\n  log("caught")\n}'
  },
  {
    level: 6,
    name: 'Try-finally',
    code: 'try {\n  risky()\n} finally {\n  cleanup()\n}'
  },
  {
    level: 6,
    name: 'Async function',
    code: 'async function getData() {\n  return "data"\n}'
  },
  {
    level: 6,
    name: 'Await expression',
    code: 'async function test() {\n  let result = await getData()\n  return result\n}'
  },
  {
    level: 6,
    name: 'Class declaration',
    code: 'class Person {\n  constructor(name) {\n    this.name = name\n  }\n}'
  },
  {
    level: 6,
    name: 'Class with method',
    code: 'class Dog {\n  bark() {\n    return "woof"\n  }\n}'
  },
  {
    level: 6,
    name: 'Class instantiation',
    code: 'class Cat {}\nlet pet = new Cat()'
  },
  {
    level: 6,
    name: 'Array destructuring',
    code: 'let [a, b, c] = [1, 2, 3]'
  },
  {
    level: 6,
    name: 'Object destructuring',
    code: 'let {x, y} = {x: 10, y: 20}'
  },
  {
    level: 6,
    name: 'Rest parameters',
    code: 'function sum(...numbers) {\n  return numbers\n}'
  },
  {
    level: 6,
    name: 'Spread in array',
    code: 'let arr1 = [1, 2]\nlet arr2 = [...arr1, 3, 4]'
  },
  {
    level: 6,
    name: 'Spread in object',
    code: 'let obj1 = {a: 1}\nlet obj2 = {...obj1, b: 2}'
  },
  {
    level: 6,
    name: 'For-of loop',
    code: 'let sum = 0\nfor (let x of [1, 2, 3]) {\n  sum = sum + x\n}'
  },
  
  // ========== LEVEL 7: EDGE CASES & SPECIAL ==========
  {
    level: 7,
    name: 'Empty function',
    code: 'function noop() {}'
  },
  {
    level: 7,
    name: 'This keyword',
    code: 'let obj = {\n  value: 42,\n  getValue() {\n    return this.value\n  }\n}'
  },
  {
    level: 7,
    name: 'New with arguments',
    code: 'let d = new Date(2024, 1, 1)'
  },
  {
    level: 7,
    name: 'Template literal',
    code: 'let str = `Hello World`'
  },
  {
    level: 7,
    name: 'Regex literal',
    code: 'let pattern = /test/gi'
  },
  {
    level: 7,
    name: 'Pipeline operator',
    code: 'let result = 5 |> double'
  },
  {
    level: 7,
    name: 'Optional chaining',
    code: 'let obj = {}\nlet val = obj?.missing?.value'
  },
  {
    level: 7,
    name: 'Nullish coalescing',
    code: 'let val = null\nlet result = val ?? "default"'
  },
  {
    level: 7,
    name: 'Typeof operator',
    code: 'let type = typeof "string"'
  },
  {
    level: 7,
    name: 'Instanceof operator',
    code: 'let isArray = [] instanceof Array'
  },
  {
    level: 7,
    name: 'In operator',
    code: 'let hasName = "name" in {name: "test"}'
  },
  {
    level: 7,
    name: 'Void expression',
    code: 'let nothing = void 0'
  },
  {
    level: 7,
    name: 'Delete (if supported)',
    code: 'let obj = {x: 1}\ndelete obj.x'
  },
  {
    level: 7,
    name: 'Increment/decrement',
    code: 'let x = 5\nx++\n--x'
  }
];

function testParser(code) {
  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar.default || grammar.grammar));
    parser.feed(code);
    
    if (parser.results.length === 0) {
      return { success: false, error: 'No parse found' };
    }
    if (parser.results.length > 1) {
      return { success: true, warning: `Ambiguous: ${parser.results.length} parses` };
    }
    return { success: true };
  } catch (error) {
    // Extract clean error message
    const lines = error.message.split('\n');
    const unexpectedLine = lines.find(l => l.includes('Unexpected'));
    return { 
      success: false, 
      error: unexpectedLine || lines[0] || error.message 
    };
  }
}

console.log('Wang Parser Progressive Complexity Test');
console.log('=======================================\n');

const levelStats = {};
const failures = [];

for (const test of tests) {
  if (!levelStats[test.level]) {
    levelStats[test.level] = { total: 0, passed: 0 };
  }
  
  const result = testParser(test.code);
  levelStats[test.level].total++;
  
  const status = result.success ? '✅' : '❌';
  const extra = result.warning ? ` (${result.warning})` : result.error ? ` - ${result.error.substring(0, 50)}` : '';
  
  console.log(`L${test.level} ${status} ${test.name}${extra}`);
  
  if (result.success) {
    levelStats[test.level].passed++;
  } else if (!test.expectFail) {
    failures.push({
      level: test.level,
      name: test.name,
      code: test.code.substring(0, 50),
      error: result.error
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('SUMMARY BY LEVEL:\n');

for (const [level, stats] of Object.entries(levelStats)) {
  const rate = Math.round((stats.passed / stats.total) * 100);
  console.log(`Level ${level}: ${stats.passed}/${stats.total} passed (${rate}%)`);
}

console.log('\n' + '='.repeat(60));
console.log('PARSER CAPABILITIES:\n');

const totalTests = tests.filter(t => !t.expectFail).length;
const totalPassed = Object.values(levelStats).reduce((sum, stats) => sum + stats.passed, 0);
const successRate = Math.round((totalPassed / totalTests) * 100);

console.log(`✅ Overall: ${totalPassed}/${totalTests} tests passed (${successRate}%)`);
console.log(`❌ Failed: ${failures.length} unexpected failures`);

if (failures.length > 0) {
  console.log('\nUnexpected Failures:');
  failures.forEach(f => {
    console.log(`  L${f.level} - ${f.name}: ${f.error.substring(0, 40)}...`);
  });
}

// Identify patterns
const keyFindings = [];
if (levelStats[1].passed === levelStats[1].total) keyFindings.push('✅ All basic syntax works');
if (levelStats[3].passed === levelStats[3].total) keyFindings.push('✅ Full object/array support');
if (levelStats[4].passed === levelStats[4].total) keyFindings.push('✅ Arrow functions & callbacks work');
if (levelStats[6].passed === levelStats[6].total) keyFindings.push('✅ Advanced features (async, classes, destructuring) supported');

const multilineFailed = tests.find(t => t.name.includes('Multi-line') && !testParser(t.code).success);
if (multilineFailed) keyFindings.push('❌ Multi-line expressions not supported');

console.log('\nKEY FINDINGS:');
keyFindings.forEach(f => console.log('  ' + f));