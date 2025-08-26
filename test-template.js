import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const interpreter = new WangInterpreter({
  moduleResolver: new InMemoryModuleResolver(),
  functions: {}
});

const code = 'const x = 5\n`Value is ${x}`';
console.log('Code:', code);

interpreter.execute(code).then(result => {
  console.log('Result:', result);
  console.log('Type:', typeof result);
}).catch(err => {
  console.error('Error:', err.message);
});
