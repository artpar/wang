#!/usr/bin/env node

import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

async function testSimple() {
  const resolver = new InMemoryModuleResolver();
  const interpreter = new WangInterpreter({ moduleResolver: resolver });
  
  console.log('Testing simpler cases:\n');
  
  // Test 1: Just the assignment without semicolon
  try {
    console.log('1. Testing: let x = 10');
    const result1 = await interpreter.execute('let x = 10');
    console.log('✅ Result:', result1, '\n');
  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
  }
  
  // Test 2: Regular assignment with semicolon
  try {
    console.log('2. Testing: let x = 10; x = x + 5; x');
    const result2 = await interpreter.execute('let x = 10; x = x + 5; x');
    console.log('✅ Result:', result2, '\n');
  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
  }
  
  // Test 3: Just compound assignment without semicolon
  try {
    console.log('3. Testing: let x = 10\nx += 5');
    const result3 = await interpreter.execute('let x = 10\nx += 5');
    console.log('✅ Result:', result3, '\n');
  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
  }
  
  // Test 4: Compound assignment with semicolon
  try {
    console.log('4. Testing: let x = 10; x += 5');
    const result4 = await interpreter.execute('let x = 10; x += 5');
    console.log('✅ Result:', result4, '\n');
  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
  }
}

testSimple().catch(console.error);