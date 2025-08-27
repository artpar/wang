#!/usr/bin/env node

import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

async function testCompoundAssignment() {
  console.log('🧪 Testing Compound Assignment Operators\n');
  
  const resolver = new InMemoryModuleResolver();
  const interpreter = new WangInterpreter({ moduleResolver: resolver });
  
  const tests = [
    {
      name: 'Addition assignment (+=)',
      code: 'let x = 10\nx += 5\nx',
      expected: 15
    },
    {
      name: 'Subtraction assignment (-=)',
      code: 'let x = 20\nx -= 8\nx', 
      expected: 12
    },
    {
      name: 'Multiplication assignment (*=)',
      code: 'let x = 6\nx *= 4\nx',
      expected: 24
    },
    {
      name: 'Division assignment (/=)',
      code: 'let x = 20\nx /= 4\nx',
      expected: 5
    },
    {
      name: 'Multiple compound assignments',
      code: 'let x = 10\nx += 5\nx *= 2\nx -= 10\nx /= 2\nx',
      expected: 10
    },
    {
      name: 'Compound assignment with expressions',
      code: 'let x = 10\nlet y = 5\nx += (y * 2)\nx',
      expected: 20
    },
    {
      name: 'Compound assignment in object property',
      code: 'let obj = { value: 10 }\nobj.value += 15\nobj.value',
      expected: 25
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`Code: ${test.code}`);
      
      const result = await interpreter.execute(test.code);
      
      if (result === test.expected) {
        console.log(`✅ PASS: Got ${result} (expected ${test.expected})\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: Got ${result}, expected ${test.expected}\n`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log(`Stack: ${error.stack}\n`);
    }
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All compound assignment tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some compound assignment tests failed!');
    process.exit(1);
  }
}

testCompoundAssignment().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});