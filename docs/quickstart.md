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

// Create interpreter with custom functions
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
    fetch: fetch,
    querySelector: (sel) => document.querySelector(sel)
  }
});

// Execute Wang code
const result = await interpreter.execute(`
  let message = "Hello, Wang!";
  log(message);
  message
`);

console.log(result); // "Hello, Wang!"
```

## Pipeline Operators

Wang supports elegant data flow with pipeline operators:

```javascript
const result = await interpreter.execute(`
  const data = [1, 2, 3, 4, 5];
  
  data
    |> filter(_, n => n > 2)
    |> map(_, n => n * 2)
    |> reduce(_, (sum, n) => sum + n, 0)
`);
// Result: 24 (6 + 8 + 10)
```

## Classes and Inheritance

```javascript
const result = await interpreter.execute(`
  class Vehicle {
    constructor(type) {
      this.type = type
    }
    
    describe() {
      return "This is a " + this.type
    }
  }
  
  class Car extends Vehicle {
    constructor(brand, model) {
      super("car");
      this.brand = brand;
      this.model = model
    }
    
    describe() {
      return super.describe() + ": " + this.brand + " " + this.model
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
    return "Hello, " + name + "!"
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
        await wait(1000)
      })
`);
```

## Advanced Language Features

### Variable Declarations with Proper Scoping

Wang supports all JavaScript variable types with proper scoping semantics:

```javascript
await interpreter.execute(`
  // Block-scoped variables
  let mutable = 10;
  const immutable = 20;
  
  // Function-scoped with hoisting
  console.log(typeof x); // "undefined" (hoisted but not initialized)
  var x = 42;
  console.log(x); // 42
  
  // Block scoping with shadowing
  let outer = 1;
  {
    let outer = 2; // Shadows outer variable
    console.log(outer); // 2
  }
  console.log(outer); // 1
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