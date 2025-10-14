# wang-lang

A CSP-safe workflow programming language for browser automation, designed to run in Chrome service workers and other restricted JavaScript environments.

🚀 **[Try it in the browser playground!](https://artpar.github.io/wang/playground.html)**

[![CI/CD Pipeline](https://github.com/artpar/wang/actions/workflows/ci.yml/badge.svg)](https://github.com/artpar/wang/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/wang-lang.svg)](https://www.npmjs.com/package/wang-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://artpar.github.io/wang)
[![Playground](https://img.shields.io/badge/Try-Playground-green)](https://artpar.github.io/wang/playground.html)


## Features

- ✅ **100% CSP-Safe** - No `eval()` or `new Function()`, runs safely in Chrome service workers
- 🎯 **Zero Ambiguity Grammar** - Deterministic parsing with exactly one parse tree for valid syntax
- 📦 **Modern JavaScript-like Syntax** - Full support for classes, modules, async/await, destructuring
- 🔌 **Pluggable Module System** - Implement your own module resolution (memory, IndexedDB, HTTP, etc.)
- 📍 **Enhanced Error Reporting (v0.16.1+)** - Full context with line numbers, stack traces, module names, and intelligent suggestions
- 🌐 **Browser Automation Focus** - Built for DOM manipulation and web workflows
- 🚀 **JavaScript Method Chaining** - Full support for method chaining, functional programming patterns, and multiline expressions
- ✨ **Full Class Support** - Classes with constructors, methods, **inheritance with super()**, and proper `this` binding
- 🔒 **Robust Variable Scoping** - Const immutability, var hoisting, block scoping with proper shadowing
- ♻️ **Circular Dependency Support** - Handles circular module imports without memory leaks
- 📊 **Execution Metadata API** - Comprehensive compilation and runtime metadata for debugging and analysis
- 🔄 **Implicit Return Values** - Last expression in code becomes the return value, perfect for REPL and workflows
- ❓ **Ternary Conditional Operator** - Full support for `condition ? true : false` expressions
- 🧪 **Fully Tested** - Comprehensive test suite using Vitest (638/640 tests passing - 99.7% coverage)
- 📚 **Rich Standard Library** - 70+ built-in functions for arrays, objects, strings, math, and utilities
- ➕ **Compound Assignment** - Modern operators (`+=`, `-=`, `*=`, `/=`) with zero-ambiguity grammar  
- 🔍 **Regular Expression Support** - Full regex literals with all JavaScript flags (`/pattern/gimsuy`)
- ⏸️ **Pausable Execution** - Pause and resume interpreter execution at any point
- 💾 **State Serialization** - Save and restore complete interpreter state to/from JSON
- 🔤 **Reserved Keywords as Properties** - Use reserved words like `from`, `import`, `class` as property names (JavaScript-compatible)
- 📝 **Console Capture** - Capture all console.log, warn, and error outputs with metadata (v0.12.0+)
- 📐 **Multi-line Function Calls** - Support for multi-line function calls and parameters for better readability (v0.15.14+)
- 📝 **Template Literals** - Full support for template strings with expression interpolation `` `Hello, ${name}!` ``
- 🎨 **Syntax Highlighting** - Language support for Monaco Editor, VS Code, and CodeMirror

## Installation

```bash
npm install wang-lang
```

## CLI Usage

Wang provides command-line tools for validating and executing `.wang` files:

### Execute Wang Files

```bash
# Execute a .wang file
npx wang-run script.wang

# Execute with verbose output
npx wang-run script.wang --verbose

# Execute from stdin
echo 'console.log("Hello Wang!")' | npx wang-run -

# Quiet mode (only show output)
npx wang-run script.wang --quiet
```

### Validate Wang Syntax

```bash
# Validate syntax
npx wang-validate script.wang

# Show AST
npx wang-validate script.wang --ast

# Show syntax suggestions
npx wang-validate script.wang --suggestions

# Validate from stdin
echo 'let x = 1' | npx wang-validate -
```

### Example .wang File

Create a file called `hello.wang`:

```wang
// Simple Hello World example
console.log("Hello, Wang!")

// Test basic operations
let x = 42
let y = x * 2
console.log(`x = ${x}, y = ${y}`)

// Test array operations
let numbers = [1, 2, 3, 4, 5]
let evenNumbers = filter(numbers, n => n % 2 === 0)
let doubledNumbers = map(evenNumbers, n => n * 2)
console.log("Even numbers doubled:", doubledNumbers)

// Test functions
function greet(name) {
  return `Hello, ${name}!`
}

let message = greet("Wang Developer")
console.log(message)
```

Then run it:

```bash
npx wang-run hello.wang
```

## Quick Start

```javascript
import { WangInterpreter, InMemoryModuleResolver } from 'wang-lang'

// Create a module resolver
const resolver = new InMemoryModuleResolver()

// Add a module
resolver.addModule('utils', `
  export function processData(data) {
    return data 
      .filter(item => item.active)
      .map(item => item.name)
      .sort()
`)

// Create interpreter - 70+ stdlib functions are automatically available!
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  // Add custom functions if needed (stdlib already includes filter, map, sort_by, etc.)
  functions: {
    myCustomFunction: (x) => x * 2
  }
})

// Set JavaScript objects as variables (v0.11.1+)
interpreter.setVariable('Math', Math)
interpreter.setVariable('JSON', JSON)
interpreter.setVariable('customObject', { value: 42 })

// Execute Wang code - returns the last expression value
const result = await interpreter.execute(`
  import { processData } from "utils"
  
  let data = [
    { name: "Alice", active: true },
    { name: "Bob", active: false },
    { name: "Charlie", active: true }
  ]
  
  let processed = processData(data)
  log(processed)  // ["Alice", "Charlie"]
  
  // Last expression becomes the return value
  { processed, count: processed.length }
`)

console.log(result); // { processed: ["Alice", "Charlie"], count: 2 }
```

## Language Features

### Standard Library (70+ Functions)

Wang includes a comprehensive standard library with 70+ built-in functions that work seamlessly with method chaining and require no imports:

```javascript
// Array operations (immutable)
let arr = [3, 1, 4, 1, 5, 9, 2, 6]
let uniqueArr = unique(arr)        // [3, 1, 4, 5, 9, 2, 6] - Remove duplicates  
let sortedArr = sort(uniqueArr)    // [1, 2, 3, 4, 5, 6, 9] - Sort ascending
let chunkedArr = chunk(sortedArr, 2)  // [[1,2], [3,4], [5,6], [9]] - Group into pairs
let result = map(chunkedArr, pair => sum(pair))  // [3, 7, 11, 9] - Sum each pair

// Advanced array operations
let users = [
  { name: "Alice", age: 30, active: true },
  { name: "Bob", age: 25, active: false },
  { name: "Charlie", age: 35, active: true }
]

let activeUsers = filter(users, u => u.active)     // Only active users
let sortedUsers = sort_by(activeUsers, "age")      // Sort by age property
let names = map(sortedUsers, u => u.name)          // Extract names
let result = join(names, ", ")                      // "Alice, Charlie"

// Object operations
let user = { name: "Alice", age: 30, email: "alice@example.com", password: "secret" }
let publicData = pick(user, ["name", "age"])        // { name: "Alice", age: 30 }
let withoutSecret = omit(user, ["password"])        // Remove sensitive data
let merged = merge(user, { location: "NYC" })       // Add new properties

// String operations
let str = "  hello world  "
let trimmed = trim(str)                    // "hello world" - Remove whitespace
let uppercased = upper(trimmed)            // "HELLO WORLD" - Uppercase
let replaced = replace_all(uppercased, "O", "0")  // "HELL0 W0RLD" - Replace all O's
let result = split(replaced, " ")          // ["HELL0", "W0RLD"] - Split to array

// Math and utilities  
let numbers = [1, 5, 3, 9, 2]
let stats = {
  total: sum(numbers),              // 20
  average: avg(numbers),            // 4
  median: median(numbers),          // 3
  min: min(...numbers),             // 1
  max: max(...numbers)              // 9
}

// Type checking and validation
is_array([1, 2, 3])               // true
is_object({a: 1})                 // true  
is_string("hello")                // true
is_empty([])                      // true
is_empty("")                      // true
is_empty({})                      // true

// Functional utilities
range(5)                          // [0, 1, 2, 3, 4] - Generate sequence
uuid()                            // "123e4567-e89b-12d3-a456-426614174000"
sleep(1000)                       // Promise that resolves after 1 second
```

See [Standard Library Reference](#standard-library-reference) for the complete list.

### Modern JavaScript Syntax

Wang supports most modern JavaScript features including multiline expressions (v0.21.0+):

```javascript
// Variables with proper scoping semantics
let mutable = 10;        // Block-scoped
const immutable = 20;    // Block-scoped and immutable
var hoisted = 30;        // Function-scoped with hoisting

// Compound assignment operators (v0.6.3 - fully working!)
mutable += 5;           // Addition assignment: 15
mutable -= 2;           // Subtraction assignment: 13
mutable *= 3;           // Multiplication assignment: 39
mutable /= 2;           // Division assignment: 19.5

// Increment and decrement operators
let counter = 0
counter++              // Post-increment: returns 0, then increments to 1
++counter;              // Pre-increment: increments to 2, then returns 2
counter--;              // Post-decrement: returns 2, then decrements to 1  
--counter;              // Pre-decrement: decrements to 0, then returns 0

// Const immutability is enforced
const PI = 3.14159
// PI = 3.14  // ❌ Error: Cannot reassign const variable

// Var hoisting works correctly
log(typeof x)           // "undefined" (not an error!)
var x = 42
log(x)                  // 42

// Multiline conditionals (v0.21.0+)
if (text && href && (
  text.toLowerCase().includes('result') || 
  text.toLowerCase().includes('fixture') || 
  text.toLowerCase().includes('match') ||
  text.toLowerCase().includes('schedule')
)) {
  console.log("Sports link found!")
}

// Multiline logical expressions
let isValid = (
  value !== null 
  && value !== undefined
  && (value > 0 || value === -1)
)

// Multiline ternary operators
let message = value > 100 
  ? "Large value" 
  : value > 50 
    ? "Medium value"
    : "Small value"

// Multiline for loops
for (
  let i = 0;
  i < items.length;
  i++
) {
  process(items[i])
}

// Block scoping with proper shadowing
let outer = 1
{
  let outer = 2         // Shadows outer variable
  const inner = 3
  log(outer)            // 2
}
log(outer)              // 1
// log(inner);           // ❌ Error: inner is not defined

// Destructuring
const { name, age } = person
const [first, second, ...rest] = numbers

// Template literals with full expression support
const message = `Hello, ${name}!`
const math = `Result: ${2 + 3} and ${10 * 5}`
const complex = `User ${user.name} is ${user.age >= 18 ? "adult" : "minor"}`
const formatted = `Price: $${price.toFixed(2)}`
// Note: Nested template literals are not supported (architectural limitation)

// Optional chaining (dot notation and computed member access)
const value = obj?.nested?.property ?? defaultValue
const title = titles.data?.[0]?.textContent
const item = matrix?.[row]?.[col]?.value

// Reserved keywords as property names (JavaScript-compatible)
const result = Array.from([1, 2, 3])  // 'from' is a reserved keyword
const config = { 
  import: "module", 
  class: "MyClass",
  from: "source" 
}
const source = config.from  // Access reserved keyword properties

// Spread operator
const combined = [...array1, ...array2]
const merged = { ...obj1, ...obj2 }

// Arrow functions
const double = x => x * 2
const add = (a, b) => a + b

// Regular expression literals with all JavaScript flags
const emailPattern = /^[^@]+@[^@]+\.[^@]+$/
const phoneRegex = /\(\d{3}\)\s\d{3}-\d{4}/g
const unicodePattern = /[\u{1F600}-\u{1F64F}]/gu  // Emoji with unicode flag
const multilineText = /^start.*end$/ms;             // Multiline and dotAll flags

// Regex methods work seamlessly
const text = "Contact: user@domain.com or call (555) 123-4567"
const emails = text.match(/\w+@\w+\.\w+/g)          // ["user@domain.com"]  
const hasPhone = /\(\d{3}\)/.test(text);            // true
const cleaned = text.replace(/\d+/g, "XXX");        // Replace all digits

// Ternary conditional operator
const status = age >= 18 ? "adult" : "minor"
const value = condition ? (nested ? 1 : 2) : 3

// Async/await
async function fetchData() {
  const response = await fetch(url)
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
    super(name)  // Call parent constructor
    this.breed = breed
  }
  
  speak() {
    return this.name + " barks"
  }
  
  getBreed() {
    return this.breed
  }
}

const dog = new Dog("Max", "Golden Retriever")
log(dog.speak())       // "Max barks"
log(dog.getBreed());    // "Golden Retriever"
```

### Return Values

Wang returns the last evaluated expression, making it perfect for REPL usage and functional workflows:

```javascript
// Simple expression return
const sum = await interpreter.execute(`
  let x = 5
  let y = 10
  x + y  // Returns 15
`)

// Object construction return
const config = await interpreter.execute(`
  const env = "production"
  const port = 3000
  
  // This object is returned
  { env, port, debug: false }
`)

// Functional programming with method chaining
const result = await interpreter.execute(`
  [1, 2, 3, 4, 5]
    .filter(n => n > 2)
    .map(n => n * 2)
    .reduce((sum, n) => sum + n, 0)
`)
// result = 24
```

### Method Chaining and Functional Programming

Wang provides full support for JavaScript's method chaining and functional programming patterns:

```javascript
// Array method chaining
const result = data
  .filter(x => x > 0)
  .map(x => x * 2)
  .reduce((sum, x) => sum + x, 0)

// Complex data transformations
const users = [
  {name: "Alice", scores: [80, 90, 85]},
  {name: "Bob", scores: [75, 85, 95]}
]

const averages = users.map(user => ({
  name: user.name,
  avg: user.scores.reduce((a, b) => a + b, 0) / user.scores.length
}))

// Multiline method chains with proper indentation
const processed = rawData
  .filter(item => item.active)
  .map(item => ({ ...item, processed: true }))
  .sort((a, b) => a.priority - b.priority)
  .slice(0, 10)

// Regular expressions with method chaining
const logData = "ERROR: Failed login\nINFO: Success\nERROR: Database timeout"
const errorCount = logData
  .split(/\n/)
  .filter(line => line.match(/ERROR:/))
  .length;  // 2

// Extract and process data with regex
const userEmails = "Contact alice@company.com or bob@startup.org for info"
const domains = userEmails
  .match(/(\w+)@(\w+\.\w+)/g)
  .map(email => email.split('@')[1])
  .filter((v, i, a) => a.indexOf(v) === i)  // unique
  .sort();  // ["company.com", "startup.org"]

// Method chaining across lines
const builder = new StringBuilder()
  .append("Hello")
  .append(" ")
  .append("World")
  .toString()
```

### Modules

Full ES6 module support:

```javascript
// math.wang
export function square(x) {
  return x * x
}

export const PI = 3.14159

// main.wang
import { square, PI } from "math"

const area = square(5) * PI
```

## Module Resolution

Wang provides a pluggable module resolution system. Implement your own resolver:

```javascript
import { ModuleResolver } from '@wang-lang/core'

class MyCustomResolver extends ModuleResolver {
  async resolve(modulePath, fromPath) {
    // Your logic to find and return module code
    const code = await fetchModuleFromSomewhere(modulePath)
    return { code, path: modulePath }
  }
  
  async exists(modulePath) {
    // Check if module exists
    return await checkIfModuleExists(modulePath)
  }
  
  async list(prefix) {
    // Return available modules for autocomplete
    return await getAvailableModules(prefix)
  }
}

const interpreter = new WangInterpreter({
  moduleResolver: new MyCustomResolver()
})
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
      let nameEl = querySelector(profile, ".name")
      let nameText = getText(nameEl)
      let titleEl = querySelector(profile, ".title")
      let titleText = getText(titleEl)
      let companyEl = querySelector(profile, ".company")
      let companyText = getText(companyEl)
      
      let data = {
        name: trim(replace(nameText, /[^\w\s]/g, "")),  // Clean name
        title: match(titleText, /^([^@]+)/)?.[1] || titleText, // Extract title before @
        company: trim(replace(companyText, /\s+/g, " ")), // Normalize whitespace
        isVerified: querySelector(profile, ".verified-badge") !== null
      }
      
      // Skip profiles without email patterns in title/company  
      if (titleText.match(/@/) || companyText.match(/\.(com|org|net)/i)) {
        results.push(data)
      }
      
      await wait(1000)  // Rate limiting
    }
    
    return results
  }
`)

// Bind DOM functions
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    querySelectorAll: (sel) => [...document.querySelectorAll(sel)],
    querySelector: (el, sel) => el.querySelector(sel),
    getText: (el) => el?.innerText || "",
    replace: (str, pattern, replacement) => str.replace(pattern, replacement),
    match: (str, pattern) => str.match(pattern),
    trim: (str) => str.trim(),
    wait: (ms) => new Promise(r => setTimeout(r, ms))
  }
})

// Execute the workflow
await interpreter.execute(`
  import { extractProfiles } from "linkedin-workflow"
  
  let profiles = await extractProfiles()
  log(\`Found \${profiles.length} profiles\`)
`)
```

## Syntax Highlighting

Wang has syntax highlighting support for popular code editors:

### Monaco Editor (Web)

```javascript
import { registerWangLanguage } from 'wang-lang/editor/monaco'

// After Monaco loads
registerWangLanguage(monaco)
const editor = monaco.editor.create(container, {
  value: wangCode,
  language: 'wang',
  theme: 'vs-dark'
})
```

### VS Code Extension

Install the Wang language extension from the VS Code marketplace or build from source:

```bash
# Build the extension
cd syntaxes
vsce package

# Install the .vsix file in VS Code
```

### CodeMirror

```javascript
import { wangLanguage } from 'wang-lang/editor/codemirror'
// Use with CodeMirror 6
```

See [SYNTAX_HIGHLIGHTING.md](./SYNTAX_HIGHLIGHTING.md) for detailed setup instructions.

## Pausable Execution & State Serialization

Wang includes a `PausableWangInterpreter` that extends the base interpreter with pause/resume capabilities and state serialization:

### Pause and Resume Execution

```javascript
import { PausableWangInterpreter } from 'wang-lang'

const interpreter = new PausableWangInterpreter({
  functions: {
    fetchData: async (id) => {
      // Simulate async work
      await new Promise(r => setTimeout(r, 100))
      return { id, data: `Data ${id}` }
    }
  }
})

// Start long-running execution
const promise = interpreter.execute(`
  let results = []
  for (let i = 1; i <= 100; i = i + 1) {
    let data = await fetchData(i)
    results.push(data)
  }
  results
`)

// Pause execution after some time
setTimeout(() => {
  if (interpreter.isRunning()) {
    interpreter.pause()
    console.log('Paused at:', interpreter.getCurrentVariables())
  }
}, 500)

// Resume later
if (interpreter.isPaused()) {
  const result = await interpreter.resume()
  console.log('Completed:', result)
}
```

### State Serialization

Save and restore the complete interpreter state:

```javascript
// Execute some code to build state
await interpreter.execute(`
  let gameState = {
    player: { name: "Alice", score: 100 },
    level: 5,
    inventory: ["sword", "shield"]
  }
  
  function updateScore(points) {
    gameState.player.score += points
  }
`)

// Start a process
const promise = interpreter.execute(`
  for (let round = 1; round <= 20; round = round + 1) {
    updateScore(round * 10)
    if (round === 10) {
      log("Checkpoint!")
    }
  }
  gameState
`)

// Pause at checkpoint
setTimeout(() => interpreter.pause(), 200)

// Save state to JSON
if (interpreter.isPaused()) {
  const serialized = interpreter.serialize()
  
  // Save to file, database, etc.
  await saveToFile('game-state.json', serialized)
  
  // Later, restore from saved state
  const savedState = await loadFromFile('game-state.json')
  const restored = await PausableWangInterpreter.deserialize(savedState, {
    functions: { /* re-bind custom functions */ }
  })
  
  // Continue execution from saved point
  const result = await restored.resume()
}
```

### Execution State API

Monitor and control execution:

```javascript
// Check execution state
interpreter.isRunning()   // true during execution
interpreter.isPaused()    // true when paused
interpreter.isCompleted() // true after completion
interpreter.hasError()    // true if error occurred

// Get execution information
interpreter.getExecutionState()     // Full state object
interpreter.getCallStackTrace()      // Current call stack
interpreter.getCurrentVariables()    // All accessible variables

// Control execution
interpreter.pause()   // Request pause at next checkpoint
interpreter.resume()  // Continue from pause point
```

## Metadata API

Wang provides a comprehensive metadata API that captures and exposes compilation, interpretation, and execution data:

```javascript
import { WangInterpreter } from 'wang-lang'
import { MetadataCollector } from 'wang-lang/metadata'

// Create interpreter with metadata collection
const collector = new MetadataCollector()
const interpreter = new WangInterpreter({
  onNodeVisit: (node, depth) => collector.onNodeVisit(node, depth),
  onFunctionCall: (name, args, node) => collector.onFunctionCall(name, args, node),
  onVariableAccess: (name, type, value) => collector.onVariableAccess(name, type, value)
})

// Execute code with metadata collection
collector.onExecutionStart()
await interpreter.execute(code)
collector.onExecutionEnd()

// Get comprehensive metadata
const metadata = collector.getMetadata()

// Query execution insights
console.log('Hot functions:', metadata.getHotFunctions(5))
console.log('Variable access patterns:', metadata.getHotVariables(5))
console.log('Execution path:', metadata.getExecutionPath())
console.log('Performance summary:', metadata.getExecutionSummary())

// Export for external tools
const json = collector.export()
```

### Metadata Categories

- **Compilation Phase**: Tokens, AST nodes, parse timing, source mapping
- **Interpretation Phase**: Module resolution, symbol tables, dependency graphs
- **Execution Phase**: Call tracking, variable access, control flow, method chaining
- **Runtime Data**: Live variables, execution path, current position, event stream

## Language Support

### ✅ Fully Supported Features

Wang supports all core JavaScript features for workflow automation:

- **Variables & Scoping**: `let`, `const`, `var` with proper hoisting and block scoping
- **Functions**: Regular functions, arrow functions, async/await, closures, recursion
- **Classes**: Constructors, methods, inheritance with `super()`, static methods, getters/setters
- **Control Flow**: `if/else`, loops (`for`, `for-in`, `for-of`, `while`, `do-while`), `try/catch/finally`, ternary operator (`? :`)
- **Operators**: All standard JavaScript operators - arithmetic, comparison, logical, increment/decrement (`++`, `--`), compound assignment (`+=`, `-=`, `*=`, `/=`), ternary (`? :`)
- **Regular Expressions**: Full regex literal syntax (`/pattern/flags`) with all JavaScript flags (`g`, `i`, `m`, `s`, `u`, `y`)
- **Data Types**: Objects, arrays, destructuring, template literals, spread/rest parameters, JSON-like multiline objects
- **Modules**: Named imports/exports (`import { name } from "module"`)
- **Async**: Promises, async/await, error handling
- **Built-ins**: Error constructor, type conversion functions, array methods, native constructor support (KeyboardEvent, MouseEvent, etc.)

### ⚠️ Intentionally Unsupported Features

Some advanced JavaScript features are intentionally unsupported to maintain implementation simplicity. See [`UNSUPPORTED_FEATURES.md`](./UNSUPPORTED_FEATURES.md) for full details:

- **Private fields** (`#field`) - Use `_private` naming conventions
- **Default imports** (`import name from`) - Use named imports instead  
- **Async generators** (`async function*`) - Use regular async functions
- **Tagged templates** (`` tag`template` ``) - Use function calls instead
- **Destructuring defaults** in parameters - Handle defaults manually

All unsupported features have clear workarounds using supported syntax.

## Testing

Wang achieves **99.6% test coverage** with comprehensive testing:

```bash
# Run all tests (569/571 passing)
npm test

# Watch mode for development  
npm test:watch

# Generate coverage report
npm test:coverage

# Run tests with UI
npm test:ui
```

**Test Results**: 569/571 tests passing (99.6% coverage), including:
- Comprehensive language features (classes, async/await, modules)
- Advanced method chaining and functional programming  
- Full regular expression support with all JavaScript features
- Full standard library coverage (70+ functions)
- Compound assignment and increment/decrement operators
- Edge cases and error handling

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
│   │   └── language-features.test.js # Comprehensive language tests (48 tests)
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
  import { WangInterpreter } from '@wang-lang/core'
  
  // This works even with strict CSP!
  const interpreter = new WangInterpreter()
  await interpreter.execute('log("Hello from Wang!")')
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
    moduleResolver?: ModuleResolver
    functions?: Record<string, Function>
    globalContext?: ExecutionContext
  })
  
  // Default: returns execution result
  execute(code: string, context?: ExecutionContext): Promise<any>
  
  // With metadata: returns result and captured console logs (v0.12.0+)
  execute(code: string, context?: ExecutionContext, options?: { withMetadata: true }): 
    Promise<{ result: any; metadata: { logs: ConsoleLog[] } }>
    
  bindFunction(name: string, fn: Function): void
  setVariable(name: string, value: any): void  // v0.11.1+
}
```

#### Console Capture (v0.12.0+)

The `execute()` method can capture all console output from Wang code when using the `withMetadata` option:

```javascript
const interpreter = new WangInterpreter()

// Capture console logs with metadata
const { result, metadata } = await interpreter.execute(`
  log("Processing started")
  warn("Low memory")
  error("Failed to connect")
  
  let data = [1, 2, 3]
  log("Data:", data)
  
  data.reduce((sum, n) => sum + n, 0)
`, undefined, { withMetadata: true })

console.log(result) // 6
console.log(metadata.logs) 
// [
//   { type: 'log', args: ['Processing started'], timestamp: 1234567890 },
//   { type: 'warn', args: ['Low memory'], timestamp: 1234567891 },
//   { type: 'error', args: ['Failed to connect'], timestamp: 1234567892 },
//   { type: 'log', args: ['Data:', [1, 2, 3]], timestamp: 1234567893 }
// ]

// Process captured logs
metadata.logs.forEach(log => {
  switch(log.type) {
    case 'error':
      // Handle errors
      break
    case 'warn':
      // Handle warnings
      break
    case 'log':
      // Handle info logs
      break
  }
})

// Default behavior (backward compatible) - no metadata
const result2 = await interpreter.execute(`log("Hello"); 42`)
console.log(result2) // 42
```

#### Setting Variables

The `setVariable()` method (v0.11.1+) allows you to inject JavaScript objects and values directly into Wang's global scope:

```javascript
const interpreter = new WangInterpreter()

// Set JavaScript built-in objects
interpreter.setVariable('Math', Math)
interpreter.setVariable('JSON', JSON)
interpreter.setVariable('Object', Object)
interpreter.setVariable('Array', Array)
interpreter.setVariable('console', console)

// Set custom objects
interpreter.setVariable('myAPI', {
  baseURL: 'https://api.example.com',
  getUser: (id) => fetch(`/users/${id}`),
  data: [1, 2, 3]
})

// Now accessible in Wang code
await interpreter.execute(`
  let x = Math.abs(-10)
  let data = JSON.stringify({ value: 42 })
  let keys = Object.keys(myAPI)
  console.log("API URL:", myAPI.baseURL)
`)
```

### WangValidator

A lightweight parser and syntax validator that validates Wang code without executing it. Perfect for IDE integrations, linting, and syntax checking.

```typescript
class WangValidator {
  validate(code: string, options?: ParserOptions): ValidationResult
  checkSyntaxPatterns(code: string): SyntaxPatterns
  suggestFixes(code: string): string[]
}

interface ValidationResult {
  valid: boolean
  error?: {
    message: string
    line: number
    column: number
    suggestion?: string
  }
  ast?: any  // Optional AST when includeAST: true
}

interface ParserOptions {
  includeAST?: boolean  // Include the parsed AST in result
}
```

#### Usage Examples

```javascript
import { WangValidator } from 'wang-lang'

const validator = new WangValidator()

// Simple validation
const result = validator.validate(`
  let x = 10
  double(log(x))
`)

if (result.valid) {
  console.log("Code is valid!")
} else {
  console.error(`Error at line ${result.error.line}, col ${result.error.column}:`)
  console.error(result.error.message)
  if (result.error.suggestion) {
    console.log("Suggestion:", result.error.suggestion)
  }
}

// Get AST for further analysis
const resultWithAST = validator.validate(code, { includeAST: true })
if (resultWithAST.valid) {
  console.log("AST:", resultWithAST.ast)
}

// Check for specific syntax patterns
const patterns = validator.checkSyntaxPatterns(code)
console.log("Has method chains:", patterns.hasMethodChains)
console.log("Has async/await:", patterns.hasAsyncAwait)
console.log("Has classes:", patterns.hasClasses)

// Get suggestions for common issues
const suggestions = validator.suggestFixes(code)
suggestions.forEach(suggestion => console.log("Tip:", suggestion))
```

#### Error Messages with Context

The validator provides detailed error messages with visual context:

```javascript
const result = validator.validate(`
  let x = 10
  x.
`)

// Output:
// Parse error: Syntax error at line 3 col 6:
//
// 1 
// 2   let x = 10
// 3   x.
//     ^
// Unexpected NL token. Instead, I was expecting to see one of the following:
// 
// A function name token based on:
//     MethodCall → Object "." ● MethodName
// ... and more
```

#### Common Error Detection

The validator automatically detects and suggests fixes for common issues:

- **Regex in HTML contexts**: Suggests escaping forward slashes in patterns like `</a>`
- **Multiline arrow functions**: Detects missing braces in multiline arrow function bodies
- **Missing operators**: Identifies missing commas, semicolons, or operators between statements
- **Method chaining issues**: Ensures method calls are properly formatted

### ModuleResolver

Base class for implementing module resolution.

```typescript
abstract class ModuleResolver {
  abstract resolve(modulePath: string, fromPath?: string): Promise<ModuleResolution>
  abstract exists(modulePath: string, fromPath?: string): Promise<boolean>
  abstract list(prefix?: string): Promise<string[]>
}
```

## Standard Library Reference

Wang's standard library provides 70+ functions organized into logical categories. All functions are **immutable** and designed for **functional programming**:

### Array Operations
```javascript
// Core operations
filter(arr, predicate)           // Filter elements
map(arr, mapper)                 // Transform elements  
reduce(arr, reducer, initial)    // Reduce to single value
forEach(arr, fn)                 // Iterate (side effects)
find(arr, predicate)             // Find first match
some(arr, predicate)             // Test if any match
every(arr, predicate)            // Test if all match

// Sorting and ordering
sort(arr, compareFn?)            // Sort array
sort_by(arr, property)           // Sort by property
reverse(arr)                     // Reverse order

// Array manipulation
slice(arr, start, end)           // Extract portion
concat(...arrays)               // Combine arrays
flatten(arr, depth?)            // Flatten nested arrays
chunk(arr, size)                // Split into chunks
zip(...arrays)                  // Combine arrays element-wise
partition(arr, predicate)       // Split based on condition

// Unique and grouping
unique(arr)                     // Remove duplicates
unique_by(arr, property)        // Remove duplicates by property
group_by(arr, property)         // Group by property

// Utilities
compact(arr)                    // Remove falsy values
at(arr, index)                  // Safe array access
join(arr, separator)            // Join to string
includes(arr, item)             // Check inclusion
indexOf(arr, item)              // Find index
```

### Object Operations
```javascript
// Property manipulation
pick(obj, keys)                 // Select specific properties
omit(obj, keys)                 // Remove specific properties  
merge(...objects)               // Deep merge objects
clone(obj)                      // Deep clone object

// Property access
get(obj, path)                  // Safe nested access: get(obj, "a.b.c")
set(obj, path, value)           // Set nested property
has(obj, path)                  // Check if property exists

// Object inspection
keys(obj)                       // Get object keys
values(obj)                     // Get object values
entries(obj)                    // Get [key, value] pairs
```

### String Operations
```javascript
// Case transformation
upper(str)                      // Convert to uppercase
lower(str)                      // Convert to lowercase  
capitalize(str)                 // Capitalize first letter

// String manipulation
trim(str)                       // Remove whitespace
split(str, separator)           // Split to array
join(arr, separator)            // Join array to string
replace_all(str, search, replace) // Replace all occurrences

// String testing
starts_with(str, prefix)        // Check prefix
ends_with(str, suffix)          // Check suffix
truncate(str, length)           // Truncate with ellipsis
```

### Math Operations
```javascript
// Basic math
sum(numbers)                    // Sum all numbers
avg(numbers)                    // Average
median(numbers)                 // Median value
min(...nums)                    // Minimum
max(...nums)                    // Maximum

// Advanced math
clamp(value, min, max)          // Constrain value to range
random_int(min, max)            // Random integer in range
abs(n), ceil(n), floor(n), round(n) // Standard math functions
pow(base, exp), sqrt(n)         // Power and square root
```

### Type Checking
```javascript
is_array(val)                   // Check if array
is_object(val)                  // Check if object (not array/null)
is_string(val)                  // Check if string
is_number(val)                  // Check if number
is_boolean(val)                 // Check if boolean
is_null(val)                    // Check if null
is_empty(val)                   // Check if empty (array/object/string)
```

### Functional Utilities
```javascript
count(arr, predicate?)          // Count elements (optionally matching predicate)
find_index(arr, predicate)      // Find index of first match
range(n)                        // Generate array [0, 1, ..., n-1]
uuid()                          // Generate UUID v4
sleep(ms)                       // Async sleep (returns Promise)
```

### Data Conversion
```javascript
to_json(obj)                    // Convert to JSON string
from_json(str)                  // Parse JSON string
encode_base64(str)              // Base64 encode
decode_base64(str)              // Base64 decode
```

### Console Functions
```javascript  
log(...args)                    // Console log
error(...args)                  // Console error
warn(...args)                   // Console warn
```

All functions follow **snake_case** naming and are **immutable** - they return new values without modifying inputs.

## Implementation Status

### ✅ Fully Implemented
- **Classes**: Constructors, methods, inheritance with `extends` and `super()`, static methods, getters/setters
- **Method Chaining**: Cross-line method chaining with proper continuation
- **Variable Declarations**: `let`, `const`, `var` with proper hoisting and block scoping
- **Functions**: Regular functions, arrow functions, async/await, closures, recursion, default parameters
- **Control Flow**: `if/else`, loops (`for`, `while`, `do-while`, `for...of`, `for...in`), `switch` statements, `try/catch/finally`
- **Operators**: 
  - Arithmetic (`+`, `-`, `*`, `/`, `%`, `**`)
  - Comparison (`==`, `!=`, `===`, `!==`, `<`, `>`, `<=`, `>=`)
  - Logical (`&&`, `||`, `!`)
  - Increment/Decrement (`++`, `--`) with prefix/postfix support
  - Compound Assignment (`+=`, `-=`, `*=`, `/=`)
  - Ternary Conditional (`? :`) with nested support
  - Optional Chaining (`?.`) with computed member access (`?.[expression]`) and Nullish Coalescing (`??`)
- **Data Types**: Arrays, objects, destructuring, template literals, spread/rest operators
- **Module System**: Named imports/exports with ES6 syntax
- **Error Handling**: Comprehensive try/catch/finally with proper error propagation
- **Regular Expressions**: Full regex literal support (`/pattern/flags`) with all JavaScript flags and methods  
- **Advanced Features**: Method chaining, labeled statements, `new` operator, proper `this` binding
- **Standard Library**: 70+ built-in functions for arrays, objects, strings, math, and utilities

### 🚧 Partially Implemented
- Destructuring (works in most contexts except function parameters)
- Arrow function `this` preservation in closures (works in methods but not fully in nested closures)

### ❌ Not Yet Implemented
- Private fields (#field syntax)
- Async generators
- Default exports/imports
- Namespace imports (import * as)
- Re-exports
- Tagged template literals
- Destructuring in function parameters
- Spread syntax in expressions (e.g., `...array` in function calls)

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
