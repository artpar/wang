import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing arrow function returned from method...');
  const result = await interpreter.execute(`
    class Test {
      constructor() {
        this.value = 42
      }
      
      getArrowFunc() {
        log("In getArrowFunc, this:", this);
        log("In getArrowFunc, this.value:", this.value);
        const arrowFunc = () => {
          log("In arrow function, this:", this);
          return this
        };
        log("Created arrow function");
        return arrowFunc
      }
    };
    
    const t = new Test();
    const arrow = t.getArrowFunc();
    log("Got arrow function, calling it");
    const result = arrow();
    log("Arrow returned:", result);
    result?.value
  `);
  console.log('Final result:', result);
}

test().catch(console.error);