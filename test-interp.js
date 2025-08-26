import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const interpreter = new WangInterpreter({
  moduleResolver: new InMemoryModuleResolver(),
  functions: { log: console.log }
});

const code = `
const x = 5
const template = \`Value is \${x}\`
log('Template result:', template)
template
`;

interpreter.execute(code).then(result => {
  console.log('Final result:', JSON.stringify(result));
}).catch(err => {
  console.error('Error:', err.message);
});
