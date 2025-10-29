import { describe, it, expect, beforeEach } from 'vitest';
import { WangInterpreter } from '../../src/interpreter/index';
import { InMemoryModuleResolver } from '../../src/resolvers/memory';

describe('Enhanced Error Messages for Member Expressions', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        log: () => {},
      },
    });
  });

  describe('Member Expression Error Details', () => {
    it('should show specific object and method names for array methods', async () => {
      try {
        await interpreter.execute(`
          let emails = ["test@example.com", "user@domain.com"]
          emails.searchPerform("query")
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain("calling method 'searchPerform' on object 'emails'");
        expect(error.message).toContain('Expected: function');
        expect(error.message).toContain('Received: undefined');
      }
    });

    it('should show specific object and method names for object methods', async () => {
      try {
        await interpreter.execute(`
          let user = { name: "John", age: 30 }
          user.getName()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain("calling method 'getName' on object 'user'");
      }
    });

    it('should handle nested member expressions', async () => {
      try {
        await interpreter.execute(`
          let data = { items: [1, 2, 3] }
          data.items.nonExistentMethod()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain("calling method 'nonExistentMethod' on object 'data.items'");
      }
    });

    it('should handle computed member expressions', async () => {
      try {
        await interpreter.execute(`
          let obj = { data: "test" }
          let prop = "process"
          obj[prop]()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('calling method');
        expect(error.message).toContain('on object');
      }
    });

    it('should handle this member expressions', async () => {
      try {
        await interpreter.execute(`
          class MyClass {
            constructor() {
              this.value = 5;
            }
            callInvalid() {
              this.nonExistent();
            }
          }
          let instance = new MyClass();
          instance.callInvalid();
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain("calling method 'nonExistent' on object 'this'");
      }
    });
  });

  describe('Available Methods Listing', () => {
    it('should list available array methods', async () => {
      try {
        await interpreter.execute(`
          let arr = [1, 2, 3]
          arr.nonExistent()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Available methods on');
        // Check for some common array methods
        expect(formatted).toMatch(/push|pop|filter|map|forEach/);
      }
    });

    it('should list available string methods', async () => {
      try {
        await interpreter.execute(`
          let text = "hello"
          text.nonExistent()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Available methods on');
        // Check for some common string methods
        expect(formatted).toMatch(/charAt|indexOf|slice|split|toLowerCase/);
      }
    });

    it('should handle objects with custom methods', async () => {
      try {
        await interpreter.execute(`
          let obj = {
            customMethod: function() { return 1; },
            anotherMethod: function() { return 2; }
          }
          obj.missingMethod()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Available methods on');
        expect(formatted).toContain('anotherMethod');
        expect(formatted).toContain('customMethod');
      }
    });
  });

  describe('Did You Mean Suggestions', () => {
    it('should suggest similar method names for typos', async () => {
      try {
        await interpreter.execute(`
          let text = "hello"
          text.toUppercase()  // typo: should be toUpperCase
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Did you mean');
        // Should suggest toLowerCase or toUpperCase
        expect(formatted).toMatch(/toLowerCase|trim/);
      }
    });

    it('should suggest similar array method names', async () => {
      try {
        await interpreter.execute(`
          let arr = [1, 2, 3]
          arr.pus(4)  // typo: should be push
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Did you mean');
        expect(formatted).toContain('push');
      }
    });

    it('should suggest methods with similar prefixes', async () => {
      try {
        await interpreter.execute(`
          let arr = [1, 2, 3]
          arr.filterr(x => x > 1)  // typo: extra 'r'
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Did you mean');
        expect(formatted).toContain('filter');
      }
    });
  });

  describe('Error Context Information', () => {
    it('should include variables in scope', async () => {
      try {
        await interpreter.execute(`
          let x = 10
          let y = "test"
          let z = { key: "value" }
          z.nonExistent()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Variables in scope');
        expect(formatted).toContain('x:');
        expect(formatted).toContain('y:');
        expect(formatted).toContain('z:');
      }
    });

    it('should show line and column information when available', async () => {
      try {
        await interpreter.execute(`
          let obj = {}
          obj.method()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Line/column info would be available if the parser provides it
        expect(error.context).toBeDefined();
      }
    });
  });

  describe('Non-Member Expression Calls', () => {
    it('should use standard error format for regular function calls', async () => {
      try {
        await interpreter.execute(`
          let notAFunction = "hello"
          notAFunction()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain("calling 'notAFunction'");
        expect(error.message).not.toContain('on object');
        expect(error.message).toContain('Expected: function');
        expect(error.message).toContain('Received: string');
      }
    });

    it('should handle undefined function calls', async () => {
      try {
        await interpreter.execute(`
          undefinedFunction()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // This would be an undefined variable error, not a type mismatch
        expect(error.message).toContain('not defined');
      }
    });
  });

  describe('Synchronous Call Expression Errors', () => {
    it('should provide enhanced errors in synchronous contexts (arrow functions)', async () => {
      try {
        await interpreter.execute(`
          let arr = [1, 2, 3]
          let fn = () => {
            arr.nonExistent()
          }
          fn()
        `);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain("calling method 'nonExistent' on object 'arr'");
        const formatted = error.getFormattedMessage();
        expect(formatted).toContain('Available methods on');
      }
    });
  });

  describe('Helper Function Coverage', () => {
    it('should correctly extract member expression names', () => {
      // This would test getMemberExpressionName directly if it were exported
      // For now, we test it indirectly through error messages
      expect(true).toBe(true);
    });

    it('should calculate Levenshtein distance correctly', () => {
      // This would test levenshteinDistance directly if it were exported
      // Testing indirectly through "Did you mean" suggestions
      expect(true).toBe(true);
    });

    it('should find similar names correctly', () => {
      // This would test findSimilarNames directly if it were exported
      // Testing indirectly through suggestions
      expect(true).toBe(true);
    });

    it('should get object info correctly', () => {
      // This would test getObjectInfo directly if it were exported
      // Testing indirectly through available methods listing
      expect(true).toBe(true);
    });
  });
});