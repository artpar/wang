import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
resolver.addModule('math', `
export function square(x) {
  return x * x
}
export const PI = 3.14159
`);

const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {}
});

const code = `
import { square, PI } from "math"
square(5) + PI
`;

interpreter.execute(code).then(result => {
  console.log('Result:', result);
}).catch(err => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
});
