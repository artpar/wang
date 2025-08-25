import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing this in arrow functions...');
  const result = await interpreter.execute(`
    class Test {
      constructor() {
        this.value = 42
      }
      
      getArrowFunc() {
        return () => {
          log("Arrow function this:", this);
          if (this) {
            log("Arrow function this.value:", this.value);
            return this.value
          };
          return undefined
        }
      }
      
      getRegularFunc() {
        return function() {
          log("Regular function this.value:", this?.value);
          return this?.value
        }
      }
    };
    
    const t = new Test();
    const arrow = t.getArrowFunc();
    const regular = t.getRegularFunc();
    
    [arrow(), regular()]
  `);
  console.log('Result:', result);
}

test().catch(console.error);