import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing class instantiation...');
  const result = await interpreter.execute(`
    class Test {
      constructor(value) {
        this.value = value;
        log("Constructor called with:", value);
      }
    };
    
    log("Test class:", Test);
    const t = new Test(42);
    log("Instance:", t);
    t.value
  `);
  console.log('Result:', result);
}

test().catch(console.error);