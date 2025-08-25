# Quick Start

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
  
  // Process each button
  for (let btn of buttons) {
    let text = getText(btn);
    if (text === "Submit") {
      click(btn);
      await wait(1000)
    }
  }
`);