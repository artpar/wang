import { WangInterpreter } from './dist/esm/index.js';

const interpreter = new WangInterpreter();

async function testContext() {
  try {
    console.log('Starting execution...');
    
    const result = await interpreter.execute(`
      let test = "value"
      console.log("Before error - should have test variable")
      test.nonExistent
    `);
  } catch (error) {
    console.log('Variables in context:', Object.keys(error.context.variables));
    console.log('Has test variable:', error.context.variables.hasOwnProperty('test'));
  }
}

testContext();