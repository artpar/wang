import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
    push: (arr, item) => { 
      console.log('Pushing:', item, 'to array with', arr.length, 'items');
      arr.push(item); 
      return arr; 
    },
    indexOf: (arr, item) => {
      console.log('IndexOf called with arr:', arr, 'item:', item);
      if (!Array.isArray(arr)) return -1;
      const result = arr.indexOf(item);
      console.log('IndexOf result:', result);
      return result;
    },
    slice: (arr, start, end) => {
      console.log('Slice called with arr:', arr, 'start:', start, 'end:', end);
      const result = arr.slice(start, end);
      console.log('Slice result:', result);
      return result;
    },
    forEach: (arr, fn) => {
      console.log('ForEach called with arr:', arr);
      if (!Array.isArray(arr)) return;
      arr.forEach(fn);
    },
  }
});

async function test() {
  console.log('Testing reactive observable pattern...');
  const result = await interpreter.execute(`
    class Observable {
      constructor() {
        this.observers = []
      }
      
      subscribe(observer) {
        push(this.observers, observer);
        return {
          unsubscribe: () => {
            log("Unsubscribe called");
            const index = indexOf(this.observers, observer);
            log("Index found:", index);
            if (index > -1) {
              this.observers = [...slice(this.observers, 0, index), ...slice(this.observers, index + 1)];
              log("Observers after unsubscribe:", this.observers.length)
            }
          }
        }
      }
      
      notify(data) {
        log("Notify called with data:", data);
        log("Number of observers:", this.observers.length);
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
  console.log('Final result:', result);
  console.log('Expected: ["Observer1: First", "Observer2: First", "Observer2: Second"]');
}

test().catch(console.error);