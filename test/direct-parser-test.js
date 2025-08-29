#!/usr/bin/env node

import nearley from 'nearley';
import * as grammar from '../dist/esm/generated/wang-grammar.js';

const testCases = [
  {
    name: 'Arrow with property in body - inline',
    code: 'let fn = x => x.title'
  },
  {
    name: 'Arrow with property in body - block',
    code: `let fn = x => {
  return x.title
}`
  },
  {
    name: 'Object literal with property access',
    code: `let arr = [1, 2, 3]
let obj = {
  count: arr.length
}`
  },
  {
    name: 'Console.log with property',
    code: 'console.log(obj.prop)'
  },
  {
    name: 'String concat with property',
    code: 'let str = "Value: " + obj.prop'
  },
  {
    name: 'Map with arrow and property',
    code: 'map(items, x => x.name)'
  },
  {
    name: 'Map with arrow block and property',
    code: `map(items, (item, i) => {
  return item.name
})`
  },
  {
    name: 'Multi-line logical expression',
    code: `let result = (a > b) &&
             (b > c) &&
             (c > d)`
  },
  {
    name: 'Method call',
    code: 'arr.join(", ")'
  },
  {
    name: 'Chained property',
    code: 'obj.a.b.c'
  }
];

console.log('Direct Parser Testing\n');
console.log('='.repeat(60));

for (const test of testCases) {
  console.log(`\nTest: ${test.name}`);
  console.log('Code:', JSON.stringify(test.code));
  
  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar.default || grammar.grammar));
    parser.feed(test.code);
    
    if (parser.results.length === 0) {
      console.log('❌ No parse found');
    } else if (parser.results.length > 1) {
      console.log(`⚠️  Ambiguous: ${parser.results.length} parses`);
    } else {
      console.log('✅ Parsed successfully');
      // Show AST structure for successful parses
      const ast = parser.results[0];
      if (ast && ast.body && ast.body[0]) {
        const firstStatement = ast.body[0];
        console.log('   Type:', firstStatement.type);
        if (firstStatement.expression) {
          console.log('   Expression type:', firstStatement.expression.type);
        }
      }
    }
  } catch (error) {
    console.log('❌ Parse error:', error.message);
    // Extract the specific token that caused the error
    if (error.message.includes('Unexpected')) {
      const match = error.message.match(/Unexpected (\S+) token/);
      if (match) {
        console.log('   Problem token:', match[1]);
      }
    }
  }
}