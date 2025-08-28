# Return Values in Wang Language

## Overview

The Wang interpreter returns the value of the last evaluated expression in a program. This follows the pattern of many scripting languages and REPLs where the final expression becomes the implicit return value.

## How It Works

When you execute Wang code using `interpreter.execute(code)`, the interpreter:
1. Parses and executes all statements in order
2. Keeps track of the last evaluated value
3. Returns that value as the result of execution

## Examples

### Simple Expression Return

```javascript
const result = await interpreter.execute(`
  let x = 5;
  let y = 10;
  
  // Compound assignment (NEW in v0.6.2!)
  x += y;     // x becomes 15
  x *= 2;     // x becomes 30
  
  x  // Last expression becomes return value
`);
// result = 30
```

The last line `x` is an expression that evaluates to `30`, which becomes the return value.

### Declaration Returns Undefined

```javascript
const result = await interpreter.execute(`
  let x = 5;
  let y = 10;
  let z = x + y  // Variable declaration
`);
// result = undefined
```

Declarations (variable, function, class) return `undefined` when they are the last statement.

### Function Call Results

```javascript
const result = await interpreter.execute(`
  function calculate(a, b) {
    return a * b + 10
  };
  
  let x = 5;
  calculate(x, 3)  // Last expression
`);
// result = 25
```

### Object and Array Literals with Standard Library

```javascript
const result = await interpreter.execute(`
  let name = "Wang";
  let version = "0.6.2";
  let features = ["Compound Assignment", "70+ Stdlib Functions", "Pipeline Operators"];
  
  // Use stdlib functions (no imports needed!)
  let featureCount = features |> count(_);
  let upperFeatures = features |> map(_, f => upper(f));
  
  // Object literal as last expression
  { 
    name, 
    version, 
    active: true,
    featureCount,
    features: upperFeatures,
    id: uuid()  // Built-in UUID generation
  }
`);
// result = { 
//   name: "Wang", 
//   version: "0.6.2", 
//   active: true, 
//   featureCount: 3,
//   features: ["COMPOUND ASSIGNMENT", "70+ STDLIB FUNCTIONS", "PIPELINE OPERATORS"],
//   id: "123e4567-e89b-12d3-a456-426614174000"
// }
```

### Pipeline Operations with Standard Library

```javascript
const result = await interpreter.execute(`
  let numbers = [3, 1, 4, 1, 5, 9, 2, 6];
  
  // Comprehensive pipeline using stdlib functions
  numbers
    |> unique(_)              // Remove duplicates: [3, 1, 4, 5, 9, 2, 6]
    |> sort(_)                // Sort: [1, 2, 3, 4, 5, 6, 9]
    |> filter(_, n => n > 3)  // Filter: [4, 5, 6, 9]
    |> map(_, n => n * n)     // Square: [16, 25, 36, 81]
    |> sum(_)                 // Sum: 158
`);
// result = 158
```

### Conditional Expressions and Operators

```javascript
const result = await interpreter.execute(`
  let x = 10;
  
  // Increment operators (NEW feature!)
  let y = x++;    // Post-increment: y = 10, x = 11
  let z = ++x;    // Pre-increment: z = 12, x = 12
  
  // Ternary expression with compound assignment
  let status = x > 10 ? "high" : "low";
  
  // Nested ternary
  let category = x > 15 ? "very high" : (x > 10 ? "high" : "normal");
  
  { x, y, z, status, category }  // Return object with all values
`);
// result = { x: 12, y: 10, z: 12, status: "high", category: "high" }
```

### Loop Results

```javascript
const result = await interpreter.execute(`
  let sum = 0;
  for (let i = 1; i <= 5; i++) {
    sum = sum + i;
  };
  sum  // Return the accumulated sum
`);
// result = 15
```

## Important Notes

1. **Semicolons**: Wang requires semicolons after certain statements (like blocks, function declarations, loops) when they're not the last statement in the program.

2. **Empty Programs**: An empty program or a program with no statements returns `undefined`.

3. **Module Exports**: In module contexts, use explicit `export` statements. The last expression value is separate from module exports.

## Use Cases

This feature is particularly useful for:

- **REPL-style evaluation**: Quick calculations and testing
- **Configuration scripts**: Return configuration objects
- **Data transformation**: Process and return transformed data
- **Template evaluation**: Generate and return content
- **Workflow results**: Return the final result of a workflow

## Integration Example

```javascript
import { WangInterpreter } from 'wang-lang';

// Create interpreter with custom functions (stdlib functions automatic!)
const interpreter = new WangInterpreter({
  functions: {
    fetch: fetch,
    getCurrentTime: () => new Date().toISOString()
  }
});

// Execute a workflow and get the result
const workflowResult = await interpreter.execute(`
  const data = [1, 2, 3, 4, 5];
  
  // Use stdlib functions (no imports needed)
  let processed = data |> map(_, x => x * 2);  // Double each value
  let stats = {
    sum: sum(processed),      // Built-in sum function
    avg: avg(processed),      // Built-in average function
    max: max(...processed)    // Built-in max function
  };
  
  // Compound assignment for additional processing
  let multiplier = 1;
  multiplier *= 10;  // Compound assignment: multiplier = 10
  
  // This object becomes the return value
  {
    original: data,
    processed: processed,
    stats: stats,
    multiplier: multiplier,
    timestamp: getCurrentTime(),
    id: uuid()  // Built-in UUID generator
  }
`);

console.log(workflowResult);
// { 
//   original: [1,2,3,4,5], 
//   processed: [2,4,6,8,10], 
//   stats: { sum: 30, avg: 6, max: 10 },
//   multiplier: 10,
//   timestamp: "2023-12-01T10:30:00.000Z", 
//   id: "123e4567-e89b-12d3-a456-426614174000"
// }
```

This pattern makes Wang scripts behave like functions that implicitly return their last computed value, making them composable and easy to integrate into larger applications.