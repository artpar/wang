import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
    push: (arr, item) => { arr.push(item); return arr; },
    indexOf: (arr, item) => {
      if (!Array.isArray(arr)) return -1;
      return arr.indexOf(item);
    },
    slice: (arr, start, end) => arr.slice(start, end),
    forEach: (arr, fn) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(fn);
    },
  }
});

async function test() {
  console.log('Testing reactive observable pattern with workaround...');
  try {
    const result = await interpreter.execute(`
      class Observable {
        constructor() {
          this.observers = []
        }
        
        subscribe(observer) {
          push(this.observers, observer);
          const self = this;  // Capture this in a variable
          return {
            unsubscribe: function() {
              const index = indexOf(self.observers, observer);
              if (index > -1) {
                self.observers = [...slice(self.observers, 0, index), ...slice(self.observers, index + 1)]
              }
            }
          }
        }
        
        notify(data) {
          forEach(this.observers, obs => obs(data))
        }
      };
      
      const observable = new Observable();
      const results = [];
      
      const sub1 = observable.subscribe(data => push(results, "Observer1: " + data));
      const sub2 = observable.subscribe(data => push(results, "Observer2: " + data));
      
      observable.notify("First");
      sub1.unsubscribe();
      observable.notify("Second");
      
      results
    `);
    console.log('Result:', result);
    console.log('Expected: ["Observer1: First", "Observer2: First", "Observer2: Second"]');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test().catch(console.error);