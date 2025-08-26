import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Interpreter', () => {
  describe('Variable Operations', () => {
    it('should handle variable declaration', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let x = 5
        x
      `);
      expect(result).toBe(5);
    });

    it('should handle variable assignment', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let x = 5
        x = 10
        x
      `);
      expect(result).toBe(10);
    });

    it('should handle const declaration', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const PI = 3.14159
        PI
      `);
      expect(result).toBe(3.14159);
    });
  });

  describe('Arithmetic Operations', () => {
    it('should evaluate arithmetic expressions', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let a = 10
        let b = 20
        a + b * 2
      `);
      expect(result).toBe(50);
    });

    it('should handle string concatenation', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let greeting = "Hello"
        let name = "World"
        greeting + ", " + name + "!"
      `);
      expect(result).toBe('Hello, World!');
    });

    it('should handle update expressions', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let x = 5
        x = x + 1
        let y = x
        x = x + 1
        let z = x
        [x, y, z]
      `);
      expect(result).toEqual([7, 6, 7]);
    });
  });

  describe('Functions', () => {
    it('should execute function declarations', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        function add(a, b) {
          return a + b
        }
        add(15, 25)
      `);
      expect(result).toBe(40);
    });

    it('should execute arrow functions', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const multiply = (x, y) => x * y
        multiply(6, 7)
      `);
      expect(result).toBe(42);
    });

    it('should handle closures correctly', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        function makeAdder(x) {
          return function(y) {
            return x + y
          }
        }
        const add5 = makeAdder(5)
        add5(3)
      `);
      expect(result).toBe(8);
    });

    it('should handle recursive functions', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        function fibonacci(n) {
          if (n <= 1) {
            return n
          }
          return fibonacci(n - 1) + fibonacci(n - 2)
        }
        fibonacci(10)
      `);
      expect(result).toBe(55);
    });
  });

  describe('Arrays and Objects', () => {
    it('should handle array operations', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const numbers = [10, 20, 30, 40, 50]
        numbers[2]
      `);
      expect(result).toBe(30);
    });

    it('should handle empty arrays', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const empty = []
        empty.length
      `);
      expect(result).toBe(0);
    });

    it('should handle array methods', async () => {
      const ctx = new TestContext();
      ctx.addFunction('sum', (arr) => arr.reduce((a, b) => a + b, 0));

      const result = await ctx.execute(`
        const numbers = [1, 2, 3, 4, 5]
        const doubled = map(numbers, x => x * 2)
        sum(doubled)
      `);
      expect(result).toBe(30);
    });

    it('should handle object operations', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const person = {
          name: "Alice",
          age: 30
        }
        person.name + " is " + person.age
      `);
      expect(result).toBe('Alice is 30');
    });

    it('should handle object destructuring', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const person = { name: "Bob", age: 25 }
        const { name, age } = person
        name + " - " + age
      `);
      expect(result).toBe('Bob - 25');
    });

    it('should handle array destructuring', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const items = [1, 2, 3, 4, 5]
        const [first, second] = items
        first + second
      `);
      expect(result).toBe(3);
    });
  });

  describe('Control Flow', () => {
    it('should handle if statements', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let x = 15
        let result
        
        if (x > 10) {
          result = "big"
        } else {
          result = "small"
        }
        
        result
      `);
      expect(result).toBe('big');
    });

    it('should handle for loops', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let sum = 0
        for (let i = 1; i <= 5; i = i + 1) {
          sum = sum + i
        }
        sum
      `);
      expect(result).toBe(15);
    });

    it('should handle for-of loops', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        const numbers = [10, 20, 30]
        let total = 0
        for (let num of numbers) {
          total = total + num
        }
        total
      `);
      expect(result).toBe(60);
    });

    it('should handle while loops', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let count = 0
        let sum = 0
        while (count < 5) {
          sum = sum + count
          count = count + 1
        }
        sum
      `);
      expect(result).toBe(10);
    });
  });

  describe('Classes', () => {
    it('should handle class instantiation and methods', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        class Rectangle {
          constructor(width, height) {
            this.width = width
            this.height = height
          }
          
          area() {
            return this.width * this.height
          }
          
          perimeter() {
            return 2 * (this.width + this.height)
          }
        }
        
        const rect = new Rectangle(5, 3)
        rect.area() + rect.perimeter()
      `);
      expect(result).toBe(31);
    });
  });

  describe('Error Handling', () => {
    it('should handle try-catch blocks', async () => {
      const ctx = new TestContext();
      const result = await ctx.execute(`
        let result
        try {
          throw "error"
          result = "not reached"
        } catch (e) {
          result = "caught: " + e
        }
        result
      `);
      expect(result).toBe('caught: error');
    });

    it('should throw error for undefined variables', async () => {
      const ctx = new TestContext();
      await expect(ctx.execute('undefinedVar')).rejects.toThrow(
        'Variable "undefinedVar" is not defined',
      );
    });
  });

  describe('Pipeline Operators', () => {
    it('should handle pipeline expressions', async () => {
      const ctx = new TestContext();
      ctx.addFunction('double', (x) => x * 2);
      ctx.addFunction('addOne', (x) => x + 1);

      const result = await ctx.execute(`
        5 |> double(_) |> addOne(_)
      `);
      expect(result).toBe(11);
    });
  });

  describe('Modules', () => {
    it('should handle import/export', async () => {
      const ctx = new TestContext();
      ctx.addModule(
        'math',
        `
        export function square(x) {
          return x * x
        };
        export const PI = 3.14159
      `,
      );

      const result = await ctx.execute(`
        import { square, PI } from "math"
        square(5) + PI
      `);
      expect(result).toBeCloseTo(28.14159, 5);
    });
  });
});
