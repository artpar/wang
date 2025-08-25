import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing circular dependencies with debugging...');
  
  // Simpler test first - just export without import
  resolver.addModule('moduleC', `
    export function funcC() {
      return "C"
    }
  `);

  resolver.addModule('moduleD', `
    import { funcC } from "moduleC";
    
    export function funcD() {
      return "D calls " + funcC()
    }
  `);

  try {
    const result1 = await interpreter.execute(`
      import { funcD } from "moduleD";
      funcD()
    `);
    console.log('Simple test Result:', result1);
    console.log('Simple test Expected: "D calls C"');
  } catch (error) {
    console.error('Simple test Error:', error.message);
  }

  // Now test actual circular dependency  
  console.log('\nTesting actual circular dependency...');
  
  resolver.addModule('moduleA', `
    import { functionB } from "moduleB";
    
    export function functionA() {
      return "A calls " + functionB()
    };
    
    export function helperA() {
      return "Helper A"
    }
  `);

  resolver.addModule('moduleB', `
    import { helperA } from "moduleA";
    
    export function functionB() {
      return "B uses " + helperA()
    }
  `);

  try {
    const result2 = await interpreter.execute(`
      import { functionA } from "moduleA";
      functionA()
    `);
    console.log('Circular test Result:', result2);
    console.log('Circular test Expected: "A calls B uses Helper A"');
  } catch (error) {
    console.error('Circular test Error:', error.message);
  }
}

test().catch(console.error);