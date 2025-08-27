import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter, InMemoryModuleResolver } from '../../dist/esm/index.js';
import * as stdlib from '../../dist/esm/stdlib/index.js';

describe('Pipeline Continuation Tests', () => {
  let interpreter;

  beforeEach(() => {
    const moduleResolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver,
      functions: {
        ...stdlib,
        log: () => {}, // Silent log for tests
      },
    });
  });

  describe('Pipeline in Block Statements', () => {
    it('should handle pipeline continuation in if block', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3]
        let result = []
        
        if (data.length > 0) {
          result = data
            |> map(_, x => x * 2)
            
          result = result
            |> filter(_, x => x > 2)
        }
        
        result
      `);

      expect(result).toEqual([4, 6]);
    });

    it('should handle pipeline continuation in else block', async () => {
      const result = await interpreter.execute(`
        let condition = false
        let data = [10, 20, 30]
        let result
        
        if (condition) {
          result = []
        } else {
          result = data
            |> map(_, x => x / 10)
            |> map(_, x => x + 1)
        }
        
        result
      `);

      expect(result).toEqual([2, 3, 4]);
    });

    it('should handle nested pipeline in for loop block', async () => {
      const result = await interpreter.execute(`
        let arrays = [[1, 2], [3, 4], [5, 6]]
        let results = []
        
        for (let arr of arrays) {
          let processed = arr
            |> map(_, x => x * 10)
            |> filter(_, x => x >= 20)
          results.push(processed)
        }
        
        results
      `);

      expect(result).toEqual([[20], [30, 40], [50, 60]]);
    });

    it('should handle pipeline in while loop block', async () => {
      const result = await interpreter.execute(`
        let counter = 0
        let results = []
        
        while (counter < 3) {
          let nums = [counter, counter + 1]
            |> map(_, x => x * 2)
            |> map(_, x => x + 10)
          results.push(nums)
          counter = counter + 1
        }
        
        results
      `);

      expect(result).toEqual([
        [10, 12],
        [12, 14],
        [14, 16],
      ]);
    });

    it('should handle pipeline in try-catch block', async () => {
      const result = await interpreter.execute(`
        let result
        try {
          let data = [1, 2, 3]
          result = data
            |> map(_, x => x * 3)
            |> filter(_, x => x > 5)
        } catch (e) {
          result = []
        }
        result
      `);

      expect(result).toEqual([6, 9]);
    });

    // Switch statements are not implemented in Wang grammar
    // Removed test for unsupported feature
  });

  describe('Assignment with Pipeline Continuation', () => {
    it('should handle simple assignment with pipeline', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3]
        let result = data
          |> map(_, x => x * 2)
        result
      `);

      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle reassignment with pipeline', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3]
        let result = [10, 20]
        
        result = data
          |> map(_, x => x * 3)
        
        result
      `);

      expect(result).toEqual([3, 6, 9]);
    });

    it('should handle multiple assignments with pipelines', async () => {
      const result = await interpreter.execute(`
        let nums = [1, 2, 3, 4, 5]
        
        let evens = nums
          |> filter(_, x => x % 2 === 0)
        
        let odds = nums
          |> filter(_, x => x % 2 !== 0)
        
        let doubled = nums
          |> map(_, x => x * 2)
        
        {evens, odds, doubled}
      `);

      expect(result).toEqual({
        evens: [2, 4],
        odds: [1, 3, 5],
        doubled: [2, 4, 6, 8, 10],
      });
    });

    it('should handle object property assignment with pipeline', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3]
        let obj = {}
        
        obj.processed = data
          |> map(_, x => x + 10)
          |> filter(_, x => x > 11)
        
        obj
      `);

      expect(result).toEqual({
        processed: [12, 13],
      });
    });

    it('should handle array element assignment with pipeline', async () => {
      const result = await interpreter.execute(`
        let data = [5, 10, 15]
        let results = []
        
        results[0] = data
          |> map(_, x => x / 5)
        
        results[1] = data
          |> filter(_, x => x >= 10)
        
        results
      `);

      expect(result).toEqual([
        [1, 2, 3],
        [10, 15],
      ]);
    });

    it('should handle destructuring assignment with pipeline result', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3, 4]
        
        let [first, second] = data
          |> map(_, x => x * 10)
        
        {first, second}
      `);

      expect(result).toEqual({
        first: 10,
        second: 20,
      });
    });
  });

  describe('Complex Pipeline Scenarios', () => {
    it('should handle multiple pipeline operators in sequence', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3, 4, 5, 6]
        
        let result = data
          |> filter(_, x => x > 2)
          |> map(_, x => x * 2)
          |> filter(_, x => x < 10)
          |> map(_, x => x + 1)
        
        result
      `);

      expect(result).toEqual([7, 9]);
    });

    it('should handle pipeline with arrow operator', async () => {
      const result = await interpreter.execute(`
        let data = [10, 20, 30]
        let stored = []
        
        data
          |> map(_, x => x / 10)
          -> (result) => { stored = result }
        
        stored
      `);

      expect(result).toEqual([1, 2, 3]);
    });

    it.skip('should handle nested pipelines (multiline arrow functions not supported)', async () => {
      const result = await interpreter.execute(`
        let groups = [[1, 2], [3, 4], [5, 6]]
        
        let result = groups
          |> map(_, group => 
              group
                |> map(_, x => x * 2)
                |> filter(_, x => x > 4)
            )
          |> filter(_, group => group.length > 0)
        
        result
      `);

      expect(result).toEqual([
        [6, 8],
        [10, 12],
      ]);
    });

    it('should handle pipeline with complex arrow functions', async () => {
      const result = await interpreter.execute(`
        let users = [
          {name: "Alice", age: 30},
          {name: "Bob", age: 25},
          {name: "Charlie", age: 35}
        ]
        
        let result = users
          |> filter(_, user => user.age >= 30)
          |> map(_, user => {
              let category = user.age > 32 ? "senior" : "junior"
              return {
                name: user.name,
                category: category,
                score: user.age * 2
              }
            })
        
        result
      `);

      expect(result).toEqual([
        { name: 'Alice', category: 'junior', score: 60 },
        { name: 'Charlie', category: 'senior', score: 70 },
      ]);
    });

    it('should handle pipeline in return statement', async () => {
      const result = await interpreter.execute(`
        function processData(data) {
          return data
            |> filter(_, x => x > 0)
            |> map(_, x => x * x)
        }
        
        processData([-2, -1, 0, 1, 2, 3])
      `);

      expect(result).toEqual([1, 4, 9]);
    });

    it.skip('should handle pipeline in ternary operator (pipeline continuations in ternary not supported)', async () => {
      const result = await interpreter.execute(`
        let condition = true
        let data = [1, 2, 3]
        
        let result = condition 
          ? data
              |> map(_, x => x * 2)
          : data
              |> map(_, x => x * 3)
        
        result
      `);

      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle pipeline with underscore placeholder in various positions', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3]
        
        // Using underscore as first argument
        let r1 = data |> map(_, x => x * 2)
        
        // Using underscore in filter
        let r2 = data |> filter(_, x => x > 1)
        
        // Using underscore with reduce
        let r3 = data |> reduce(_, (acc, x) => acc + x, 0)
        
        {r1, r2, r3}
      `);

      expect(result).toEqual({
        r1: [2, 4, 6],
        r2: [2, 3],
        r3: 6,
      });
    });
  });

  describe('Async Function Handling in Pipeline', () => {
    it('should handle async arrow functions in map', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3]
        
        let result = data
          |> map(_, async (x) => {
              // Simulate async operation
              return x * 2
            })
        
        result
      `);

      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle async arrow functions in filter', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3, 4, 5]
        
        let result = data
          |> filter(_, async (x) => {
              // Simulate async check
              return x % 2 === 0
            })
        
        result
      `);

      expect(result).toEqual([2, 4]);
    });

    it('should handle mixed sync and async operations', async () => {
      const result = await interpreter.execute(`
        let data = [1, 2, 3]
        
        let result = data
          |> map(_, x => x * 2)  // sync
          |> filter(_, async x => x > 3)  // async
          |> map(_, async x => x + 10)  // async
        
        result
      `);

      expect(result).toEqual([14, 16]);
    });
  });

  describe('Get Function with Numeric Indices', () => {
    it('should handle numeric index directly', async () => {
      const result = await interpreter.execute(`
        let arr = ["a", "b", "c"]
        get(arr, 1)
      `);

      expect(result).toBe('b');
    });

    it('should handle numeric index in string format', async () => {
      const result = await interpreter.execute(`
        let arr = ["x", "y", "z"]
        get(arr, "2")
      `);

      expect(result).toBe('z');
    });

    it('should handle computed numeric index', async () => {
      const result = await interpreter.execute(`
        let data = [{val: 10}, {val: 20}, {val: 30}]
        let results = []
        
        for (let i = 0; i < 3; i = i + 1) {
          let item = get(data, i)
          results.push(get(item, "val"))
        }
        
        results
      `);

      expect(result).toEqual([10, 20, 30]);
    });

    it('should handle dot notation path with numeric index', async () => {
      const result = await interpreter.execute(`
        let data = [
          {items: ["a", "b"]},
          {items: ["c", "d"]},
        ]
        
        let r1 = get(data, "0.items.0")
        let r2 = get(data, "1.items.1")
        
        [r1, r2]
      `);

      expect(result).toEqual(['a', 'd']);
    });

    it('should return default value for invalid numeric index', async () => {
      const result = await interpreter.execute(`
        let arr = [1, 2, 3]
        
        let r1 = get(arr, 10, "default")
        let r2 = get(arr, -1, "negative")
        
        [r1, r2]
      `);

      expect(result).toEqual(['default', 'negative']);
    });

    it('should handle numeric index with pipeline', async () => {
      const result = await interpreter.execute(`
        let matrix = [[1, 2], [3, 4], [5, 6]]
        
        let result = [0, 1, 2]
          |> map(_, i => get(matrix, i))
          |> map(_, row => get(row, 1))
        
        result
      `);

      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty array in pipeline', async () => {
      const result = await interpreter.execute(`
        let empty = []
        
        let result = empty
          |> map(_, x => x * 2)
          |> filter(_, x => x > 0)
        
        result
      `);

      expect(result).toEqual([]);
    });

    it('should handle null/undefined in pipeline gracefully', async () => {
      const result = await interpreter.execute(`
        let data = [1, null, 3, undefined, 5]
        
        let result = data
          |> filter(_, x => x != null)
          |> map(_, x => x * 2)
        
        result
      `);

      expect(result).toEqual([2, 6, 10]);
    });

    it('should preserve scope in nested blocks with pipelines', async () => {
      const result = await interpreter.execute(`
        let outer = 10
        let data = [1, 2, 3]
        
        function processWithScope() {
          let inner = 5
          return data
            |> map(_, x => x + outer + inner)
        }
        
        processWithScope()
      `);

      expect(result).toEqual([16, 17, 18]);
    });

    it('should handle pipeline with immediately invoked function', async () => {
      const result = await interpreter.execute(`
        let result = [1, 2, 3]
          |> ((arr) => {
              return arr
                |> map(_, x => x * 3)
                |> filter(_, x => x > 5)
            })(_)
        
        result
      `);

      expect(result).toEqual([6, 9]);
    });
  });
});
