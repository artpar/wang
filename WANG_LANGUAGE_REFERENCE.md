# Wang Language Reference - The Black Book

**Version:** 1.0.0  
**Test Coverage:** 90/90 tests (100%)  
**CSP Safe:** ✅ No eval(), new Function()  

## Overview

Wang is a CSP-safe workflow programming language that runs inside JavaScript environments, designed for browser automation and data transformation. It provides JavaScript-like syntax with deterministic parsing, pluggable module resolution, and comprehensive error handling.

## Core Architecture

```
Source Code → Nearley Parser → CST → Interpreter → Result
                   ↓
            Module Resolver ← Functions Registry
```

### Execution Model
- **Parse Phase**: Nearley generates Concrete Syntax Tree (CST)
- **Interpretation Phase**: Tree walker executes nodes directly (no code generation)
- **Module Resolution**: Pluggable resolvers handle imports
- **Function Binding**: Pre-registered JavaScript functions only

## Language Grammar

### Variables & Scoping

```javascript
// Block-scoped (let/const)
let mutable = 10;
const immutable = 20;
const PI = 3.14159; // Enforced immutability

// Function-scoped with hoisting (var)
console.log(typeof x); // "undefined" (hoisted, not initialized)
var x = 42;

// Block scoping with shadowing
let outer = 1;
{
  let outer = 2; // Shadows outer
  const inner = 3;
}; // inner not accessible here
```

**Scoping Rules:**
- `let`/`const`: Block-scoped, temporal dead zone
- `var`: Function-scoped, hoisted as `undefined`
- `const`: Immutable after assignment
- Shadowing: Inner scopes can shadow outer variables

### Functions

#### Function Declarations
```javascript
function add(a, b = 0) { // Default parameters
  return a + b;
}

// Function expressions
const multiply = function(x, y) { return x * y; };

// Named function expressions (for recursion)
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1);
};
```

#### Arrow Functions
```javascript
const square = x => x * x;
const sum = (a, b) => a + b;
const complex = (x, y) => {
  const result = x * y;
  return result + 1;
};

// Lexical 'this' binding
class Calculator {
  constructor() { this.value = 0; }
  
  add(x) {
    const operation = () => this.value += x; // Preserves 'this'
    operation();
    return this;
  }
}
```

#### Rest Parameters & Spread
```javascript
function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

const arr = [1, 2, 3];
sum(...arr); // Spread in call
```

#### Closures
```javascript
function createCounter(start = 0) {
  let count = start;
  return function() {
    return ++count;
  };
}

const counter = createCounter(5);
counter(); // 6
counter(); // 7
```

### Classes & OOP

#### Class Definition
```javascript
class Animal {
  constructor(name, species) {
    this.name = name;
    this.species = species;
  }
  
  // Instance method
  speak() {
    return `${this.name} makes a sound`;
  }
  
  // Static method
  static getKingdom() {
    return "Animalia";
  }
  
  // Getter
  get info() {
    return `${this.name} is a ${this.species}`;
  }
  
  // Setter
  set name(newName) {
    if (!newName) throw "Name cannot be empty";
    this._name = newName;
  }
}
```

#### Inheritance
```javascript
class Dog extends Animal {
  constructor(name, breed) {
    super(name, "dog"); // Call parent constructor
    this.breed = breed;
  }
  
  speak() {
    return `${this.name} barks`; // Override parent method
  }
  
  getBreed() {
    return this.breed;
  }
}

const dog = new Dog("Rex", "German Shepherd");
dog.speak(); // "Rex barks"
dog.info;    // "Rex is a dog"
Animal.getKingdom(); // "Animalia"
```

#### Method Chaining
```javascript
class StringBuilder {
  constructor() { this.str = ""; }
  
  append(text) {
    this.str += text;
    return this; // Enable chaining
  }
  
  prepend(text) {
    this.str = text + this.str;
    return this;
  }
  
  toString() { return this.str; }
}

const result = new StringBuilder()
  .append("World")
  .prepend("Hello ")
  .toString(); // "Hello World"
```

### Control Flow

#### Conditionals
```javascript
// If-else
if (condition) {
  // block
} else if (other) {
  // block  
} else {
  // block
}

// Ternary operator
const result = condition ? value1 : value2;

// Complex ternary chains
const classify = n => 
  n > 100 ? "huge" :
  n > 50 ? "large" :
  n > 10 ? "small" : "tiny";
```

#### Switch Statements
```javascript
function getDayType(day) {
  switch(day) {
    case "Monday":
    case "Tuesday":
    case "Wednesday":
    case "Thursday":
    case "Friday":
      return "Weekday";
    case "Saturday":
    case "Sunday":
      return "Weekend";
    default:
      return "Invalid";
  }
}
```

#### Loops
```javascript
// For loop
for (let i = 0; i < 10; i++) {
  if (i === 5) break;
  if (i === 2) continue;
  console.log(i);
}

// For-in (object properties)
for (let key in obj) {
  console.log(key, obj[key]);
}

// For-of (iterables)
for (let item of array) {
  console.log(item);
}

// While loop
let i = 0;
while (i < 5) {
  console.log(i++);
}

// Do-while loop
do {
  console.log(i);
} while (--i > 0);
```

#### Labeled Statements
```javascript
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) {
      break outer; // Break out of both loops
    }
    console.log(i, j);
  }
}
```

### Operators

#### Arithmetic
```javascript
2 + 3 * 4    // 14 (precedence)
2 ** 3 ** 2  // 512 (right associative)
10 - 5 - 2   // 3 (left associative)
```

#### Comparison & Equality
```javascript
"5" == 5     // true (type coercion)
"5" === 5    // false (strict equality)
null == undefined   // true
null === undefined  // false
```

#### Logical
```javascript
true || false && false  // true (precedence)
false && true || true   // true

// Short-circuiting
obj && obj.method();    // Call only if obj exists
result = fallback || computeExpensive();
```

#### Modern Operators
```javascript
// Optional chaining
obj?.nested?.property
array?.[index]
func?.()

// Nullish coalescing
value ?? "default"  // Only null/undefined, not falsy
obj.prop ?? computeDefault()

// Increment/decrement
let x = 5;
x++;  // Post-increment: returns 5, x becomes 6
++x;  // Pre-increment: x becomes 7, returns 7
```

### Pipeline Operators

#### Pipe Operator (`|>`)
Passes result as first argument with `_` placeholder:

```javascript
[1, 2, 3, 4, 5]
  |> filter(_, n => n > 2)     // [3, 4, 5]
  |> map(_, n => n * 2)        // [6, 8, 10]
  |> reduce(_, (sum, n) => sum + n, 0); // 24

// Method chaining with pipe
data
  |> processor.filter(_)
  |> processor.transform(_)
  |> processor.validate(_);
```

#### Arrow Operator (`->`)
Passes result to function or operation:

```javascript
[1, 2, 3]
  |> map(_, n => n * 2)
  -> store.save("results")     // Save to store
  -> log("Saved successfully"); // Log message

// Function composition
value
  |> transform(_)
  -> validate
  -> save;
```

### Data Types & Structures

#### Primitives
```javascript
// Numbers
42, 3.14, 1e6, 0xFF, 0b1010, 0o77
Infinity, -Infinity, NaN

// Strings
"double quotes"
'single quotes'
`template literals with ${expression}`

// Booleans
true, false

// Special values
null, undefined
```

#### Arrays
```javascript
const arr = [1, 2, 3];
arr[0];           // Access
arr.push(4);      // Modify
arr.length;       // Property

// Array methods (built-in functions)
filter(arr, predicate)
map(arr, mapper)
reduce(arr, reducer, initial)
forEach(arr, callback)
find(arr, predicate)
some(arr, predicate)
every(arr, predicate)
includes(arr, item)
indexOf(arr, item)
slice(arr, start, end)
concat(arr1, arr2)
reverse(arr)
sort(arr, compareFn)
```

#### Objects
```javascript
const obj = {
  key: "value",
  nested: { inner: true },
  method() { return this.key; },
  [computed]: dynamicValue
};

obj.key;          // Dot notation
obj["key"];       // Bracket notation
obj.newProp = 42; // Assignment

// Object methods (built-in functions)
keys(obj)         // Get keys array
values(obj)       // Get values array  
entries(obj)      // Get [key, value] pairs
assign(target, ...sources) // Merge objects
```

### Destructuring

#### Object Destructuring
```javascript
const person = {
  name: "Alice",
  age: 30,
  address: {
    city: "Boston",
    coordinates: { lat: 42.3601, lng: -71.0589 }
  }
};

// Basic destructuring
const { name, age } = person;

// Nested destructuring
const { name, address: { city, coordinates: { lat } } } = person;

// Renaming
const { name: fullName, age: years } = person;

// Default values
const { name, country = "USA" } = person;
```

#### Array Destructuring
```javascript
const numbers = [1, 2, 3, 4, 5];

// Basic destructuring
const [first, second] = numbers;

// Skipping elements
const [a, , , d] = numbers; // a=1, d=4

// Rest pattern
const [head, ...tail] = numbers; // head=1, tail=[2,3,4,5]

// Nested arrays
const nested = [[1, 2], [3, 4]];
const [[a, b], [c, d]] = nested;
```

### Template Literals

```javascript
const name = "Wang";
const version = "1.0.0";

// Expression interpolation
const message = `Welcome to ${name} v${version}!`;

// Multi-line strings
const multiLine = `
  Line 1
  Line 2
  ${expression}
`;

// Nested template literals
const nested = `Outer: "${`Inner: ${value}`}"`;
```

### Async/Await

#### Promise Handling
```javascript
// Async function declaration
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed:", error.message);
    throw error;
  } finally {
    console.log("Cleanup completed");
  }
}

// Async arrow function
const processAsync = async (data) => {
  const result = await transform(data);
  return result;
};
```

#### Parallel Processing
```javascript
// Sequential processing
async function processSequential(items) {
  const results = [];
  for (let item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}

// Parallel processing
async function processParallel(items) {
  const promises = items.map(item => processItem(item));
  return await Promise.all(promises);
}
```

### Error Handling

#### Try-Catch-Finally
```javascript
try {
  riskyOperation();
} catch (error) {
  console.error("Caught:", error.message);
  // Handle error
} finally {
  console.log("Always executed");
}

// Nested error handling
try {
  try {
    innerOperation();
  } catch (innerError) {
    console.log("Inner error:", innerError);
    throw new Error("Outer error");
  } finally {
    console.log("Inner cleanup");
  }
} catch (outerError) {
  console.log("Outer error:", outerError.message);
} finally {
  console.log("Outer cleanup");
}
```

#### Error Objects
```javascript
// Creating errors
throw new Error("Something went wrong");
throw "String error"; // Also supported

// Error properties
try {
  throw new Error("Custom message");
} catch (e) {
  console.log(e.message); // "Custom message"
  console.log(e.name);    // "Error"
}
```

### Module System

#### Export Syntax
```javascript
// Named exports
export function processData(data) {
  return data.filter(item => item.active);
}

export const VERSION = "1.0.0";

export class DataProcessor {
  process(data) { return data; }
}

// Multiple exports
function helper1() { return "help1"; }
function helper2() { return "help2"; }
export { helper1, helper2 };
```

#### Import Syntax
```javascript
// Named imports
import { processData, VERSION } from "data-utils";
import { helper1, helper2 } from "helpers";

// Namespace import
import * as Utils from "utilities";
Utils.processData(data);
Utils.VERSION;

// Importing from different resolvers
import { fetchAPI } from "http://cdn.example.com/api.js";
import { localData } from "indexeddb://local-storage";
```

#### Module Resolvers

##### In-Memory Resolver
```javascript
const resolver = new InMemoryModuleResolver();
resolver.addModule("math", `
  export function add(a, b) { return a + b; }
  export function multiply(a, b) { return a * b; }
`);
```

##### HTTP Resolver
```javascript
const httpResolver = new HTTPModuleResolver();
// Resolves: import { utils } from "https://cdn.example.com/utils.js"
```

##### IndexedDB Resolver  
```javascript
const dbResolver = new IndexedDBModuleResolver();
// Stores modules persistently in browser storage
```

##### Composite Resolver
```javascript
const resolver = new CompositeModuleResolver([
  new InMemoryModuleResolver(),    // Try memory first
  new IndexedDBModuleResolver(),   // Then persistent storage
  new HTTPModuleResolver()         // Finally network
]);
```

#### Custom Resolver
```javascript
class CustomResolver extends ModuleResolver {
  async resolve(modulePath, fromPath) {
    const code = await this.fetchModuleCode(modulePath);
    return { code, path: modulePath };
  }
  
  async exists(modulePath) {
    return await this.checkModuleExists(modulePath);
  }
  
  async list(prefix) {
    return await this.getAvailableModules(prefix);
  }
}
```

### Built-in Functions

#### Console
```javascript
log(...args)       // Console output
error(...args)     // Error output
warn(...args)      // Warning output
```

#### Type Checking & Conversion
```javascript
typeof(value)      // Type of value
isArray(value)     // Check if array
isNaN(value)       // Check if NaN
isFinite(value)    // Check if finite number
isInteger(value)   // Check if integer

// Type conversion
Number(value)      // Convert to number
String(value)      // Convert to string  
Boolean(value)     // Convert to boolean
parseInt(str)      // Parse integer
parseFloat(str)    // Parse float
```

#### JSON
```javascript
parseJSON(str)     // Parse JSON string
stringify(obj)     // Convert to JSON string
```

#### Math
```javascript
abs(n)            // Absolute value
ceil(n)           // Ceiling
floor(n)          // Floor
round(n)          // Round to integer
min(...nums)      // Minimum value
max(...nums)      // Maximum value  
pow(base, exp)    // Power
sqrt(n)           // Square root
random()          // Random 0-1
```

#### String Operations
```javascript
toUpperCase(str)           // Convert to uppercase
toLowerCase(str)           // Convert to lowercase
trim(str)                  // Remove whitespace
split(str, separator)      // Split into array
replace(str, search, replacement) // Replace text
substring(str, start, end) // Extract substring
startsWith(str, search)    // Check if starts with
endsWith(str, search)      // Check if ends with
```

#### Utilities
```javascript
wait(ms)          // Async delay (returns Promise)
```

## Interpreter Usage

### Basic Setup
```javascript
import { WangInterpreter, InMemoryModuleResolver } from 'wang-lang';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    // Bind custom functions
    customFunc: (arg) => processArg(arg),
    domQuery: (sel) => document.querySelector(sel)
  }
});

// Execute Wang code
const result = await interpreter.execute(`
  let data = [1, 2, 3];
  data |> map(_, x => x * 2) |> reduce(_, (sum, x) => sum + x, 0)
`);
console.log(result); // 12
```

### Function Binding
```javascript
// Bind functions at creation
const interpreter = new WangInterpreter({
  functions: {
    fetch: fetch,
    querySelector: (sel) => document.querySelector(sel),
    click: (el) => el.click(),
    wait: (ms) => new Promise(r => setTimeout(r, ms))
  }
});

// Bind functions after creation
interpreter.bindFunction('newFunc', (arg) => arg.toUpperCase());
```

### Browser Automation Example
```javascript
const interpreter = new WangInterpreter({
  functions: {
    querySelectorAll: (sel) => [...document.querySelectorAll(sel)],
    querySelector: (el, sel) => el.querySelector(sel),
    getText: (el) => el?.innerText || "",
    click: (el) => el.click(),
    wait: (ms) => new Promise(r => setTimeout(r, ms))
  }
});

await interpreter.execute(`
  // Extract profile data
  let profiles = querySelectorAll(".profile-card");
  let results = [];
  
  for (let profile of profiles) {
    let data = {
      name: profile |> querySelector(_, ".name") |> getText(_),
      title: profile |> querySelector(_, ".title") |> getText(_)
    };
    
    // Click save button if profile is active
    let saveBtn = querySelector(profile, ".save-btn");
    if (saveBtn) {
      click(saveBtn);
      await wait(1000); // Rate limiting
    }
    
    results.push(data);
  }
  
  log(\`Processed \${results.length} profiles\`);
  results
`);
```

## Intentionally Unsupported Features

### Private Fields (`#field`)
**Not Supported** - Use naming conventions instead:
```javascript
// ❌ Not supported
class BankAccount {
  #balance = 0;
  #validateAmount(amount) { /* ... */ }
}

// ✅ Use conventions
class BankAccount {
  constructor() {
    this._balance = 0; // Convention: prefix with _
  }
  
  _validateAmount(amount) { /* ... */ }
}
```

### Default Imports/Exports
**Not Supported** - Use named imports/exports:
```javascript
// ❌ Not supported
export default function sum() { /* ... */ }
import sum from "math";

// ✅ Use named exports
export function sum() { /* ... */ }
import { sum } from "math";
```

### Destructuring with Defaults in Parameters
**Not Supported** - Handle defaults in function body:
```javascript
// ❌ Not supported
function processUser({ name, age = 18 }) {
  return `${name} is ${age}`;
}

// ✅ Handle manually
function processUser(user) {
  const name = user.name;
  const age = user.age !== undefined ? user.age : 18;
  return `${name} is ${age}`;
}
```

### Async Generators (`async function*`)
**Not Supported** - Use regular async functions:
```javascript
// ❌ Not supported
async function* asyncGen() {
  yield 1;
  yield 2;
}

// ✅ Use arrays
async function getAsyncData() {
  return [1, 2];
}
```

### Tagged Template Literals
**Not Supported** - Use function calls:
```javascript
// ❌ Not supported
const result = html`<div>${content}</div>`;

// ✅ Use function calls
const result = html(["<div>", "</div>"], content);
```

### Re-exports
**Not Supported** - Import then export:
```javascript
// ❌ Not supported
export { coreFunction } from "core";

// ✅ Import then export
import { coreFunction } from "core";
export { coreFunction };
```

## Error Messages & Recovery

Wang provides comprehensive error reporting with suggestions:

### Syntax Errors
```
SyntaxError at line 5, column 10:
  Expected ';' after expression
  
  let x = 10  // Missing semicolon
            ^
  
Suggestion: Add semicolon after expression
```

### Runtime Errors
```
ReferenceError at line 12:
  Variable 'unknownVar' is not defined
  
  return unknownVar + 5;
         ^~~~~~~~~
  
Available variables in scope: x, y, result
```

### Type Errors
```
TypeError at line 8:
  Cannot call non-function value
  
  const result = notAFunction();
                 ^~~~~~~~~~~
  
Suggestion: Check if 'notAFunction' is defined as a function
```

## Performance Characteristics

### Parser Performance
- **Zero-ambiguity grammar**: Deterministic parsing, no backtracking
- **No code generation**: Direct CST interpretation
- **Memory efficient**: No generated code storage

### Runtime Performance
- **Direct interpretation**: No compilation overhead
- **Module caching**: Resolved modules are cached
- **Scope chain optimization**: Efficient variable lookup

### Memory Usage
- **Minimal footprint**: No generated code in memory
- **Garbage collection friendly**: Standard JavaScript object lifecycle
- **Module sharing**: Resolved modules shared across contexts

## Security Model

### CSP Compliance
- **No eval()**: Code never dynamically evaluated
- **No new Function()**: Functions never created from strings
- **No dynamic imports**: All imports resolved statically
- **Safe execution**: Runs in restricted environments

### Sandboxing
- **Function allowlist**: Only pre-registered functions callable
- **Module isolation**: Modules can't access interpreter internals
- **Controlled globals**: No access to global JavaScript objects unless bound

## Debugging & Development

### Error Context
Wang provides rich error context:
```javascript
try {
  await interpreter.execute(code);
} catch (error) {
  console.log(error.message);    // Human-readable error
  console.log(error.location);   // Line/column info
  console.log(error.suggestion); // Fix suggestion
  console.log(error.context);    // Surrounding code
}
```

### Variable Inspection
```javascript
const context = interpreter.createContext();
// Execute code in context
await interpreter.execute(code, context);
// Inspect variables
console.log(context.variables.get('variableName'));
```

## Best Practices

### Code Organization
```javascript
// Good: Clear module boundaries
export function processData(data) {
  return validateData(data)
    |> transformData(_)
    |> optimizeData(_);
}

function validateData(data) { /* ... */ }
function transformData(data) { /* ... */ }
function optimizeData(data) { /* ... */ }
```

### Error Handling
```javascript
// Good: Comprehensive error handling
async function safeOperation() {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    log("Operation failed:", error.message);
    return { success: false, error: error.message };
  } finally {
    cleanup();
  }
}
```

### Performance
```javascript
// Good: Use pipelines for data transformation
data
  |> filter(_, item => item.active)
  |> map(_, item => transformItem(item))
  |> reduce(_, (acc, item) => acc + item.value, 0);

// Good: Batch async operations
const promises = items.map(item => processAsync(item));
const results = await Promise.all(promises);
```

## Metadata API

Wang provides comprehensive metadata collection for debugging and analysis:

### Basic Usage
```javascript
import { WangInterpreter } from 'wang-lang';
import { MetadataCollector, WangMetadata } from 'wang-lang/metadata';

// Create metadata collector
const collector = new MetadataCollector();

// Hook into interpreter
const interpreter = new WangInterpreter({
  onNodeVisit: (node, depth) => collector.onNodeVisit(node, depth),
  onFunctionCall: (name, args, node) => collector.onFunctionCall(name, args, node),
  onVariableAccess: (name, type, value) => collector.onVariableAccess(name, type, value),
  onModuleResolve: (from, requested, resolved) => collector.onModuleResolve(from, requested, resolved),
  onBranch: (type, condition, result, node) => collector.onBranch(type, condition, result, node),
  onPipeline: (operator, input, output, node) => collector.onPipeline(operator, input, output, node),
  onError: (error, node) => collector.onError(error, node)
});

// Execute with metadata collection
collector.onExecutionStart();
await interpreter.execute(code);
collector.onExecutionEnd();

// Query metadata
const metadata = collector.getMetadata();
```

### Available Metadata

#### Compilation Phase
- Token stream with types and counts
- AST/CST node statistics and depth
- Parse timing and errors
- Source location mapping

#### Interpretation Phase
- Module resolution tracking (success/failure)
- Symbol tables (variables, functions, classes)
- Import/export dependencies
- Scope chain information

#### Execution Phase
- Function call tracking with stack depth
- Variable read/write access patterns
- Control flow branches taken
- Pipeline operation transformations
- Loop iteration counts
- Error tracking with context

#### Runtime Data
- Current execution position (line/column)
- Live variable values
- Execution path history
- Event stream with timestamps

### Query Methods

```javascript
// Performance analysis
const hotFunctions = metadata.getHotFunctions(10);      // Top 10 most called functions
const hotVariables = metadata.getHotVariables(10);      // Top 10 most accessed variables

// Execution insights
const executionPath = metadata.getExecutionPath(100);   // Last 100 lines executed
const callStack = metadata.getCallStack();              // Current call stack
const currentState = metadata.getCurrentState();        // Current position and variables

// Summaries
const compilationSummary = metadata.getCompilationSummary();
const interpretationSummary = metadata.getInterpretationSummary();
const executionSummary = metadata.getExecutionSummary();

// Dependency analysis
const depGraph = metadata.getDependencyGraph();         // Module dependency graph

// Export for external tools
const json = collector.export();                        // Full metadata as JSON
```

### Use Cases

1. **Performance Profiling**: Identify hot functions and bottlenecks
2. **Debugging**: Track execution flow and variable changes
3. **Code Coverage**: Analyze which code paths are executed
4. **Dependency Analysis**: Understand module relationships
5. **Error Diagnosis**: Get full context when errors occur
6. **Development Tools**: Build custom debuggers and profilers

---

*This document covers Wang Language v1.0.0 with 100% test coverage (90/90 tests passing). For implementation details, see source code and test suite.*