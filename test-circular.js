import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing circular dependencies...');
  
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
    const result = await interpreter.execute(`
      import { functionA } from "moduleA";
      functionA()
    `);
    console.log('Result:', result);
    console.log('Expected: "A calls B uses Helper A"');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test().catch(console.error);