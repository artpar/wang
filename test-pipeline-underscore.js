import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing pipeline underscore with methods...');
  try {
    const result = await interpreter.execute(`
      class Test {
        constructor(value) {
          this.value = value
        }
        
        double() {
          this.value = this.value * 2;
          return this
        }
        
        getValue() {
          return this.value
        }
      };
      
      const t = new Test(5);
      log("Initial value:", t.value);
      
      const result = t
        |> _.double()
        |> _.getValue();
        
      log("Result:", result);
      result
    `);
    console.log('Final result:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test().catch(console.error);