/**
 * Regex Pipeline and Method Chaining Tests
 * Tests regex usage with Wang's pipeline operators and method chaining
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { TestContext } from '../test-utils.js';

describe('Wang Regex with Pipelines and Method Chaining', () => {
  let ctx;

  beforeEach(() => {
    ctx = new TestContext();
    
    // String/regex helper functions
    ctx.addFunction('test', (str, pattern) => pattern.test(str));
    ctx.addFunction('match', (str, pattern) => str.match(pattern));
    ctx.addFunction('replace', (str, pattern, replacement) => str.replace(pattern, replacement));
    ctx.addFunction('search', (str, pattern) => str.search(pattern));
    ctx.addFunction('split', (str, pattern) => str.split(pattern));
    ctx.addFunction('exec', (pattern, str) => pattern.exec(str));
    
    // Array helper functions
    ctx.addFunction('filter', async (arr, predicate) => {
      const results = [];
      for (let i = 0; i < arr.length; i++) {
        const shouldInclude = predicate(arr[i], i, arr);
        if (shouldInclude instanceof Promise ? await shouldInclude : shouldInclude) {
          results.push(arr[i]);
        }
      }
      return results;
    });
    ctx.addFunction('map', async (arr, mapper) => {
      const results = [];
      for (let i = 0; i < arr.length; i++) {
        const result = mapper(arr[i], i, arr);
        results.push(result instanceof Promise ? await result : result);
      }
      return results;
    });
    ctx.addFunction('length', (arr) => arr ? arr.length : 0);
    ctx.addFunction('join', (arr, separator) => arr.join(separator || ''));
    ctx.addFunction('slice', (arr, start, end) => arr.slice(start, end));
    ctx.addFunction('first', (arr) => arr && arr.length > 0 ? arr[0] : undefined);
    ctx.addFunction('last', (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : undefined);
    
    // Utility functions
    ctx.addFunction('toUpperCase', (str) => str.toUpperCase());
    ctx.addFunction('toLowerCase', (str) => str.toLowerCase());
    ctx.addFunction('trim', (str) => str.trim());
    ctx.addFunction('reverse', (arr) => [...arr].reverse());
    ctx.addFunction('sort', (arr) => [...arr].sort());
    ctx.addFunction('unique', (arr) => [...new Set(arr)]);
    ctx.addFunction('flatten', (arr) => arr.flat());
    ctx.addFunction('sum', (arr) => arr.reduce((a, b) => a + b, 0));
    ctx.addFunction('max', (arr) => Math.max(...arr));
    ctx.addFunction('min', (arr) => Math.min(...arr));
  });

  describe('Basic Pipeline Operations with Regex', () => {
    test('should pipe text through regex test', async () => {
      const result = await ctx.execute(`
        "hello@world.com" |> test(_, /^[^@]+@[^@]+\\.[^@]+$/)
      `);
      expect(result).toBe(true);
    });

    test('should pipe text through regex match', async () => {
      const result = await ctx.execute(`
        "extract 123 and 456" |> match(_, /\\d+/g)
      `);
      expect(result).toEqual(['123', '456']);
    });

    test('should pipe text through regex replace', async () => {
      const result = await ctx.execute(`
        "hello world" |> replace(_, /world/, "universe")
      `);
      expect(result).toBe('hello universe');
    });

    test('should pipe text through regex split', async () => {
      const result = await ctx.execute(`
        "a,b;c:d" |> split(_, /[,;:]/)
      `);
      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });

    test('should use arrow pipeline operator', async () => {
      const result = await ctx.execute(`
        "TEST123" -> toLowerCase(_) -> match(_, /\\d+/) -> first(_)
      `);
      expect(result).toBe('123');
    });
  });

  describe('Complex Pipeline Chains with Regex', () => {
    test('should chain multiple regex operations', async () => {
      const result = await ctx.execute(`
        "Hello World 123!" 
        |> replace(_, /[!]/, "") 
        |> match(_, /\\w+/g) 
        |> length(_)
      `);
      expect(result).toBe(3);
    });

    test('should extract and transform data', async () => {
      const result = await ctx.execute(`
        "user@domain.com, admin@site.org"
        |> split(_, /,\\s*/)
        |> map(_, email => match(email, /^([^@]+)@([^@]+)$/))
        |> filter(_, match => match !== null)
        |> map(_, match => match[1])
        |> sort(_)
      `);
      expect(result).toEqual(['admin', 'user']);
    });

    test('should process log data with regex', async () => {
      const result = await ctx.execute(`
        "ERROR: Failed login from 192.168.1.1\\nINFO: User logged in\\nERROR: Database timeout"
        |> split(_, /\\n/)
        |> filter(_, line => test(line, /ERROR:/))
        |> map(_, line => match(line, /ERROR: (.+)$/))
        |> map(_, match => match ? match[1] : "")
        |> length(_)
      `);
      expect(result).toBe(2);
    });

    test('should validate and format phone numbers', async () => {
      const result = await ctx.execute(`
        "Call me at 1234567890 or (555) 123-4567"
        |> match(_, /(?:\\(?\\d{3}\\)?[\\s-]?)?\\d{3}[\\s-]?\\d{4}/g)
        |> map(_, phone => replace(phone, /[\\(\\)\\s-]/g, ""))
        |> filter(_, phone => length(phone) === 10)
        |> length(_)
      `);
      expect(result).toBe(2);
    });

    test('should extract and analyze URLs', async () => {
      const result = await ctx.execute(`
        "Visit https://example.com and http://test.org/path"
        |> match(_, /(https?):\\/\\/([^\\/\\s]+)/g)
        |> map(_, url => match(url, /(https?):\\/\\/([^\\/\\s]+)/))
        |> map(_, match => match[2])
        |> sort(_)
      `);
      expect(result).toEqual(['example.com', 'test.org']);
    });
  });

  describe('Regex with Array Pipeline Operations', () => {
    test('should filter array with regex', async () => {
      const result = await ctx.execute(`
        ["hello123", "world", "test456", "example"]
        |> filter(_, item => test(item, /\\d/))
        |> map(_, item => match(item, /\\d+/)[0])
        |> map(_, num => parseInt(num))
        |> sum(_)
      `);
      expect(result).toBe(579);
    });

    test('should validate email list', async () => {
      const result = await ctx.execute(`
        ["user@domain.com", "invalid-email", "admin@site.org", "bad@", "test@example.co.uk"]
        |> filter(_, email => test(email, /^[^@]+@[^@]+\\.[^@]+$/))
        |> map(_, email => match(email, /^([^@]+)@/)[1])
        |> unique(_)
        |> sort(_)
      `);
      expect(result).toEqual(['admin', 'test', 'user']);
    });

    test('should process structured data', async () => {
      const result = await ctx.execute(`
        ["ID: 001, Name: John", "ID: 002, Name: Jane", "ID: 003, Name: Bob"]
        |> map(_, item => {
          let idMatch = match(item, /ID: (\\d+)/)
          let nameMatch = match(item, /Name: (\\w+)/)
          return {
            id: idMatch ? idMatch[1] : null,
            name: nameMatch ? nameMatch[1] : null
          }
        })
        |> filter(_, item => item.id && item.name)
        |> map(_, item => item.name)
        |> length(_)
      `);
      expect(result).toBe(3);
    });

    test('should analyze text patterns', async () => {
      const result = await ctx.execute(`
        ["The quick brown fox", "jumped over", "the lazy dog"]
        |> map(_, sentence => match(sentence, /\\b\\w+\\b/g) || [])
        |> flatten(_)
        |> filter(_, word => test(word, /^[a-z]{4,}$/i))
        |> map(_, word => toLowerCase(word))
        |> unique(_)
        |> sort(_)
        |> length(_)
      `);
      expect(result).toBe(6); // "quick", "brown", "jumped", "over", "lazy"
    });
  });

  describe('Advanced Pipeline Patterns', () => {
    test('should chain regex with conditional logic', async () => {
      const result = await ctx.execute(`
        "Contact: john.doe@company.com or call (555) 123-4567"
        |> (text => {
          let hasEmail = test(text, /@/)
          let hasPhone = test(text, /\\(\\d{3}\\)/)
          if (hasEmail && hasPhone) {
            return "both"
          } else if (hasEmail) {
            return "email"
          } else if (hasPhone) {
            return "phone"
          } else {
            return "none"
          }
        })
      `);
      expect(result).toBe("both");
    });

    test('should use regex in nested pipelines', async () => {
      const result = await ctx.execute(`
        ["error: file not found", "warning: disk space low", "error: connection failed"]
        |> map(_, log => {
          return log 
            |> match(_, /^(\\w+): (.+)$/)
            |> (match => match ? { level: match[1], message: match[2] } : null)
        })
        |> filter(_, item => item !== null)
        |> filter(_, item => item.level === "error")
        |> length(_)
      `);
      expect(result).toBe(2);
    });

    test('should process CSV-like data with regex', async () => {
      const result = await ctx.execute(`
        "name,age,email\\nJohn,30,john@example.com\\nJane,25,jane@test.org\\nBob,35,invalid"
        |> split(_, /\\n/)
        |> slice(_, 1)  // Skip header
        |> map(_, line => split(line, /,/))
        |> filter(_, parts => length(parts) === 3)
        |> filter(_, parts => test(parts[2], /@/))  // Valid email
        |> map(_, parts => parseInt(parts[1]))  // Get ages
        |> (ages => sum(ages) / length(ages))  // Average age
      `);
      expect(result).toBe(27.5);
    });

    test('should extract and validate JSON-like data', async () => {
      const result = await ctx.execute(`
        '{"name": "John", "age": 30}, {"name": "Jane", "age": 25}'
        |> match(_, /\\{"name": "([^"]+)", "age": (\\d+)\\}/g)
        |> map(_, match => {
          let fullMatch = match(match, /\\{"name": "([^"]+)", "age": (\\d+)\\}/)
          return fullMatch ? {
            name: fullMatch[1],
            age: parseInt(fullMatch[2])
          } : null
        })
        |> filter(_, item => item !== null)
        |> map(_, item => item.age)
        |> max(_)
      `);
      expect(result).toBe(30);
    });
  });

  describe('Performance with Complex Pipelines', () => {
    test('should handle large text processing efficiently', async () => {
      const result = await ctx.execute(`
        let largeText = "word1 word2 word3 " 
        largeText = largeText + largeText + largeText  // Make it bigger
        
        largeText
        |> match(_, /\\b\\w+\\b/g)
        |> unique(_)
        |> length(_)
      `);
      expect(result).toBe(3);
    });

    test('should handle multiple regex operations on arrays', async () => {
      const result = await ctx.execute(`
        let data = []
        for (let i = 0; i < 100; i = i + 1) {
          push(data, "item" + i + "@test.com")
        }
        
        data
        |> filter(_, email => test(email, /@test\\.com$/))
        |> length(_)
      `);
      expect(result).toBe(100);
    });

    test('should cache regex patterns effectively', async () => {
      const result = await ctx.execute(`
        let pattern = /\\d+/
        let texts = ["a1", "b2", "c3", "d4", "e5"]
        
        texts
        |> map(_, text => test(text, pattern))
        |> filter(_, isMatch => isMatch)
        |> length(_)
      `);
      expect(result).toBe(5);
    });
  });

  describe('Error Handling in Pipelines', () => {
    test('should handle null/undefined gracefully in pipelines', async () => {
      const result = await ctx.execute(`
        let maybeText = null
        
        try {
          maybeText |> match(_, /test/)
          return "should not reach here"
        } catch (e) {
          return "caught error"
        }
      `);
      expect(result).toBe("caught error");
    });

    test('should handle regex failures in pipeline chains', async () => {
      const result = await ctx.execute(`
        ["valid@email.com", "invalid", "another@test.org"]
        |> map(_, text => {
          try {
            return test(text, /@/) ? "valid" : "invalid"
          } catch (e) {
            return "error"
          }
        })
        |> filter(_, status => status === "valid")
        |> length(_)
      `);
      expect(result).toBe(2);
    });
  });

  describe('Mixed Operations', () => {
    test('should mix regex with mathematical operations', async () => {
      const result = await ctx.execute(`
        "price: $12.99, discount: 20%, tax: $2.50"
        |> match(_, /\\$([0-9.]+)/g)
        |> map(_, match => parseFloat(match(match, /\\$([0-9.]+)/)[1]))
        |> sum(_)
      `);
      expect(result).toBe(15.49);
    });

    test('should combine regex with date/time operations', async () => {
      const result = await ctx.execute(`
        "Today is 2024-01-15, yesterday was 2024-01-14"
        |> match(_, /\\d{4}-\\d{2}-\\d{2}/g)
        |> map(_, date => replace(date, /-/g, "/"))
        |> sort(_)
        |> first(_)
      `);
      expect(result).toBe("2024/01/14");
    });

    test('should use regex for data transformation pipelines', async () => {
      const result = await ctx.execute(`
        "user:john,role:admin;user:jane,role:user;user:bob,role:guest"
        |> split(_, /;/)
        |> map(_, entry => {
          let userMatch = match(entry, /user:([^,]+)/)
          let roleMatch = match(entry, /role:(.+)/)
          return {
            user: userMatch ? userMatch[1] : null,
            role: roleMatch ? roleMatch[1] : null,
            isAdmin: roleMatch && roleMatch[1] === "admin"
          }
        })
        |> filter(_, entry => entry.user && entry.role)
        |> filter(_, entry => entry.isAdmin)
        |> length(_)
      `);
      expect(result).toBe(1);
    });
  });
});