# Quick Start

Wang is a modern workflow programming language designed for browser automation and data transformation. It features JavaScript-like syntax with CSP-safe execution, making it perfect for Chrome service workers and restricted environments.

## Installation

```bash
npm install wang-lang
```

## Basic Usage

```javascript
import { WangInterpreter, InMemoryModuleResolver } from 'wang-lang';

// Create a module resolver
const resolver = new InMemoryModuleResolver();

// Create interpreter - 70+ stdlib functions are automatically available!
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  // Add custom functions if needed (stdlib already includes filter, map, etc.)
  functions: {
    fetch: fetch,
    querySelector: (sel) => document.querySelector(sel)
  }
});

// Execute Wang code with compound assignment
const result = await interpreter.execute(`
  let counter = 10;
  counter += 5;           // Compound assignment
  counter *= 2;           // More compound assignment
  
  let message = \`Counter is: \${counter}\`;
  log(message);           // Built-in log function
  
  // Last expression becomes return value
  { counter, message }
`);

console.log(result); // { counter: 30, message: "Counter is: 30" }
```

## Pipeline Operators

Wang supports elegant data flow with pipeline operators and rich stdlib functions:

```javascript
const result = await interpreter.execute(`
  // Array operations with stdlib functions (no imports needed!)
  let numbers = [3, 1, 4, 1, 5, 9, 2, 6];
  
  // Pipeline with built-in functions
  numbers
    |> unique(_)          // Remove duplicates: [3, 1, 4, 5, 9, 2, 6]
    |> sort(_)            // Sort: [1, 2, 3, 4, 5, 6, 9]
    |> filter(_, n => n > 3)  // Filter: [4, 5, 6, 9]
    |> map(_, n => n * 2)     // Double: [8, 10, 12, 18]
    |> sum(_)                 // Sum: 48
`);
// Result: 48

// Object operations with stdlib
const users = await interpreter.execute(`
  let data = [
    { name: "Alice", age: 30, active: true },
    { name: "Bob", age: 25, active: false },
    { name: "Charlie", age: 35, active: true }
  ];
  
  data
    |> filter(_, u => u.active)     // Only active users
    |> sort_by(_, "age")            // Sort by age
    |> map(_, u => pick(u, ["name", "age"]))  // Select fields
`);
// Result: [{ name: "Alice", age: 30 }, { name: "Charlie", age: 35 }]
```

## Classes and Inheritance

```javascript
const result = await interpreter.execute(`
  class Vehicle {
    constructor(type) {
      this.type = type;
    }
    
    describe() {
      return "This is a " + this.type;
    }
  }
  
  class Car extends Vehicle {
    constructor(brand, model) {
      super("car");
      this.brand = brand;
      this.model = model;
    }
    
    describe() {
      return super.describe() + ": " + this.brand + " " + this.model;
    }
  }
  
  const myCar = new Car("Toyota", "Camry");
  myCar.describe()
`);
// Result: "This is a car: Toyota Camry"
```

## Modules

Create reusable modules:

```javascript
// Add a module
resolver.addModule('utils', `
  export function greet(name) {
    return "Hello, " + name + "!";
  }
  
  export const VERSION = "1.0.0";
`);

// Use the module
const result = await interpreter.execute(`
  import { greet, VERSION } from "utils";
  
  greet("World") + " (v" + VERSION + ")"
`);
// Result: "Hello, World! (v1.0.0)"
```

## Standard Library (70+ Functions)

Wang includes a comprehensive standard library with 70+ built-in functions. All functions are immutable and pipeline-friendly:

```javascript
// Array operations - no imports needed!
await interpreter.execute(`
  let numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
  
  // Core array functions
  let processed = numbers
    |> unique(_)              // Remove duplicates
    |> sort(_)                // Sort ascending  
    |> chunk(_, 3)            // Group into chunks of 3
    |> flatten(_)             // Flatten back to array
    |> partition(_, n => n > 4)  // Split into [>4, <=4]
  
  // Math operations
  let stats = {
    sum: sum(numbers),        // Sum all numbers
    avg: avg(numbers),        // Average
    median: median(numbers),  // Median value
    min: min(...numbers),     // Minimum
    max: max(...numbers)      // Maximum
  };
  
  // String operations
  let text = "  Hello World  "
    |> trim(_)                // "Hello World"
    |> upper(_)               // "HELLO WORLD"  
    |> replace_all(_, "O", "0") // "HELL0 W0RLD"
    |> split(_, " ")          // ["HELL0", "W0RLD"]
    |> join(_, "-")           // "HELL0-W0RLD"
  
  // Object operations
  let user = { 
    name: "Alice", 
    age: 30, 
    email: "alice@example.com",
    password: "secret123" 
  };
  
  let publicData = pick(user, ["name", "age"]);     // Select fields
  let withoutSecret = omit(user, ["password"]);     // Remove fields
  let merged = merge(user, { location: "NYC" });    // Merge objects
  
  // Type checking
  let types = {
    isArray: is_array([1, 2, 3]),      // true
    isObject: is_object({}),           // true
    isEmpty: is_empty([]),             // true
    isString: is_string("hello")       // true
  };
  
  // Utilities
  let utils = {
    id: uuid(),                        // Generate UUID
    range: range(5),                   // [0, 1, 2, 3, 4]
    encoded: encode_base64("hello"),   // Base64 encode
    json: to_json({ a: 1, b: 2 })     // JSON stringify
  };
  
  log({ processed, stats, text, publicData, types, utils });
`);
```

### Complete Standard Library Reference

**Array Operations:**
- `filter`, `map`, `reduce`, `forEach`, `find`, `some`, `every`
- `sort`, `sort_by`, `reverse`, `unique`, `unique_by`  
- `chunk`, `flatten`, `zip`, `partition`, `compact`
- `slice`, `concat`, `join`, `includes`, `indexOf`

**Object Operations:**
- `pick`, `omit`, `merge`, `clone`, `keys`, `values`, `entries`
- `get`, `set`, `has` (for nested property access)

**String Operations:**
- `upper`, `lower`, `capitalize`, `trim`
- `split`, `join`, `replace_all`, `starts_with`, `ends_with`, `truncate`

**Math Operations:**
- `sum`, `avg`, `median`, `min`, `max`, `clamp`, `random_int`
- `abs`, `ceil`, `floor`, `round`, `pow`, `sqrt`

**Type Checking:**
- `is_array`, `is_object`, `is_string`, `is_number`, `is_boolean`, `is_null`, `is_empty`

**Utilities:**
- `count`, `find_index`, `range`, `uuid`, `sleep`
- `to_json`, `from_json`, `encode_base64`, `decode_base64`
- `log`, `error`, `warn` (console functions)

## Browser Automation Example

```javascript
const interpreter = new WangInterpreter({
  functions: {
    querySelectorAll: (sel) => [...document.querySelectorAll(sel)],
    click: (el) => el.click(),
    getText: (el) => el.innerText,
    wait: (ms) => new Promise(r => setTimeout(r, ms))
  }
});

await interpreter.execute(`
  // Find all buttons
  let buttons = querySelectorAll("button");
  
  // Process each button with pipeline
  buttons
    |> filter(_, btn => getText(btn) === "Submit")
    |> forEach(_, btn => {
        click(btn);
        await wait(1000);
      })
`);
```

## Advanced Language Features

### Modern JavaScript Operators

Wang supports all modern JavaScript operators with proper semantics:

```javascript
await interpreter.execute(`
  // Variable declarations with proper scoping
  let mutable = 10;
  const immutable = 20;
  var hoisted = 30;
  
  // Compound assignment operators (NEW in v0.6.2!)
  mutable += 5;           // Addition assignment: 15
  mutable -= 2;           // Subtraction assignment: 13  
  mutable *= 3;           // Multiplication assignment: 39
  mutable /= 2;           // Division assignment: 19.5
  
  // Increment and decrement operators
  let counter = 0;
  let a = counter++;      // Post-increment: a = 0, counter = 1
  let b = ++counter;      // Pre-increment: b = 2, counter = 2
  let c = counter--;      // Post-decrement: c = 2, counter = 1
  let d = --counter;      // Pre-decrement: d = 0, counter = 0
  
  // Ternary conditional operator
  let status = counter > 0 ? "positive" : "zero or negative";
  let nested = condition ? (nested ? 1 : 2) : 3;
  
  // Optional chaining and nullish coalescing
  let obj = { a: { b: { c: 42 } } };
  let value = obj.a?.b?.c ?? "default";  // 42
  let missing = obj.x?.y?.z ?? "not found";  // "not found"
  
  log({ mutable, counter, status, value, missing });
`);
```

### Functions and Closures

Full support for function features including closures and recursion:

```javascript
await interpreter.execute(`
  // Higher-order functions with closures
  function createMultiplier(factor) {
    return function(x) {
      return x * factor;
    };
  }
  
  const double = createMultiplier(2);
  const triple = createMultiplier(3);
  
  console.log(double(5)); // 10
  console.log(triple(5)); // 15
  
  // Mutual recursion
  function isEven(n) {
    if (n === 0) return true;
    return isOdd(n - 1);
  }
  
  function isOdd(n) {
    if (n === 0) return false;
    return isEven(n - 1);
  }
  
  console.log(isEven(4)); // true
  console.log(isOdd(4));  // false
`);
```

### Arrow Functions with Proper `this` Binding

```javascript
await interpreter.execute(`
  class Calculator {
    constructor() {
      this.result = 0;
    }
    
    add(x) {
      this.result += x;
      return this;
    }
    
    // Arrow functions preserve 'this'
    getSquared() {
      return (() => this.result * this.result)();
    }
  }
  
  const calc = new Calculator();
  console.log(calc.add(5).getSquared()); // 25
`);
```

### Object-Oriented Programming

Full class support with inheritance, static methods, getters/setters:

```javascript
await interpreter.execute(`
  class Shape {
    constructor(name) {
      this.name = name;
    }
    
    static getShapeCount() {
      return Shape.count || 0;
    }
    
    describe() {
      return "A " + this.name;
    }
  }
  
  class Circle extends Shape {
    constructor(radius) {
      super("circle");
      this.radius = radius;
    }
    
    get area() {
      return Math.PI * this.radius * this.radius;
    }
    
    set radius(value) {
      if (value < 0) throw "Radius cannot be negative";
      this._radius = value;
    }
    
    describe() {
      return super.describe() + " with radius " + this.radius;
    }
  }
  
  const circle = new Circle(5);
  console.log(circle.describe()); // "A circle with radius 5"
  console.log(circle.area); // ~78.54
`);
```

### Destructuring and Spread Operators

Modern JavaScript destructuring patterns:

```javascript
await interpreter.execute(`
  // Object destructuring with nested patterns
  const person = {
    name: "Alice",
    address: {
      city: "Boston",
      coordinates: { lat: 42.3601, lng: -71.0589 }
    }
  };
  
  const { name, address: { city, coordinates: { lat } } } = person;
  console.log(name, city, lat); // "Alice Boston 42.3601"
  
  // Array destructuring with rest
  const [first, second, ...rest] = [1, 2, 3, 4, 5];
  console.log(first, second, rest); // 1 2 [3, 4, 5]
  
  // Rest parameters in functions
  function sum(...numbers) {
    return numbers.reduce((acc, n) => acc + n, 0);
  }
  
  console.log(sum(1, 2, 3, 4)); // 10
  console.log(sum(...[5, 6, 7])); // 18
`);
```

### Template Literals and Modern Operators

```javascript
await interpreter.execute(`
  const name = "Wang";
  const version = "1.0.0";
  
  // Template literals with expressions
  const message = \`Welcome to \${name} v\${version}!\`;
  console.log(message); // "Welcome to Wang v1.0.0!"
  
  // Optional chaining and nullish coalescing
  const obj = { a: { b: { c: 42 } } };
  console.log(obj.a?.b?.c); // 42
  console.log(obj.x?.y?.z); // undefined
  console.log(obj.missing ?? "default"); // "default"
  
  // Type coercion and comparisons
  console.log("5" == 5);    // true
  console.log("5" === 5);   // false
  console.log(null ?? "default"); // "default"
`);
```

### Control Flow - Advanced

```javascript
await interpreter.execute(`
  // Switch statements with fall-through
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
  
  // Do-while loops
  let i = 0;
  let sum = 0;
  do {
    sum += i++;
  } while (i < 5);
  console.log(sum); // 10
  
  // Nested loops with labeled break/continue
  outer: for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) {
        break outer;
      }
      console.log(i, j);
    }
  }
`);
```

### Async/Await Support

Full asynchronous programming support:

```javascript
await interpreter.execute(`
  async function fetchData() {
    try {
      const response = await fetch("https://api.example.com/data");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Fetch failed:", error.message);
      throw error;
    } finally {
      console.log("Cleanup completed");
    }
  }
  
  // Parallel processing
  async function processParallel(urls) {
    const promises = urls.map(url => fetch(url));
    const responses = await Promise.all(promises);
    return responses.map(r => r.json());
  }
`);
```

### Error Handling

Comprehensive error handling with try/catch/finally:

```javascript
await interpreter.execute(`
  function riskyOperation() {
    throw new Error("Something went wrong");
  }
  
  try {
    riskyOperation();
  } catch (e) {
    console.log("Caught error:", e.message);
    // Handle error gracefully
  } finally {
    console.log("Cleanup always runs");
  }
`);
```

### Module System with Resolvers

Advanced module resolution strategies:

```javascript
// Create composite resolver with fallback
import { CompositeModuleResolver, HTTPModuleResolver, IndexedDBModuleResolver } from 'wang-lang';

const resolver = new CompositeModuleResolver([
  new IndexedDBModuleResolver(), // Try local storage first
  new HTTPModuleResolver()       // Fallback to HTTP
]);

const interpreter = new WangInterpreter({ moduleResolver: resolver });

// Use modules with namespace imports
await interpreter.execute(`
  import * as MathUtils from "https://cdn.example.com/math-utils.js";
  import { processData } from "local-storage://data-processor";
  
  const result = MathUtils.add(5, 3);
  const processed = processData(result);
`);