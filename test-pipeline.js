import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const interpreter = new WangInterpreter({
  moduleResolver: new InMemoryModuleResolver(),
  functions: {
    filter: (arr, pred) => arr.filter(pred),
    map: (arr, fn) => arr.map(fn),
    reduce: (arr, fn, initial) => arr.reduce(fn, initial)
  }
});

const code = `const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const result = data
  |> filter(_, n => n % 2 === 0)
  |> map(_, n => n * n)
  |> reduce(_, (sum, n) => sum + n, 0)
  
result`;

interpreter.execute(code).then(result => {
  console.log('Result:', result);
}).catch(err => {
  console.error('Error:', err.message);
  console.error('Line/col:', err);
});
