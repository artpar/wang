#!/usr/bin/env node

// Test the ESM build directly
import { WangInterpreter, InMemoryModuleResolver } from '../dist/esm/index.js';

async function testESMBuild() {
  console.log('Testing wang-lang ESM build (dist/esm/index.js)\n');
  
  const resolver = new InMemoryModuleResolver();
  const interpreter = new WangInterpreter({ moduleResolver: resolver });

  // Test 1: Exact browser extension code
  console.log('Test 1: Browser extension pattern');
  const code1 = `let __inputs = {}
let x = 10
x += 5
__result = x`;
  
  try {
    console.log('Code:', code1.replace(/\n/g, '\\n'));
    const result = await interpreter.execute(code1);
    console.log('✅ SUCCESS: Result =', result);
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Multiple compound assignments
  console.log('Test 2: Multiple compound assignments');
  const code2 = `let __inputs = {}
let x = 10
x += 5
let y = 20
y -= 3
let z = 4
z *= 2
let w = 16
w /= 4
__result = {
  x: x,
  y: y,
  z: z,
  w: w
}`;

  try {
    console.log('Testing multiple compound assignments...');
    const result = await interpreter.execute(code2);
    console.log('✅ SUCCESS: Result =', JSON.stringify(result));
    console.log('Expected: {"x":15,"y":17,"z":8,"w":4}');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Browser extension real-world pattern
  console.log('Test 3: Complex browser extension pattern');
  const code3 = `let __inputs = { profiles: [
    { name: "John", score: 100 },
    { name: "Jane", score: 200 }
  ]}
  
  let total = 0
  for (let profile of __inputs.profiles) {
    total += profile.score
  }
  
  let average = total
  average /= __inputs.profiles.length
  
  __result = {
    total: total,
    average: average
  }`;
  
  try {
    console.log('Testing real-world pattern...');
    const result = await interpreter.execute(code3);
    console.log('✅ SUCCESS: Result =', JSON.stringify(result));
    console.log('Expected: {"total":300,"average":150}');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

testESMBuild().catch(console.error);