import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing new with await...');
  try {
    const result = await interpreter.execute(`
      class Test {
        constructor(value) {
          this.value = value
        }
      };
      
      log("About to create instance");
      const t = new Test(42);
      log("Created instance:", t);
      log("Instance type:", typeof t);
      // log("Instance constructor:", t.constructor);
      t
    `);
    console.log('Result:', result);
    console.log('Result type:', typeof result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test().catch(console.error);