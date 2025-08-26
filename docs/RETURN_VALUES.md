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
  x + y
`);
// result = 15
```

The last line `x + y` is an expression that evaluates to `15`, which becomes the return value.

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

### Object and Array Literals

```javascript
const result = await interpreter.execute(`
  let name = "Wang";
  let version = "1.0";
  { name, version, active: true }  // Object literal as last expression
`);
// result = { name: "Wang", version: "1.0", active: true }
```

### Pipeline Operations

```javascript
const result = await interpreter.execute(`
  let start = 5;
  start |> double(_) |> addTen(_)  // Pipeline result is returned
`);
// result = 20 (if double and addTen are defined)
```

### Conditional Expressions

```javascript
const result = await interpreter.execute(`
  let x = 10;
  x > 5 ? "big" : "small"  // Ternary expression
`);
// result = "big"
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

const interpreter = new WangInterpreter({
  functions: {
    fetch: fetch,
    process: (data) => data.map(x => x * 2)
  }
});

// Execute a workflow and get the result
const workflowResult = await interpreter.execute(`
  const data = [1, 2, 3, 4, 5];
  const processed = process(data);
  
  // This object becomes the return value
  {
    original: data,
    processed: processed,
    sum: processed.reduce((a, b) => a + b, 0),
    timestamp: Date.now()
  }
`);

console.log(workflowResult);
// { original: [1,2,3,4,5], processed: [2,4,6,8,10], sum: 30, timestamp: ... }
```

This pattern makes Wang scripts behave like functions that implicitly return their last computed value, making them composable and easy to integrate into larger applications.