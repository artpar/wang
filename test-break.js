import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const interpreter = new WangInterpreter({
  moduleResolver: new InMemoryModuleResolver(),
  functions: {}
});

const code = `
let log = []

for (let i = 0; i < 5; i = i + 1) {
    try {
        if (i === 1) continue
        if (i === 3) break
        if (i === 2) throw new Error('error at 2')
        log.push(i)
    } catch (e) {
        log.push('caught at ' + i)
        continue
    }
}

log
`;

interpreter.execute(code).then(result => {
  console.log('Result:', result);
  console.log('Expected: [0, "caught at 2", 3]');
}).catch(err => {
  console.error('Error:', err.message);
});
