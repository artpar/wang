import { describe, it, expect, beforeEach } from "vitest";
import { WangInterpreter, InMemoryModuleResolver } from "../../src";

describe("WangInterpreter Integration Tests", () => {
  let interpreter: WangInterpreter;
  let resolver: InMemoryModuleResolver;

  beforeEach(() => {
    resolver = new InMemoryModuleResolver();
    interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: {
        // Add custom test functions
        toUpperCase: (str: string) => str.toUpperCase(),
        double: (n: number) => n * 2,
        sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
        identity: (x: any) => x
      }
    });
  });

  describe("Basic Parsing and Execution", () => {
    it("should parse and execute variable declarations", async () => {
      const code = `
        let x = 5;
        const message = "Hello";
        var flag = true;
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBeUndefined(); // Variable declarations return undefined
    });

    it("should execute arithmetic expressions", async () => {
      const code = `
        let a = 10;
        let b = 20;
        a + b
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(30);
    });

    it("should handle string concatenation", async () => {
      const code = `
        let greeting = "Hello";
        let name = "World";
        greeting + " " + name
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe("Hello World");
    });

    it("should support template literals", async () => {
      const code = `
        let name = "Wang";
        let version = 1;
        \`Language: \${name} v\${version}\`
      `;
      
      // Note: Template literal interpolation needs to be implemented
      // For now, we'll test basic template literal support
      const simpleCode = `
        let template = \`Hello World\`;
        template
      `;
      
      const result = await interpreter.execute(simpleCode);
      expect(result).toBe("Hello World");
    });
  });

  describe("Control Flow", () => {
    it("should execute if statements", async () => {
      const code = `
        let x = 10;
        let result;
        
        if (x > 5) {
          result = "greater";
        } else {
          result = "lesser";
        }
        
        result
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe("greater");
    });

    it("should execute for loops", async () => {
      const code = `
        let sum = 0;
        for (let i = 1; i <= 5; i++) {
          sum = sum + i;
        }
        sum
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(15);
    });

    it("should execute for...of loops", async () => {
      const code = `
        let arr = [1, 2, 3, 4, 5];
        let sum = 0;
        for (let num of arr) {
          sum = sum + num;
        }
        sum
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(15);
    });

    it("should execute while loops", async () => {
      const code = `
        let count = 0;
        let sum = 0;
        while (count < 5) {
          sum = sum + count;
          count = count + 1;
        }
        sum
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(10);
    });
  });

  describe("Functions", () => {
    it("should define and call functions", async () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        
        add(3, 4)
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(7);
    });

    it("should support arrow functions", async () => {
      const code = `
        const multiply = (x, y) => x * y;
        multiply(6, 7)
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(42);
    });

    it("should support async functions", async () => {
      const code = `
        async function delayed() {
          await wait(10);
          return "done";
        }
        
        delayed()
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe("done");
    });
  });

  describe("Pipeline Operators", () => {
    it("should execute pipe operator |>", async () => {
      const code = `
        let data = "hello";
        data |> toUpperCase(_)
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe("HELLO");
    });

    it("should chain multiple pipe operations", async () => {
      const code = `
        let value = 5;
        value 
          |> double(_)
          |> double(_)
          |> double(_)
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(40); // 5 * 2 * 2 * 2
    });

    it("should support arrow operator ->", async () => {
      const code = `
        let nums = [1, 2, 3];
        nums -> sum(_)
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(6);
    });

    it("should handle underscore placeholder", async () => {
      const code = `
        let arr = [1, 2, 3, 4, 5];
        arr 
          |> filter(_, x => x > 2)
          |> map(_, x => x * 2)
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toEqual([6, 8, 10]);
    });
  });

  describe("Arrays and Objects", () => {
    it("should create and manipulate arrays", async () => {
      const code = `
        let arr = [1, 2, 3];
        push(arr, 4);
        arr
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should support array destructuring", async () => {
      const code = `
        let [first, second, ...rest] = [1, 2, 3, 4, 5];
        rest
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toEqual([3, 4, 5]);
    });

    it("should create and access objects", async () => {
      const code = `
        let obj = {
          name: "Wang",
          version: 1,
          features: ["pipelines", "CSP-safe"]
        };
        obj.name
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe("Wang");
    });

    it("should support object destructuring", async () => {
      const code = `
        let { x, y } = { x: 10, y: 20, z: 30 };
        x + y
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(30);
    });

    it("should support spread operator", async () => {
      const code = `
        let arr1 = [1, 2];
        let arr2 = [3, 4];
        let combined = [...arr1, ...arr2];
        combined
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  describe("Classes", () => {
    it("should define and instantiate classes", async () => {
      const code = `
        class Calculator {
          constructor() {
            this.value = 0;
          }
          
          add(n) {
            this.value = this.value + n;
            return this;
          }
          
          getValue() {
            return this.value;
          }
        }
        
        let calc = new Calculator();
        calc.add(5).add(10).getValue()
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(15);
    });
  });

  describe("Modules", () => {
    it("should import and export modules", async () => {
      // Add a module to the resolver
      resolver.addModule("math", `
        export function square(x) {
          return x * x;
        }
        
        export const PI = 3.14159;
      `);

      const code = `
        import { square, PI } from "math";
        square(5) + PI
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBeCloseTo(25 + 3.14159, 5);
    });

    it("should support default exports", async () => {
      resolver.addModule("utils", `
        function processData(data) {
          return data |> map(_, x => x * 2);
        }
        
        export default processData;
      `);

      const code = `
        import processData from "utils";
        processData([1, 2, 3])
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe("Error Handling", () => {
    it("should handle try/catch blocks", async () => {
      const code = `
        let result;
        try {
          throw "error occurred";
        } catch (e) {
          result = "caught: " + e;
        }
        result
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe("caught: error occurred");
    });

    it("should report undefined variables", async () => {
      const code = `
        undefinedVariable + 5
      `;
      
      await expect(interpreter.execute(code)).rejects.toThrow("undefinedVariable");
    });

    it("should report type mismatches", async () => {
      const code = `
        let arr = "not an array";
        push(arr, 1)
      `;
      
      await expect(interpreter.execute(code)).rejects.toThrow();
    });
  });

  describe("Real-world Examples", () => {
    it("should process LinkedIn profile data", async () => {
      const code = `
        // Simulate LinkedIn profile processing
        let profiles = [
          { name: "Alice", skills: 5, active: true },
          { name: "Bob", skills: 3, active: false },
          { name: "Charlie", skills: 7, active: true },
          { name: "Diana", skills: 4, active: true }
        ];
        
        profiles
          |> filter(_, p => p.active)
          |> filter(_, p => p.skills >= 5)
          |> map(_, p => p.name)
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toEqual(["Alice", "Charlie"]);
    });

    it("should implement a data transformation pipeline", async () => {
      const code = `
        // Data processing workflow
        let rawData = "  Hello, World!  ";
        
        rawData
          |> trim(_)
          |> toUpperCase(_)
          |> replace(_, "WORLD", "WANG")
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe("HELLO, WANG!");
    });

    it("should handle async workflow", async () => {
      const code = `
        async function workflow(data) {
          let processed = data |> map(_, x => x * 2);
          await wait(5);
          return processed |> sum(_);
        }
        
        workflow([1, 2, 3, 4, 5])
      `;
      
      const result = await interpreter.execute(code);
      expect(result).toBe(30); // (1+2+3+4+5) * 2
    });
  });
});