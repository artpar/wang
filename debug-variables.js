import { WangInterpreter } from './dist/esm/index.js';

const interpreter = new WangInterpreter();

async function testVariableScope() {
  try {
    await interpreter.execute(`
let firstName = "John"
let age = 30  
let user = null
user.profile.name
    `);
  } catch (error) {
    console.log('Error context variables:', Object.keys(error.context.variables));
    console.log('Full error context:', error.context);
    console.log('Error message:', error.message);
  }
}

testVariableScope();