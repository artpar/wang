import { describe, it, expect } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Ternary Operator Tests', () => {
  const ctx = new TestContext();

  describe('Basic Ternary Operations', () => {
    it('should evaluate simple ternary expressions', async () => {
      const result = await ctx.execute('true ? 1 : 2');
      expect(result).toBe(1);
    });

    it('should evaluate false condition', async () => {
      const result = await ctx.execute('false ? 1 : 2');
      expect(result).toBe(2);
    });

    it('should work with variables', async () => {
      const result = await ctx.execute(`
        let x = 5
        let result = x > 3 ? "big" : "small"
        result
      `);
      expect(result).toBe("big");
    });

    it('should work with complex conditions', async () => {
      const result = await ctx.execute(`
        let a = 10
        let b = 20
        a > b ? a : b
      `);
      expect(result).toBe(20);
    });
  });

  describe('Nested Ternary Operations', () => {
    it('should handle nested ternary expressions', async () => {
      const result = await ctx.execute(`
        let x = 10
        x > 15 ? "large" : x > 5 ? "medium" : "small"
      `);
      expect(result).toBe("medium");
    });

    it('should handle ternary in function arguments', async () => {
      const result = await ctx.execute(`
        function max(a, b) { return a > b ? a : b }
        max(5, 10)
      `);
      expect(result).toBe(10);
    });

    it('should work with function calls in branches', async () => {
      const result = await ctx.execute(`
        function getA() { return "A" }
        function getB() { return "B" }
        true ? getA() : getB()
      `);
      expect(result).toBe("A");
    });
  });

  describe('Ternary with Different Types', () => {
    it('should work with objects', async () => {
      const result = await ctx.execute(`
        let condition = true
        condition ? { value: 1 } : { value: 2 }
      `);
      expect(result).toEqual({ value: 1 });
    });

    it('should work with arrays', async () => {
      const result = await ctx.execute(`
        let useFirst = false
        useFirst ? [1, 2, 3] : [4, 5, 6]
      `);
      expect(result).toEqual([4, 5, 6]);
    });

    it('should work with null and undefined', async () => {
      const result1 = await ctx.execute('true ? null : "value"');
      expect(result1).toBe(null);
      
      const result2 = await ctx.execute('false ? "value" : undefined');
      expect(result2).toBe(undefined);
    });
  });

  describe('Ternary in Expressions', () => {
    it('should work in arithmetic expressions', async () => {
      const result = await ctx.execute(`
        let x = 5
        let y = 10
        (x > 3 ? x : 0) + y
      `);
      expect(result).toBe(15);
    });

    it('should work in assignments', async () => {
      const result = await ctx.execute(`
        let condition = true
        let value = condition ? 100 : 200
        value
      `);
      expect(result).toBe(100);
    });

    it('should work with pipeline operators', async () => {
      const result = await ctx.execute(`
        let data = 5
        data |> (x => x > 3 ? x * 2 : x)
      `);
      expect(result).toBe(10);
    });

    it('should short-circuit evaluation', async () => {
      const result = await ctx.execute(`
        let counter = 0
        function increment() {
          counter = counter + 1
          return counter
        }
        true ? 42 : increment()
        counter
      `);
      expect(result).toBe(0); // increment() should not be called
    });

    it('should only evaluate selected branch', async () => {
      const result = await ctx.execute(`
        let sideEffect = 0
        function modifyAndReturn(val) {
          sideEffect = sideEffect + 1
          return val
        }
        false ? modifyAndReturn(1) : 2
        sideEffect
      `);
      expect(result).toBe(0); // modifyAndReturn should not be called
    });
  });

  describe('Ternary with Async', () => {
    it('should work with async functions', async () => {
      const result = await ctx.execute(`
        async function getValue() {
          return true ? await Promise.resolve(42) : await Promise.resolve(0)
        }
        await getValue()
      `);
      expect(result).toBe(42);
    });
  });
});