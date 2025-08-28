#!/usr/bin/env node

// Test the browser UMD build in Node.js environment
// This simulates how the browser would load the UMD bundle

const fs = require('fs');
const vm = require('vm');
const path = require('path');

// Create a mock browser-like environment
const sandbox = {
  window: {},
  global: {},
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Promise: Promise,
};

// Make window reference itself (like in browsers)
sandbox.window.window = sandbox.window;
sandbox.global.global = sandbox.global;

// Read and execute the UMD bundle
const umdCode = fs.readFileSync(path.join(__dirname, '../dist/browser/wang.min.js'), 'utf8');
const script = new vm.Script(umdCode);
const context = vm.createContext(sandbox);
script.runInContext(context);

// The UMD should have set either window.Wang or global.Wang
const Wang = sandbox.window.Wang || sandbox.global.Wang || sandbox.Wang;

if (!Wang) {
  console.error('❌ Wang is not defined after loading UMD bundle!');
  console.log(
    'Available on window:',
    Object.keys(sandbox.window).filter((k) => k.includes('ang')),
  );
  console.log(
    'Available on global:',
    Object.keys(sandbox.global).filter((k) => k.includes('ang')),
  );
  process.exit(1);
}

console.log('✅ Wang loaded successfully');
console.log('Wang exports:', Object.keys(Wang));

async function testBrowserUMD() {
  const { WangInterpreter, InMemoryModuleResolver } = Wang;

  if (!WangInterpreter || !InMemoryModuleResolver) {
    console.error('❌ Missing required exports:', {
      WangInterpreter: !!WangInterpreter,
      InMemoryModuleResolver: !!InMemoryModuleResolver,
    });
    process.exit(1);
  }

  console.log('\nTesting wang-lang Browser UMD build (dist/browser/wang.min.js)\n');

  const resolver = new InMemoryModuleResolver();
  const interpreter = new WangInterpreter({ moduleResolver: resolver });

  // Test 1: Exact browser extension code
  console.log('Test 1: Browser extension pattern with compound assignment');
  const code1 = `let __inputs = {}
let x = 10
x += 5
__result = x`;

  try {
    console.log('Code:', code1.replace(/\n/g, '\\n'));
    const result = await interpreter.execute(code1);
    console.log('✅ SUCCESS: Result =', result);
    if (result !== 15) {
      console.error('❌ UNEXPECTED RESULT: Expected 15, got', result);
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: All compound operators
  console.log('Test 2: All compound assignment operators');
  const code2 = `let __inputs = {}
let a = 10
a += 5
let b = 20
b -= 3
let c = 4
c *= 2
let d = 16
d /= 4
__result = {
  a: a,
  b: b,
  c: c,
  d: d
}`;

  try {
    console.log('Testing all compound operators...');
    const result = await interpreter.execute(code2);
    console.log('✅ SUCCESS: Result =', JSON.stringify(result));
    const expected = { a: 15, b: 17, c: 8, d: 4 };
    console.log('Expected:', JSON.stringify(expected));

    // Verify each value
    if (
      result.a !== expected.a ||
      result.b !== expected.b ||
      result.c !== expected.c ||
      result.d !== expected.d
    ) {
      console.error('❌ UNEXPECTED RESULT: Values do not match expected');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: String concatenation with +=
  console.log('Test 3: String concatenation with +=');
  const code3 = `let __inputs = {}
let msg = "Hello"
msg += " "
msg += "World"
__result = msg`;

  try {
    const result = await interpreter.execute(code3);
    console.log('✅ SUCCESS: Result =', result);
    if (result !== 'Hello World') {
      console.error('❌ UNEXPECTED: Expected "Hello World", got', result);
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All browser UMD build tests completed!');
}

testBrowserUMD().catch(console.error);
