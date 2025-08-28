# Wang Language Reference - The Black Book

**Version:** 0.10.1  
**Test Coverage:** 507/509 tests (99.6%)  
**CSP Safe:** ✅ No eval(), new Function()  
**New in 0.10.1:** 🔧 Direct JavaScript object injection via setVariable()  
**New in 0.9.0:** 🔍 Full Regular Expression Support  

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
let mutable = 10
const immutable = 20
const PI = 3.14159 // Enforced immutability

// Function-scoped with hoisting (var)
console.log(typeof x) // "undefined" (hoisted, not initialized)
var x = 42

// Block scoping with shadowing
let outer = 1
{
  let outer = 2 // Shadows outer
  const inner = 3
} // inner not accessible here
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
  return a + b
}

// Function expressions
const multiply = function(x, y) { return x * y }

// Named function expressions (for recursion)
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1)
}
```

#### Arrow Functions
```javascript
const square = x => x * x
const sum = (a, b) => a + b
const complex = (x, y) => {
  const result = x * y
  return result + 1
}

// Lexical 'this' binding
class Calculator {
  constructor() { this.value = 0 }
  
  add(x) {
    const operation = () => this.value = this.value + x // Preserves 'this'
    operation()
    return this
  }
}
```

#### Rest Parameters & Spread
```javascript
function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0)
}

const arr = [1, 2, 3]
sum(...arr) // Spread in call
```

#### Closures
```javascript
function createCounter(start = 0) {
  let count = start
  return function() {
    count = count + 1
    return count
  }
}

const counter = createCounter(5)
counter() // 6
counter() // 7
```

### Classes & OOP

#### Class Definition
```javascript
class Animal {
  constructor(name, species) {
    this.name = name
    this.species = species
  }
  
  // Instance method
  speak() {
    return `${this.name} makes a sound`
  }
  
  // Get info as regular method
  getInfo() {
    return `${this.name} is a ${this.species}`
  }
  
  // Set name as regular method
  setName(newName) {
    if (!newName) throw "Name cannot be empty"
    this.name = newName
  }
}
```

#### Inheritance
```javascript
class Dog extends Animal {
  constructor(name, breed) {
    super(name, "dog") // Call parent constructor
    this.breed = breed
  }
  
  speak() {
    return `${this.name} barks` // Override parent method
  }
  
  getBreed() {
    return this.breed
  }
}

const dog = new Dog("Rex", "German Shepherd")
dog.speak() // "Rex barks"
dog.getInfo() // "Rex is a dog"
```

#### Method Chaining
```javascript
class StringBuilder {
  constructor() { this.str = "" }
  
  append(text) {
    this.str = this.str + text
    return this // Enable chaining
  }
  
  prepend(text) {
    this.str = text + this.str
    return this
  }
  
  toString() { return this.str }
}

const result = new StringBuilder()
  .append("World")
  .prepend("Hello ")
  .toString() // "Hello World"
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

// Ternary operator (conditional expression)
const result = condition ? value1 : value2

// Complex ternary chains
const classify = n => 
  n > 100 ? "huge" :
  n > 50 ? "large" :
  n > 10 ? "small" : "tiny"
```

#### Complex Conditionals
```javascript
function getDayType(day) {
  // Use if-else chains instead of switch statements
  if (day === "Monday" || day === "Tuesday" || 
      day === "Wednesday" || day === "Thursday" || 
      day === "Friday") {
    return "Weekday"
  }
  if (day === "Saturday" || day === "Sunday") {
    return "Weekend"
  }
  return "Invalid"
}
```

#### Loops
```javascript
// For loop (no increment operators)
for (let i = 0; i < 10; i = i + 1) {
  if (i === 5) break
  if (i === 2) continue
  console.log(i)
}

// For-of (iterables) - recommended for objects
for (let item of array) {
  console.log(item)
}

// Object iteration with for-of
for (let [key, value] of Object.entries(obj)) {
  console.log(key, value)
}
for (let key of Object.keys(obj)) {
  console.log(key)
}

// While loop
let i = 0
while (i < 5) {
  console.log(i)
  i = i + 1
}

// Do-while loop
do {
  console.log(i)
  i = i - 1
} while (i > 0)
```

#### Labeled Statements
```javascript
outer: for (let i = 0; i < 3; i = i + 1) {
  for (let j = 0; j < 3; j = j + 1) {
    if (i === 1 && j === 1) {
      break outer // Break out of both loops
    }
    console.log(i, j)
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
obj && obj.method()    // Call only if obj exists
result = fallback || computeExpensive()
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

// Manual increment (no ++ or -- operators)
let x = 5
x = x + 1  // Simple increment: x becomes 6
x = x + 1  // x becomes 7
```

### Pipeline Operators

#### Pipe Operator (`|>`)
Passes result as first argument with `_` placeholder:

```wang
[1, 2, 3, 4, 5]
  |> filter(_, n => n > 2)     // [3, 4, 5]
  |> map(_, n => n * 2)        // [6, 8, 10]
  |> reduce(_, (sum, n) => sum + n, 0) // 24

// Method chaining with pipe
data
  |> processor.filter(_)
  |> processor.transform(_)
  |> processor.validate(_)
```

#### Arrow Operator (`->`)
Passes result to function or operation:

```wang
[1, 2, 3]
  |> map(_, n => n * 2)
  -> store.save("results")     // Save to store
  -> log("Saved successfully") // Log message

// Function composition
value
  |> transform(_)
  -> validate
  -> save
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
const arr = [1, 2, 3]
arr[0]           // Access
arr.push(4)      // Modify
arr.length       // Property

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
  method() { return this.key },
  [computed]: dynamicValue
}

obj.key          // Dot notation
obj["key"]       // Bracket notation
obj.newProp = 42 // Assignment

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
}

// Basic destructuring
const { name, age } = person

// Nested destructuring
const { name, address: { city, coordinates: { lat } } } = person

// Renaming
const { name: fullName, age: years } = person

// Default values
const { name, country = "USA" } = person
```

#### Array Destructuring
```javascript
const numbers = [1, 2, 3, 4, 5]

// Basic destructuring
const [first, second] = numbers

// Skipping elements
const [a, , , d] = numbers // a=1, d=4

// Rest pattern
const [head, ...tail] = numbers // head=1, tail=[2,3,4,5]

// Nested arrays
const nested = [[1, 2], [3, 4]]
const [[a, b], [c, d]] = nested
```

### Template Literals

```javascript
const name = "Wang"
const version = "1.0.0"

// Expression interpolation
const message = `Welcome to ${name} v${version}!`

// Multi-line strings
const multiLine = `
  Line 1
  Line 2
  ${expression}
`

// Nested template literals
const nested = `Outer: "${`Inner: ${value}`}"`;
```

### Regular Expression Literals

**New in v0.9.0** - Wang now supports full regular expression literals with all JavaScript flags:

```javascript
// Basic regex patterns
const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
const phoneRegex = /\(\d{3}\)\s\d{3}-\d{4}/;
const wordBoundary = /\b\w+\b/g;

// All JavaScript flags supported
const globalSearch = /pattern/g;           // Global flag
const caseInsensitive = /pattern/i;        // Ignore case
const multiline = /^start.*end$/m;         // Multiline
const dotAll = /start.*end/s;              // Dot matches newlines  
const unicode = /[\u{1F600}-\u{1F64F}]/u;  // Unicode support
const sticky = /pattern/y;                 // Sticky matching

// Complex patterns with escape sequences
const escaped = /\d+\.\d+/;               // Digits with decimal
const newlines = /line1\nline2/;          // Newline characters
const tabs = /column1\tcolumn2/;          // Tab characters

// Regex methods work seamlessly
const text = "Contact: user@domain.com or call (555) 123-4567";
const emails = text.match(/\w+@\w+\.\w+/g);     // ["user@domain.com"]
const hasPhone = /\(\d{3}\)/.test(text);        // true
const cleaned = text.replace(/\d+/g, "XXX");    // Replace digits

// Integration with pipelines
const logData = "ERROR: Failed login\nINFO: Success\nERROR: Timeout";
const errorCount = logData
  |> split(_, /\n/)
  |> filter(_, line => line.match(/ERROR:/))
  |> length(_);  // 2
```

**Division vs Regex Disambiguation:**  
Wang automatically distinguishes between division (`/`) and regex literals using smart pattern recognition:

```javascript
// These are correctly parsed as division
let half = count / 2;
let ratio = (a + b) / (c + d);

// These are correctly parsed as regex
let pattern = /\d+/g;
let emailRegex = /[^@]+@[^@]+/;
```

### Async/Await

#### Promise Handling
```javascript
// Async function declaration
async function fetchData() {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed:", error.message)
    throw error
  } finally {
    console.log("Cleanup completed")
  }
}

// Async arrow function
const processAsync = async (data) => {
  const result = await transform(data)
  return result
}
```

#### Parallel Processing
```javascript
// Sequential processing
async function processSequential(items) {
  const results = []
  for (let item of items) {
    const result = await processItem(item)
    results.push(result)
  }
  return results
}

// Parallel processing
async function processParallel(items) {
  const promises = items.map(item => processItem(item))
  return await Promise.all(promises)
}
```

### Error Handling

#### Try-Catch-Finally
```javascript
try {
  riskyOperation()
} catch (error) {
  console.error("Caught:", error.message)
  // Handle error
} finally {
  console.log("Always executed")
}

// Try-finally without catch (supported)\ntry {\n  riskyOperation()\n} finally {\n  cleanup()\n}\n\n// Nested error handling
try {
  try {
    innerOperation()
  } catch (innerError) {
    console.log("Inner error:", innerError)
    throw new Error("Outer error")
  } finally {
    console.log("Inner cleanup")
  }
} catch (outerError) {
  console.log("Outer error:", outerError.message)
} finally {
  console.log("Outer cleanup")
}
```

#### Error Objects
```javascript
// Creating errors
throw new Error("Something went wrong")
throw "String error" // Also supported

// Error properties
try {
  throw new Error("Custom message")
} catch (e) {
  console.log(e.message) // "Custom message"
  console.log(e.name)    // "Error"
}
```

### Module System

#### Export Syntax
```javascript
// Named exports
export function processData(data) {
  return data.filter(item => item.active)
}

export const VERSION = "1.0.0"

export class DataProcessor {
  process(data) { return data }
}

// Multiple exports
function helper1() { return "help1" }
function helper2() { return "help2" }
export { helper1, helper2 }
```

#### Import Syntax
```javascript
// Named imports
import { processData, VERSION } from "data-utils"
import { helper1, helper2 } from "helpers"

// Namespace import
import * as Utils from "utilities"
Utils.processData(data)
Utils.VERSION

// Importing from different resolvers
import { fetchAPI } from "http://cdn.example.com/api.js"
import { localData } from "indexeddb://local-storage"
```

#### Module Resolvers

##### In-Memory Resolver
```javascript
const resolver = new InMemoryModuleResolver();
resolver.addModule("math", `
  export function add(a, b) { return a + b }
  export function multiply(a, b) { return a * b }
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

## Standard Library (New in v0.6.0!)

Wang includes 70+ built-in functions that are automatically available globally - no imports needed! All functions follow snake_case naming, are immutable, and work seamlessly with pipeline operators.

### Array Operations

#### Sorting & Ordering
```javascript
sort_by(arr, key?)         // Sort by property or function
reverse(arr)               // Reverse array order
```

#### Filtering & Uniqueness  
```javascript
unique(arr)                // Remove duplicates
unique_by(arr, key)        // Remove duplicates by property/function
partition(arr, predicate)  // Split into [truthy, falsy] arrays
```

#### Grouping & Chunking
```javascript
group_by(arr, key)         // Group into object by key
chunk(arr, size)           // Split into chunks of size
zip(...arrays)             // Combine arrays element-wise
```

#### Flattening & Nesting
```javascript
flatten(arr, depth?)       // Flatten nested arrays
compact(arr)               // Remove null/undefined values
```

#### Accessing Elements
```javascript
first(arr, n?)             // Get first element(s)
last(arr, n?)              // Get last element(s) 
take(arr, n)               // Take first n elements
drop(arr, n)               // Drop first n elements
at(arr, index)             // Safe array access with negative indexing
```

### Object Operations

#### Property Access
```javascript
keys(obj)                  // Get object keys
values(obj)                // Get object values
entries(obj)               // Get [key, value] pairs
has(obj, key)              // Check if key exists
```

#### Object Transformation
```javascript
pick(obj, keys)            // Select specific keys
omit(obj, keys)            // Remove specific keys
merge(...objects)          // Deep merge objects
clone(obj)                 // Deep clone object
```

#### Deep Operations
```javascript
get(obj, path, default?)   // Get nested value by path
set(obj, path, value)      // Set nested value (returns new object)
```

### String Operations

#### Case Transformation
```javascript
upper(str)                 // Convert to uppercase
lower(str)                 // Convert to lowercase
capitalize(str)            // Capitalize first letter
```

#### Trimming & Padding
```javascript
trim(str)                  // Remove whitespace from both ends
trim_start(str)            // Remove whitespace from start
trim_end(str)              // Remove whitespace from end
pad_start(str, len, char?) // Pad string start
pad_end(str, len, char?)   // Pad string end
truncate(str, len, suffix?)// Truncate with suffix
```

#### String Utilities
```javascript
split(str, sep)            // Split string into array
join(arr, sep)             // Join array into string
replace_all(str, find, rep)// Replace all occurrences
starts_with(str, search)   // Check if starts with
ends_with(str, search)     // Check if ends with
includes(str, search)      // Check if contains
```

### Type Checking

```javascript
is_array(val)              // Check if array
is_object(val)             // Check if object (not array/null)
is_string(val)             // Check if string
is_number(val)             // Check if number
is_boolean(val)            // Check if boolean
is_null(val)               // Check if null
is_empty(val)              // Check if empty ([], {}, "", null, undefined)

// Note: For undefined checking, use: val === undefined
```

### Math Operations

#### Aggregations
```javascript
sum(arr)                   // Sum of numbers
avg(arr)                   // Average of numbers
min(arr)                   // Minimum value
max(arr)                   // Maximum value
median(arr)                // Median value
```

#### Number Operations
```javascript
abs(n)                     // Absolute value
floor(n)                   // Floor value
ceil(n)                    // Ceiling value
round(n, decimals?)        // Round to decimals
clamp(n, min, max)         // Clamp value between min and max
```

### Functional Utilities

#### Collection Operations
```javascript
count(arr, predicate?)     // Count elements (matching predicate)
find(arr, predicate)       // Find first matching element
find_index(arr, predicate) // Find index of first match
every(arr, predicate)      // Check if all match
some(arr, predicate)       // Check if any match
```

#### Data Transformation
```javascript
map(arr, fn)               // Transform each element
filter(arr, fn)            // Keep matching elements
reduce(arr, fn, initial)   // Reduce to single value
for_each(arr, fn)          // Execute function for each
```

### Utility Functions

#### Data Generation
```javascript
range(start, end?, step?)  // Generate number range
uuid()                     // Generate UUID v4
random_int(min, max)       // Random integer between min and max
```

#### JSON Operations
```javascript
to_json(val)               // Convert to JSON string
from_json(str)             // Parse JSON string
```

#### Async Utilities
```javascript
sleep(ms)                  // Async delay (returns Promise)
wait(ms)                   // Alias for sleep
```

#### Encoding
```javascript
encode_base64(str)         // Encode string to base64
decode_base64(str)         // Decode base64 to string
```

### Examples

#### Data Pipeline
```javascript
// Process user data
users
  |> filter(_, user => user.active)
  |> unique_by(_, "email")
  |> sort_by(_, "created_at")
  |> map(_, user => pick(user, ["id", "name", "email"]))
  |> take(_, 10)
```

#### Object Manipulation
```javascript
// Deep object operations
let config = {
  server: {
    host: "localhost",
    port: 3000
  }
}

let prod = config
  |> set(_, "server.host", "api.example.com")
  |> set(_, "server.port", 443)
  |> merge(_, { ssl: true })
```

#### String Processing
```javascript
// Clean and format text
"  Hello WORLD  "
  |> trim
  |> lower
  |> capitalize
  |> replace_all(_, "world", "Wang")
// Result: "Hello wang"
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
  let data = [1, 2, 3]
  data |> map(_, x => x * 2) |> reduce(_, (sum, x) => sum + x, 0)
`);
console.log(result); // 12
```

### JavaScript Interoperability

#### Variable Injection (v0.10.1+)
```javascript
const interpreter = new WangInterpreter();

// Inject JavaScript built-in objects
interpreter.setVariable('Math', Math);
interpreter.setVariable('JSON', JSON);
interpreter.setVariable('Object', Object);
interpreter.setVariable('Array', Array);
interpreter.setVariable('Date', Date);
interpreter.setVariable('RegExp', RegExp);
interpreter.setVariable('console', console);

// Inject custom objects and values
interpreter.setVariable('config', {
  apiURL: 'https://api.example.com',
  timeout: 5000,
  debug: true
});

interpreter.setVariable('myAPI', {
  getUser: (id) => fetch(`/users/${id}`),
  saveData: (data) => localStorage.setItem('data', JSON.stringify(data))
});

// Use in Wang code
await interpreter.execute(`
  let x = Math.sqrt(16)
  let now = Date.now()
  let keys = Object.keys(config)
  console.log("Debug mode:", config.debug)
  
  let userData = myAPI.getUser(123)
`);
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
  let profiles = querySelectorAll(".profile-card")
  let results = []
  
  for (let profile of profiles) {
    let data = {
      name: profile |> querySelector(_, ".name") |> getText(_),
      title: profile |> querySelector(_, ".title") |> getText(_)
    }
    
    // Click save button if profile is active
    let saveBtn = querySelector(profile, ".save-btn")
    if (saveBtn) {
      click(saveBtn)
      await wait(1000) // Rate limiting
    }
    
    results.push(data)
  }
  
  log(\`Processed \${results.length} profiles\`);
  results
`);
```

## Intentionally Unsupported Features

Wang intentionally excludes certain JavaScript features to maintain simplicity, avoid ambiguity, and ensure clean syntax:

### Removed Operators
**Not Supported** - Use explicit assignment:
```javascript
// ❌ Not supported
x++, ++x, x--, --x          // Use: x = x + 1
x += 5, x -= 3, x *= 2      // Use: x = x + 5, x = x - 3, x = x * 2
```

### Removed Statements
**Not Supported** - Use alternatives:
```javascript
// ❌ Switch statements - use if-else chains
switch (value) {
  case 'a': return 1
  case 'b': return 2
}

// ✅ Use if-else instead
if (value === 'a') return 1
if (value === 'b') return 2

// ❌ For-in loops - problematic with prototypes
for (let key in obj) { /* ... */ }

// ✅ Use for-of with Object methods
for (let [key, value] of Object.entries(obj)) { /* ... */ }
for (let key of Object.keys(obj)) { /* ... */ }
```

### Removed Class Features
**Not Supported** - Use conventions/methods:
```javascript
// ❌ Private fields, static methods, getters/setters
class Example {
  #private = 0
  static staticMethod() { }
  get value() { return this._value }
  set value(v) { this._value = v }
}

// ✅ Use conventions and regular methods
class Example {
  constructor() {
    this._private = 0 // Convention: prefix with _
  }
  getValue() { return this._value }
  setValue(v) { this._value = v }
}
// Use module-level functions instead of static methods
```

### Removed Module Features
**Not Supported** - Use named imports/exports:
```javascript
// ❌ Default exports, re-exports
export default function() { }
import fn from "module"
export { item } from "other"

// ✅ Use named imports/exports only
export function fn() { }
import { fn } from "module"
import { item } from "other"
export { item }
```

### Removed Advanced Features
**Not Supported** - Use simpler alternatives:
```javascript
// ❌ Destructuring with defaults in parameters
function fn({ name, age = 18 }) { }

// ✅ Handle defaults manually
function fn(user) {
  const name = user.name
  const age = user.age !== undefined ? user.age : 18
}

// ❌ Async generators, tagged templates
async function* gen() { yield 1 }
const html = tag`template ${value}`

// ✅ Use regular async functions and function calls
async function getData() { return [1, 2] }
const html = tag(["template ", ""], value)
```

### Core Philosophy
Wang follows the principle of **"one way to do things"**:
- **Newlines separate statements** (no semicolons)
- **Simple assignment only** (no compound operators)
- **Clear conditionals** (with ternary operator support)
- **Named imports/exports** (no defaults)
- **Method calls** (no getters/setters)

This reduces cognitive overhead and eliminates common sources of bugs and ambiguity.

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

## Return Values

Wang's interpreter returns the value of the last evaluated expression in a program, making it ideal for REPL usage, workflows, and data transformation scripts.

### How It Works

When executing Wang code with `interpreter.execute(code)`, the interpreter:
1. Parses and executes all statements in order
2. Keeps track of the last evaluated value  
3. Returns that value as the result of execution

### Return Value Rules

| Statement Type | Return Value |
|---------------|--------------|
| Expression | The evaluated value |
| Variable declaration | `undefined` |
| Function declaration | `undefined` |
| Class declaration | `undefined` |
| Empty program | `undefined` |
| Block statement | Value of last expression in block |
| Control flow | Value of executed branch |

### Examples

#### Simple Expression Return
```javascript
const result = await interpreter.execute(`
  let x = 5
  let y = 10
  x + y  // Last expression becomes return value
`);
// result = 15
```

#### Object/Array Construction
```javascript
const config = await interpreter.execute(`
  const env = "production"
  const port = 3000
  
  // This object is returned
  { env, port, debug: false }
`);
// config = { env: "production", port: 3000, debug: false }
```

#### Pipeline Result
```javascript
const processed = await interpreter.execute(`
  [1, 2, 3, 4, 5]
    |> filter(_, n => n > 2)
    |> map(_, n => n * 2)
    |> reduce(_, (sum, n) => sum + n, 0)
`);
// processed = 24
```

#### Workflow Results
```javascript
const workflowResult = await interpreter.execute(`
  const data = fetchData()
  const cleaned = cleanData(data)
  const processed = processData(cleaned)
  
  // Return a summary object
  {
    original: data.length,
    processed: processed.length,
    success: true,
    timestamp: Date.now()
  }
`);
```

### Use Cases

1. **REPL Evaluation**: Quick calculations and testing
2. **Configuration Scripts**: Return configuration objects
3. **Data Transformation**: Process and return transformed data
4. **Template Evaluation**: Generate and return content
5. **Workflow Results**: Return the final result of a workflow
6. **API Responses**: Build and return response objects

---

*This document covers Wang Language v0.6.0 with 100% test coverage (256/256 tests passing). For implementation details, see source code and test suite.*
