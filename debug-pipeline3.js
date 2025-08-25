import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
    filter: (arr, pred) => {
      console.log('filter called with arr:', arr, 'pred:', pred.toString());
      const result = arr.filter(pred);
      console.log('filter result:', result);
      return result;
    },
    map: (arr, fn) => {
      console.log('map called with arr:', arr, 'fn:', fn.toString());
      const result = arr.map(fn);
      console.log('map result:', result);
      return result;
    },
    reduce: (arr, fn, initial) => {
      console.log('reduce called with arr:', arr, 'fn:', fn.toString(), 'initial:', initial);
      const result = arr.reduce(fn, initial);
      console.log('reduce result:', result);
      return result;
    },
  }
});

async function test() {
  console.log('Testing complex pipeline chains...');
  const result = await interpreter.execute(`
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const result = data
      |> filter(_, n => n % 2 === 0)
      |> map(_, n => n * n)
      |> reduce(_, (sum, n) => sum + n, 0);
      
    result
  `);
  console.log('Final result:', result);
  console.log('Expected: 220 (4 + 16 + 36 + 64 + 100)');
}

test().catch(console.error);