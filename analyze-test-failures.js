import { TestContext } from './tests/test-utils.js';

console.log('Analyzing which syntax features are actually failing...\n');

const testCases = [
  {
    name: 'Function declaration with semicolon',
    code: `function add(a, b) { return a + b };`,
    expectation: 'Should parse as FunctionDeclaration'
  },
  {
    name: 'Class with newlines between methods',
    code: `class Foo {
      method1() { return 1 }
      method2() { return 2 }
    }`,
    expectation: 'Should parse methods without semicolons'
  },
  {
    name: 'Multiple statements with mixed separators',
    code: `let x = 1;
    let y = 2
    let z = 3`,
    expectation: 'Should handle mixed semicolons and newlines'
  },
  {
    name: 'Object literal in statement position',
    code: `const obj = { a: 1, b: { c: 2 } }`,
    expectation: 'Should parse nested object literals'
  },
  {
    name: 'Switch statement',
    code: `switch(x) { case 1: break; default: break; }`,
    expectation: 'Should parse switch statements'
  },
  {
    name: 'Destructuring with renaming',
    code: `const { a: renamed } = obj`,
    expectation: 'Should parse destructuring with renaming'
  },
  {
    name: 'Template literal with expression',
    code: 'const msg = `Hello ${name}`',
    expectation: 'Should parse template literals'
  },
  {
    name: 'Increment operator',
    code: `x++`,
    expectation: 'Should parse postfix increment'
  },
  {
    name: 'Optional chaining',
    code: `obj?.prop`,
    expectation: 'Should parse optional chaining'
  },
  {
    name: 'Nullish coalescing',
    code: `value ?? defaultValue`,
    expectation: 'Should parse nullish coalescing'
  },
  {
    name: 'For-of loop',
    code: `for (const item of items) { }`,
    expectation: 'Should parse for-of loops'
  },
  {
    name: 'Arrow function without parens',
    code: `const fn = x => x * 2`,
    expectation: 'Should parse single-param arrow functions'
  }
];

const ctx = new TestContext();
const results = {};

for (const test of testCases) {
  try {
    const parseResults = ctx.parse(test.code);
    if (parseResults.length === 0) {
      results[test.name] = { status: 'FAIL', error: 'No parse found' };
    } else if (parseResults.length === 1) {
      results[test.name] = { status: 'PASS', ambiguity: false };
    } else {
      // Check if all results are identical
      const first = JSON.stringify(parseResults[0]);
      const allSame = parseResults.every(r => JSON.stringify(r) === first);
      results[test.name] = { 
        status: allSame ? 'AMBIGUOUS-OK' : 'AMBIGUOUS-BAD',
        count: parseResults.length,
        ambiguity: true
      };
    }
  } catch (e) {
    const errorMsg = e.message.substring(0, 100);
    results[test.name] = { 
      status: 'ERROR',
      error: errorMsg
    };
  }
}

// Summary
console.log('=== Test Results Summary ===\n');
const grouped = {
  PASS: [],
  'AMBIGUOUS-OK': [],
  'AMBIGUOUS-BAD': [],
  ERROR: [],
  FAIL: []
};

for (const [name, result] of Object.entries(results)) {
  grouped[result.status].push(name);
}

for (const [status, tests] of Object.entries(grouped)) {
  if (tests.length > 0) {
    console.log(`${status}: ${tests.length}`);
    for (const test of tests) {
      const detail = results[test];
      if (detail.count) {
        console.log(`  - ${test} (${detail.count} parses)`);
      } else if (detail.error) {
        console.log(`  - ${test}: ${detail.error}`);
      } else {
        console.log(`  - ${test}`);
      }
    }
    console.log();
  }
}

// Identify problematic features
console.log('=== Problematic Features ===\n');
const problems = [];
if (grouped.ERROR.length > 0) {
  for (const test of grouped.ERROR) {
    console.log(`❌ ${test}`);
    if (test.includes('Switch')) problems.push('Switch statements');
    if (test.includes('Optional chaining')) problems.push('Optional chaining');
    if (test.includes('Nullish')) problems.push('Nullish coalescing');
    if (test.includes('Template')) problems.push('Template literals with expressions');
    if (test.includes('Destructuring')) problems.push('Complex destructuring');
  }
}

if (grouped['AMBIGUOUS-OK'].length > 0) {
  console.log('\n⚠️  Harmless ambiguity in:');
  for (const test of grouped['AMBIGUOUS-OK']) {
    console.log(`  - ${test}`);
  }
}

console.log('\n=== Recommendations ===');
console.log('Based on actual failures, consider:');
const unique = [...new Set(problems)];
for (const problem of unique) {
  console.log(`  - Fix or remove: ${problem}`);
}