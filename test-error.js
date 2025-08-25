import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
  }
});

async function test() {
  console.log('Testing error handling...');
  try {
    const result = await interpreter.execute(`
      async function riskyOperation() {
        throw new Error("Async error")
      };
      
      async function handleError() {
        try {
          await riskyOperation()
        } catch (e) {
          log("Caught error:", e);
          log("Error message:", e.message);
          return "Handled: " + e.message
        }
      };
      
      await handleError()
    `);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test().catch(console.error);