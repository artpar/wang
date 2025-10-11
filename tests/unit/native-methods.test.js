import { describe, it, expect } from 'vitest';
import { WangInterpreter } from '../../dist/esm/index.js';

describe('Native String Methods', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should support string.split() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello,world,test"
      let parts = text.split(",")
      return parts
    `);
    expect(result).toEqual(['hello', 'world', 'test']);
  });

  it('should support string.includes() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.includes("world")
    `);
    expect(result).toBe(true);
  });

  it('should support string.indexOf() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.indexOf("world")
    `);
    expect(result).toBe(6);
  });

  it('should support string.substring() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.substring(0, 5)
    `);
    expect(result).toBe('hello');
  });

  it('should support string.substr() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.substr(6, 5)
    `);
    expect(result).toBe('world');
  });

  it('should support string.slice() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.slice(0, 5)
    `);
    expect(result).toBe('hello');
  });

  it('should support string.trim() method', async () => {
    const result = await interpreter.execute(`
      let text = "  hello world  "
      return text.trim()
    `);
    expect(result).toBe('hello world');
  });

  it('should support string.trimStart() and trimEnd() methods', async () => {
    const result = await interpreter.execute(`
      let text = "  hello world  "
      return {
        start: text.trimStart(),
        end: text.trimEnd()
      }
    `);
    expect(result.start).toBe('hello world  ');
    expect(result.end).toBe('  hello world');
  });

  it('should support string.replace() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.replace("world", "Wang")
    `);
    expect(result).toBe('hello Wang');
  });

  it('should support string.replaceAll() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello hello hello"
      return text.replaceAll("hello", "hi")
    `);
    expect(result).toBe('hi hi hi');
  });

  it('should support string.toLowerCase() and toUpperCase() methods', async () => {
    const result = await interpreter.execute(`
      let text = "Hello World"
      return {
        lower: text.toLowerCase(),
        upper: text.toUpperCase()
      }
    `);
    expect(result.lower).toBe('hello world');
    expect(result.upper).toBe('HELLO WORLD');
  });

  it('should support string.charAt() and charCodeAt() methods', async () => {
    const result = await interpreter.execute(`
      let text = "hello"
      return {
        char: text.charAt(1),
        code: text.charCodeAt(1)
      }
    `);
    expect(result.char).toBe('e');
    expect(result.code).toBe(101);
  });

  it('should support string.startsWith() and endsWith() methods', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return {
        starts: text.startsWith("hello"),
        ends: text.endsWith("world")
      }
    `);
    expect(result.starts).toBe(true);
    expect(result.ends).toBe(true);
  });

  it('should support string.repeat() method', async () => {
    const result = await interpreter.execute(`
      let text = "abc"
      return text.repeat(3)
    `);
    expect(result).toBe('abcabcabc');
  });

  it('should support string.padStart() and padEnd() methods', async () => {
    const result = await interpreter.execute(`
      let text = "5"
      return {
        start: text.padStart(3, "0"),
        end: text.padEnd(3, "0")
      }
    `);
    expect(result.start).toBe('005');
    expect(result.end).toBe('500');
  });

  it('should support string.match() method', async () => {
    const result = await interpreter.execute(`
      let text = "The rain in Spain"
      let matches = text.match(/ain/g)
      return matches
    `);
    expect(result).toEqual(['ain', 'ain']);
  });

  it('should support string.search() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      return text.search(/world/)
    `);
    expect(result).toBe(6);
  });

  it('should support string.concat() method', async () => {
    const result = await interpreter.execute(`
      let text1 = "hello"
      let text2 = " world"
      return text1.concat(text2)
    `);
    expect(result).toBe('hello world');
  });

  it('should support string.lastIndexOf() method', async () => {
    const result = await interpreter.execute(`
      let text = "hello world hello"
      return text.lastIndexOf("hello")
    `);
    expect(result).toBe(12);
  });

  it('should support chaining string methods', async () => {
    const result = await interpreter.execute(`
      let text = "  HELLO WORLD  "
      return text.trim().toLowerCase().replace(" ", "-")
    `);
    expect(result).toBe('hello-world');
  });

  it('should work with template literals and string methods', async () => {
    const result = await interpreter.execute(`
      let name = "wang"
      let greeting = \`Hello, \${name.toUpperCase()}!\`
      return greeting
    `);
    expect(result).toBe('Hello, WANG!');
  });

  it('should handle multi-line strings with methods', async () => {
    const result = await interpreter.execute(`
      let text = "line1\\nline2\\nline3"
      let lines = text.split("\\n")
      return lines.length
    `);
    expect(result).toBe(3);
  });
});

describe('Native Array Methods', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should support array.filter() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let evens = numbers.filter(n => n % 2 === 0)
      return evens
    `);
    expect(result).toEqual([2, 4]);
  });

  it('should support array.map() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let doubled = numbers.map(n => n * 2)
      return doubled
    `);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should support array.reduce() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4]
      let sum = numbers.reduce((acc, n) => acc + n, 0)
      return sum
    `);
    expect(result).toBe(10);
  });

  it('should support array.find() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let found = numbers.find(n => n > 3)
      return found
    `);
    expect(result).toBe(4);
  });

  it('should support array.findIndex() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let index = numbers.findIndex(n => n > 3)
      return index
    `);
    expect(result).toBe(3);
  });

  it('should support array.some() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let hasEven = numbers.some(n => n % 2 === 0)
      return hasEven
    `);
    expect(result).toBe(true);
  });

  it('should support array.every() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [2, 4, 6, 8]
      let allEven = numbers.every(n => n % 2 === 0)
      return allEven
    `);
    expect(result).toBe(true);
  });

  it('should support array.forEach() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let sum = 0
      await numbers.forEach(n => { sum = sum + n })
      return sum
    `);
    expect(result).toBe(6);
  });

  it('should support array.sort() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [3, 1, 4, 1, 5, 9, 2, 6]
      let sorted = numbers.sort((a, b) => a - b)
      return sorted
    `);
    expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  it('should support array.reverse() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let reversed = numbers.reverse()
      return reversed
    `);
    expect(result).toEqual([5, 4, 3, 2, 1]);
  });

  it('should support array.slice() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let slice = numbers.slice(1, 4)
      return slice
    `);
    expect(result).toEqual([2, 3, 4]);
  });

  it('should support array.splice() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      // JavaScript splice mutates the array and returns removed elements
      let removed = numbers.splice(2, 1, 99)
      return { removed, numbers }
    `);
    expect(result.removed).toEqual([3]);
    expect(result.numbers).toEqual([1, 2, 99, 4, 5]);
  });

  it('should support array.concat() method', async () => {
    const result = await interpreter.execute(`
      let arr1 = [1, 2]
      let arr2 = [3, 4]
      let combined = arr1.concat(arr2)
      return combined
    `);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should support array.join() method', async () => {
    const result = await interpreter.execute(`
      let words = ["hello", "world"]
      let sentence = words.join(" ")
      return sentence
    `);
    expect(result).toBe('hello world');
  });

  it('should support array.includes() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      return numbers.includes(3)
    `);
    expect(result).toBe(true);
  });

  it('should support array.indexOf() and lastIndexOf() methods', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 2, 1]
      return {
        first: numbers.indexOf(2),
        last: numbers.lastIndexOf(2)
      }
    `);
    expect(result.first).toBe(1);
    expect(result.last).toBe(3);
  });

  it('should support array.push() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      // JavaScript push mutates the array and returns the new length
      let length = numbers.push(4, 5)
      return numbers
    `);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should support array.pop() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let last = numbers.pop()
      return last
    `);
    expect(result).toBe(3);
  });

  it('should support array.shift() and unshift() methods', async () => {
    const result = await interpreter.execute(`
      let numbers = [2, 3, 4]
      let first = numbers.shift() // removes and returns the first element
      let newLength = numbers.unshift(1, first) // adds items to front and returns new length
      return { first, newLength, numbers }
    `);
    expect(result.first).toBe(2);
    expect(result.newLength).toBe(4);
    expect(result.numbers).toEqual([1, 2, 3, 4]);
  });

  it('should support array.flat() method', async () => {
    const result = await interpreter.execute(`
      let nested = [1, [2, 3], [4, [5, 6]]]
      let flat = nested.flat()
      return flat
    `);
    expect(result).toEqual([1, 2, 3, 4, [5, 6]]);
  });

  it('should support array.flatMap() method', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3]
      let expanded = numbers.flatMap(n => [n, n * 2])
      return expanded
    `);
    expect(result).toEqual([1, 2, 2, 4, 3, 6]);
  });

  it('should support chaining array methods', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5, 6]
      let result = numbers
        .filter(n => n > 2)
        .map(n => n * 2)
        .reduce((sum, n) => sum + n, 0)
      return result
    `);
    expect(result).toBe(36); // (3*2 + 4*2 + 5*2 + 6*2) = 6 + 8 + 10 + 12 = 36
  });

  // Pipeline test removed - not JavaScript compatible

  it('should handle async operations in array methods', async () => {
    const result = await interpreter.execute(`
      // Simple async mapping test without delays
      let numbers = [1, 2, 3]
      let results = await numbers.map(async n => {
        return n * 2
      })
      return results
    `);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should work with complex data structures', async () => {
    const result = await interpreter.execute(`
      let users = [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 35 }
      ]
      
      let names = users
        .filter(u => u.age > 25)
        .map(u => u.name)
      
      return names
    `);
    expect(result).toEqual(['Bob', 'Charlie']);
  });
});

describe('Backward Compatibility', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should still support function-style string operations', async () => {
    const result = await interpreter.execute(`
      let text = "hello,world"
      let parts = split(text, ",")
      return parts
    `);
    expect(result).toEqual(['hello', 'world']);
  });

  it('should still support function-style array operations', async () => {
    const result = await interpreter.execute(`
      let numbers = [1, 2, 3, 4, 5]
      let evens = filter(numbers, n => n % 2 === 0)
      return evens
    `);
    expect(result).toEqual([2, 4]);
  });

  it('should allow mixing function and method styles', async () => {
    const result = await interpreter.execute(`
      let text = "hello,world"
      let parts = text.split(",")
      let upper = toUpperCase(parts[0])
      return upper
    `);
    expect(result).toBe('HELLO');
  });

  it('should handle undefined methods gracefully', async () => {
    const result = await interpreter.execute(`
      let text = "hello"
      let notAMethod = text.nonExistentMethod
      return notAMethod === undefined
    `);
    expect(result).toBe(true);
  });

  it('should preserve array and string length property', async () => {
    const result = await interpreter.execute(`
      let text = "hello"
      let arr = [1, 2, 3]
      return {
        textLength: text.length,
        arrayLength: arr.length
      }
    `);
    expect(result.textLength).toBe(5);
    expect(result.arrayLength).toBe(3);
  });
});

describe('Edge Cases', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new WangInterpreter();
  });

  it('should handle empty strings correctly', async () => {
    const result = await interpreter.execute(`
      let text = ""
      return {
        split: text.split(","),
        includes: text.includes(""),
        length: text.length
      }
    `);
    expect(result.split).toEqual(['']);
    expect(result.includes).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should handle empty arrays correctly', async () => {
    const result = await interpreter.execute(`
      let arr = []
      return {
        filtered: arr.filter(x => true),
        mapped: arr.map(x => x),
        length: arr.length
      }
    `);
    expect(result.filtered).toEqual([]);
    expect(result.mapped).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should handle null/undefined correctly with optional chaining', async () => {
    const result = await interpreter.execute(`
      let nullStr = null
      let undefinedArr = undefined
      // Optional chaining on null/undefined returns undefined
      let splitResult = nullStr?.split
      let mapResult = undefinedArr?.map
      return {
        nullSplit: splitResult,
        undefinedMap: mapResult
      }
    `);
    expect(result.nullSplit).toBe(undefined);
    expect(result.undefinedMap).toBe(undefined);
  });

  it('should handle computed property access for methods', async () => {
    const result = await interpreter.execute(`
      let text = "hello world"
      let methodName = "toUpperCase"
      let upper = text[methodName]()
      return upper
    `);
    expect(result).toBe('HELLO WORLD');
  });

  it('should handle methods in object literals', async () => {
    const result = await interpreter.execute(`
      let obj = {
        text: "hello",
        getUpper: function() { 
          // 'this' should refer to the object
          return this.text.toUpperCase() 
        }
      }
      return obj.getUpper()
    `);
    expect(result).toBe('HELLO');
  });
});