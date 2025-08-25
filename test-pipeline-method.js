import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
    filter: (arr, pred) => arr.filter(pred),
    map: (arr, fn) => arr.map(fn),
  }
});

async function test() {
  console.log('Testing pipeline with method calls...');
  try {
    const result = await interpreter.execute(`
      class DataProcessor {
        constructor(data) {
          this.data = data
        }
        
        filter(predicate) {
          this.data = filter(this.data, predicate);
          return this
        }
        
        map(mapper) {
          this.data = map(this.data, mapper);
          return this
        }
        
        getData() {
          return this.data
        }
      };
      
      log("Creating processor...");
      const processor = new DataProcessor([1, 2, 3, 4, 5]);
      log("Processor created:", processor);
      log("Processor type:", typeof processor);
      
      const result = processor
        |> _.filter(n => n > 2)
        |> _.map(n => n * 2)
        |> _.getData();
      
      log("Pipeline result:", result);
      result
    `);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test().catch(console.error);