# @wang-lang/core

A CSP-safe workflow programming language for browser automation, designed to run in Chrome service workers and other restricted JavaScript environments.

[![npm version](https://img.shields.io/npm/v/@wang-lang/core.svg)](https://www.npmjs.com/package/@wang-lang/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

- ✅ **100% CSP-Safe** - No `eval()` or `new Function()`, runs safely in Chrome service workers
- 🎯 **Zero Ambiguity Grammar** - Deterministic parsing with exactly one parse tree for valid syntax
- 📦 **Modern JavaScript-like Syntax** - Full support for classes, modules, async/await, destructuring
- 🔌 **Pluggable Module System** - Implement your own module resolution (memory, IndexedDB, HTTP, etc.)
- 📍 **Comprehensive Error Reporting** - Detailed error messages with line numbers and recovery suggestions
- 🌐 **Browser Automation Focus** - Built for DOM manipulation and web workflows
- 🚀 **Pipeline Operators** - Elegant data flow with `|>` and `->` operators
- ✨ **Full Class Support** - Classes with constructors, methods, inheritance, and proper `this` binding
- 🧪 **Fully Tested** - Comprehensive test suite using Vitest

## Installation

```bash
npm install @wang-lang/core
```

## Quick Start

```javascript
import { WangInterpreter, InMemoryModuleResolver } from '@wang-lang/core';

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
// Variables and constants
let mutable = 10;
const immutable = 20;

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

Full object-oriented programming support with proper `this` binding:

```javascript
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height
  }
  
  area() {
    return this.width * this.height
  }
  
  perimeter() {
    return 2 * (this.width + this.height)
  }
}

const rect = new Rectangle(5, 3);
log(rect.area());       // 15
log(rect.perimeter());  // 16
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