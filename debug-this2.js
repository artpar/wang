import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing this in simpler scenario...');
  const result = await interpreter.execute(`
    class Test {
      constructor() {
        this.value = 42
      }
      
      getValue() {
        log("Method this:", this);
        log("Method this.value:", this.value);
        return this.value
      }
    };
    
    const t = new Test();
    t.getValue()
  `);
  console.log('Result:', result);
}

test().catch(console.error);