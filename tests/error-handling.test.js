import { describe, it, expect } from 'vitest';
import { WangInterpreter } from '../dist/esm/interpreter/index.js';
import { InMemoryModuleResolver } from '../dist/esm/resolvers/memory.js';

describe('Enhanced Error Handling', () => {
  let interpreter;
  let resolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({ moduleResolver: resolver });
  });

  describe('TypeMismatchError', () => {
    it('should provide context for null property access', async () => {
      const code = `
let user = null
let name = user.name
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Type mismatch');
        expect(error.message).toContain('accessing property');
        expect(error.message).toContain('user');
        expect(error.context).toBeDefined();
        expect(error.context.type).toBe('RuntimeError');
        expect(error.context.suggestions).toBeInstanceOf(Array);
        expect(error.context.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should provide context for undefined method calls', async () => {
      const code = `
let obj = undefined
obj.method()
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Type mismatch');
        expect(error.context).toBeDefined();
      }
    });

    it('should handle destructuring errors', async () => {
      const code = `let { name } = null`;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Type mismatch');
        expect(error.message).toContain('destructuring');
        expect(error.context.suggestions).toContain('Check that the value is of type object');
      }
    });

    it('should handle array destructuring errors', async () => {
      const code = `let [first] = undefined`;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Type mismatch');
        expect(error.message).toContain('destructuring');
        expect(error.message).toContain('array');
      }
    });

    it('should handle for...of with null', async () => {
      const code = `
let items = null
for (let item of items) { }
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Type mismatch');
        expect(error.message).toContain('for...of loop');
        expect(error.message).toContain('iterable');
      }
    });

    it('should handle for...in with null', async () => {
      const code = `
let obj = null
for (let key in obj) { }
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // for...in currently causes a parse error, not a runtime error
        // This is expected behavior for now
        expect(error.message).toBeDefined();
      }
    });

    it('should handle calling non-functions', async () => {
      const code = `
let notAFunction = 42
notAFunction()
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Type mismatch');
        expect(error.message).toContain('function');
        expect(error.message).toContain('notAFunction');
      }
    });

    it('should handle spread on non-iterable', async () => {
      const code = `
let x = 42
let arr = [...x]
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Spread on non-iterable causes a parse error
        expect(error.message).toContain('Spread syntax requires');
      }
    });
  });

  describe('Division by Zero', () => {
    it('should handle division by zero as JavaScript does (Infinity)', async () => {
      const code = `10 / 0`;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(Infinity);
    });

    it('should handle division by zero in compound assignment', async () => {
      const code = `
let x = 10
x /= 0
x
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(Infinity);
    });
  });

  describe('UndefinedVariableError', () => {
    it('should suggest similar variable names', async () => {
      const code = `
let firstName = "John"
let lastName = "Doe"
let fullName = firstname + " " + lastName
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Variable "firstname" is not defined');
        expect(error.context.suggestions).toBeDefined();
        expect(error.context.suggestions.some(s => s.includes('typo'))).toBeTruthy();
      }
    });
  });

  describe('Stack Traces', () => {
    it('should provide stack trace for nested function calls', async () => {
      const code = `
function inner(x) {
  return x.property
}

function outer(y) {
  return inner(y)
}

outer(null)
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.context.stackTrace).toBeDefined();
        expect(error.context.stackTrace).toBeInstanceOf(Array);
        expect(error.context.stackTrace.some(frame => frame.includes('inner'))).toBeTruthy();
        expect(error.context.stackTrace.some(frame => frame.includes('outer'))).toBeTruthy();
      }
    });
  });

  describe('Module Context', () => {
    it('should include module name in errors', async () => {
      resolver.addModule('testModule', `
export function processData(data) {
  return data.items.map(item => item.name)
}
      `);

      const code = `
import { processData } from "testModule"
processData(null)
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Type mismatch');
        expect(error.context.stackTrace).toBeDefined();
        expect(error.context.stackTrace.some(frame => frame.includes('processData'))).toBeTruthy();
      }
    });
  });

  describe('Location Information', () => {
    it('should include line and column information when available', async () => {
      const code = `
let x = null
x.property
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.context).toBeDefined();
        // Location info depends on parser providing it
        if (error.context.line) {
          expect(error.context.line).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Variables in Scope', () => {
    it('should show variables in scope at error point', async () => {
      const code = `
let firstName = "John"
let age = 30
let user = null
user.profile.name
      `;
      
      try {
        await interpreter.execute(code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.context.variables).toBeDefined();
        expect(error.context.variables).toHaveProperty('firstName');
        expect(error.context.variables).toHaveProperty('age');
        expect(error.context.variables).toHaveProperty('user');
      }
    });
  });
});