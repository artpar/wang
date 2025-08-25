# wang-lang

A CSP-safe workflow programming language for browser automation, designed to run in Chrome service workers and other restricted JavaScript environments.

[![CI/CD Pipeline](https://github.com/artpar/wang/actions/workflows/ci.yml/badge.svg)](https://github.com/artpar/wang/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/wang-lang.svg)](https://www.npmjs.com/package/wang-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://artpar.github.io/wang)

## Features

- ✅ **100% CSP-Safe** - No `eval()` or `new Function()`, runs safely in Chrome service workers
- 🎯 **Zero Ambiguity Grammar** - Deterministic parsing with exactly one parse tree for valid syntax
- 📦 **Modern JavaScript-like Syntax** - Full support for classes, modules, async/await, destructuring
- 🔌 **Pluggable Module System** - Implement your own module resolution (memory, IndexedDB, HTTP, etc.)
- 📍 **Comprehensive Error Reporting** - Detailed error messages with line numbers and recovery suggestions
- 🌐 **Browser Automation Focus** - Built for DOM manipulation and web workflows
- 🚀 **Pipeline Operators** - Elegant data flow with `|>` and `->` operators
- ✨ **Full Class Support** - Classes with constructors, methods, **inheritance with super()**, and proper `this` binding
- 🔒 **Robust Variable Scoping** - Const immutability, var hoisting, block scoping with proper shadowing
- ♻️ **Circular Dependency Support** - Handles circular module imports without memory leaks
- 🧪 **Fully Tested** - Comprehensive test suite using Vitest (70/90 tests passing)

## Installation

```bash
npm install wang-lang
```

## Quick Start

```javascript
import { WangInterpreter, InMemoryModuleResolver } from 'wang-lang';

// Create a module resolver
const resolver = new InMemoryModuleResolver();

// Add a module
resolver.addModule('utils', `
  export function processData(data) {
    return data 
      |> filter(_, item => item.active)
      |> map(_, item => item.name)
      |> sort()
  }
`);

// Create interpreter with custom functions
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    filter: (arr, pred) => arr.filter(pred),
    map: (arr, fn) => arr.map(fn),
    sort: (arr) => arr.sort(),
    log: console.log
  }
});

// Execute Wang code
await interpreter.execute(`
  import { processData } from "utils"
  
  let data = [
    { name: "Alice", active: true },
    { name: "Bob", active: false },
    { name: "Charlie", active: true }
  ]
  
  let result = processData(data)
  log(result)  // ["Alice", "Charlie"]
`);
```

## Language Features

### Modern JavaScript Syntax

Wang supports most modern JavaScript features:

```javascript
// Variables with proper scoping semantics
let mutable = 10;        // Block-scoped
const immutable = 20;    // Block-scoped and immutable
var hoisted = 30;        // Function-scoped with hoisting

// Const immutability is enforced
const PI = 3.14159;
// PI = 3.14;  // ❌ Error: Cannot reassign const variable

// Var hoisting works correctly
log(typeof x);           // "undefined" (not an error!)
var x = 42;
log(x);                  // 42

// Block scoping with proper shadowing
let outer = 1;
{
  let outer = 2;         // Shadows outer variable
  const inner = 3;
  log(outer);            // 2
}
log(outer);              // 1
// log(inner);           // ❌ Error: inner is not defined

// Destructuring
const { name, age } = person;
const [first, second, ...rest] = numbers;

// Template literals
const message = `Hello, ${name}!`;

// Optional chaining and nullish coalescing
const value = obj?.nested?.property ?? defaultValue;

// Spread operator
const combined = [...array1, ...array2];
const merged = { ...obj1, ...obj2 };

// Arrow functions
const double = x => x * 2;
const add = (a, b) => a + b;

// Async/await
async function fetchData() {
  const response = await fetch(url);
  return await response.json()
}
```

### Classes

Full object-oriented programming support with inheritance and proper `this` binding:

```javascript
class Animal {
  constructor(name) {
    this.name = name
  }
  
  speak() {
    return this.name + " makes a sound"
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // Call parent constructor
    this.breed = breed
  }
  
  speak() {
    return this.name + " barks"
  }
  
  getBreed() {
    return this.breed
  }
}

const dog = new Dog("Max", "Golden Retriever");
log(dog.speak());       // "Max barks"
log(dog.getBreed());    // "Golden Retriever"
```

### Pipeline Operators

Elegant data transformation with pipeline operators:

```javascript
// Pipe operator (|>) - passes result as first argument with _ placeholder
const result = data
  |> filter(_, x => x > 0)
  |> map(_, x => x * 2)
  |> reduce(_, (sum, x) => sum + x, 0);

// Arrow operator (->) - passes result to function or stores
profiles 
  |> extractData(_)
  -> saveToDatabase("profiles");
```

### Modules

Full ES6 module support:

```javascript
// math.wang
export function square(x) {
  return x * x
}

export const PI = 3.14159;

// main.wang
import { square, PI } from "math";

const area = square(5) * PI;
```

## Module Resolution

Wang provides a pluggable module resolution system. Implement your own resolver:

```javascript
import { ModuleResolver } from '@wang-lang/core';

class MyCustomResolver extends ModuleResolver {
  async resolve(modulePath, fromPath) {
    // Your logic to find and return module code
    const code = await fetchModuleFromSomewhere(modulePath);
    return { code, path: modulePath };
  }
  
  async exists(modulePath) {
    // Check if module exists
    return await checkIfModuleExists(modulePath);
  }
  
  async list(prefix) {
    // Return available modules for autocomplete
    return await getAvailableModules(prefix);
  }
}

const interpreter = new WangInterpreter({
  moduleResolver: new MyCustomResolver()
});
```

### Built-in Resolvers

- **InMemoryModuleResolver** - Store modules in memory (great for testing)
- **IndexedDBModuleResolver** - Persist modules in browser storage
- **HTTPModuleResolver** - Load modules from URLs
- **CompositeModuleResolver** - Chain multiple resolvers with fallback

## Browser Automation Example

```javascript
// Define a workflow module
resolver.addModule('linkedin-workflow', `
  export async function extractProfiles() {
    let profiles = querySelectorAll(".profile-card")
    let results = []
    
    for (let profile of profiles) {
      let data = {
        name: profile |> querySelector(_, ".name") |> getText(_),
        title: profile |> querySelector(_, ".title") |> getText(_),
        company: profile |> querySelector(_, ".company") |> getText(_)
      }
      
      results.push(data)
      await wait(1000)  // Rate limiting
    }
    
    return results
  }
`);

// Bind DOM functions
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    querySelectorAll: (sel) => [...document.querySelectorAll(sel)],
    querySelector: (el, sel) => el.querySelector(sel),
    getText: (el) => el?.innerText || "",
    wait: (ms) => new Promise(r => setTimeout(r, ms))
  }
});

// Execute the workflow
await interpreter.execute(`
  import { extractProfiles } from "linkedin-workflow"
  
  let profiles = await extractProfiles()
  log(\`Found \${profiles.length} profiles\`)
`);
```

## Testing

Wang uses Vitest for testing with comprehensive coverage:

```bash
# Run all tests
npm test

# Watch mode for development
npm test:watch

# Generate coverage report
npm test:coverage

# Run tests with UI
npm test:ui
```

## Development

```bash
# Install dependencies
npm install

# Build the grammar (Nearley parser)
npm run build:grammar

# Build the package (ESM, CJS, and browser bundles)
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format

# Type checking
npm run typecheck

# Generate documentation
npm run docs
```

## Project Structure

```
wang/
├── src/
│   ├── grammar/          # Nearley grammar definition
│   │   └── wang.ne       # Grammar rules (zero ambiguity!)
│   ├── interpreter/      # Core interpreter
│   │   └── index.ts      # Main interpreter with proper this binding
│   ├── resolvers/        # Module resolvers
│   │   ├── memory.ts     # In-memory resolver
│   │   ├── indexeddb.ts  # Browser storage resolver
│   │   └── http.ts       # HTTP resolver
│   └── utils/            # Utilities
│       └── errors.ts     # Comprehensive error handling
├── tests/
│   ├── unit/            # Unit tests
│   │   ├── parser.test.js    # Parser tests (13 tests)
│   │   └── interpreter.test.js # Interpreter tests (25 tests)
│   ├── e2e/             # End-to-end tests
│   │   └── language-features.test.js # Comprehensive language tests (52 tests)
│   └── test-utils.js    # Test utilities
├── dist/                # Built files
│   ├── esm/            # ES modules
│   ├── cjs/            # CommonJS
│   └── browser/        # Browser bundle
└── vitest.config.js    # Vitest configuration
```

## Grammar Highlights

The Wang grammar is **completely deterministic** with zero ambiguity:
- Requires semicolons for statement separation (no ASI ambiguity)
- Separate expression rules for different contexts
- Proper precedence and associativity
- Clean separation between statements and expressions
- Proper typeof operator handling for hoisted variables
- Memory-efficient circular module dependency resolution

## CSP Safety

Wang is designed to run in Content Security Policy restricted environments where `eval()` and `new Function()` are blocked:

```html
<!-- Strict CSP that blocks eval -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self';">

<script type="module">
  import { WangInterpreter } from '@wang-lang/core';
  
  // This works even with strict CSP!
  const interpreter = new WangInterpreter();
  await interpreter.execute('log("Hello from Wang!")');
</script>
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Works in:
- ✅ Browser main thread
- ✅ Web Workers
- ✅ Service Workers
- ✅ Chrome Extensions (with CSP)
- ✅ Electron apps

## Performance

- **Zero-ambiguity grammar** ensures fast, predictable parsing
- **No code generation** means no JIT compilation overhead
- **Direct AST interpretation** for consistent performance
- **Module caching** for efficient imports

## API Documentation

### WangInterpreter

The main interpreter class.

```typescript
class WangInterpreter {
  constructor(options?: {
    moduleResolver?: ModuleResolver;
    functions?: Record<string, Function>;
    globalContext?: ExecutionContext;
  });
  
  execute(code: string, context?: ExecutionContext): Promise<any>;
  bindFunction(name: string, fn: Function): void;
}
```

### ModuleResolver

Base class for implementing module resolution.

```typescript
abstract class ModuleResolver {
  abstract resolve(modulePath: string, fromPath?: string): Promise<ModuleResolution>;
  abstract exists(modulePath: string, fromPath?: string): Promise<boolean>;
  abstract list(prefix?: string): Promise<string[]>;
}
```

## Built-in Functions

Wang comes with many built-in functions:

### Console
- `log(...args)` - Console log
- `error(...args)` - Console error
- `warn(...args)` - Console warn

### Arrays
- `filter(arr, predicate)` - Filter array
- `map(arr, mapper)` - Map array
- `reduce(arr, reducer, initial)` - Reduce array
- `forEach(arr, fn)` - Iterate array
- `find(arr, predicate)` - Find element
- `some(arr, predicate)` - Test if any match
- `every(arr, predicate)` - Test if all match
- `sort(arr, compareFn)` - Sort array
- `reverse(arr)` - Reverse array
- `slice(arr, start, end)` - Slice array
- `concat(...arrays)` - Concatenate arrays
- `join(arr, separator)` - Join to string
- `includes(arr, item)` - Check inclusion
- `indexOf(arr, item)` - Find index

### Objects
- `keys(obj)` - Get object keys
- `values(obj)` - Get object values
- `entries(obj)` - Get object entries
- `assign(...objects)` - Merge objects

### Strings
- `toUpperCase(str)` - Convert to uppercase
- `toLowerCase(str)` - Convert to lowercase
- `trim(str)` - Trim whitespace
- `split(str, separator)` - Split string
- `replace(str, search, replacement)` - Replace in string
- `substring(str, start, end)` - Get substring
- `startsWith(str, search)` - Check string start
- `endsWith(str, search)` - Check string end

### Math
- `abs(n)` - Absolute value
- `ceil(n)` - Ceiling
- `floor(n)` - Floor
- `round(n)` - Round
- `min(...nums)` - Minimum
- `max(...nums)` - Maximum
- `pow(base, exp)` - Power
- `sqrt(n)` - Square root
- `random()` - Random number

### Utilities
- `typeof(val)` - Type of value
- `isArray(val)` - Check if array
- `parseInt(str)` - Parse integer
- `parseFloat(str)` - Parse float
- `parseJSON(str)` - Parse JSON
- `stringify(obj)` - Stringify to JSON
- `wait(ms)` - Async wait

## Implementation Status

### ✅ Fully Implemented
- Classes with constructors and methods
- Class inheritance with `extends` and `super()`
- Static methods in classes
- Getters and setters (synchronous execution)
- Pipeline operators (`|>` and `->`)
- Variable declarations (let, const, var) with proper scoping
- Functions (regular and arrow)
- Default parameters in functions
- Async/await
- Arrays and objects
- Control flow (if/else, for, while, for...of, for...in)
- Switch statements with fall-through
- Do-while loops
- Break and continue statements
- Try/catch/finally
- Module imports/exports
- Template literals (basic)
- Spread operator
- Rest parameters
- Method chaining

### 🚧 Partially Implemented
- Destructuring (works in most contexts)
- Template literals with expressions

### ❌ Not Yet Implemented
- Private fields (#field syntax)
- Labeled break/continue
- Async generators
- Default exports/imports
- Namespace imports (import * as)
- Re-exports
- Tagged template literals
- Destructuring in function parameters

## License

MIT © 2024

## Contributing

Contributions are welcome! Please ensure:
- All tests pass (`npm test`)
- Grammar remains deterministic (zero ambiguity)
- Code is CSP-safe (no eval/new Function)
- TypeScript types are updated

## Links

- [GitHub Repository](https://github.com/artpar/wang)
- [npm Package](https://www.npmjs.com/package/@wang-lang/core)
- [Issue Tracker](https://github.com/artpar/wang/issues)