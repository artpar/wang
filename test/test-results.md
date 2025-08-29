# Wang Language Grammar vs Implementation Test Results

## Overview
This test suite verifies the disconnect between Wang's grammar specification (wang.ne) and its actual runtime implementation.

## Test Categories

### 1. Arrow Functions (Grammar Lines 519-540)
**Grammar Says:** Full arrow function support with blocks, expressions, async
**Expected Failures:**
- Arrow functions with index parameter in map callbacks
- Complex arrow function bodies with multiple statements
- Async arrow functions may not execute properly

### 2. Object Literals (Grammar Lines 766-793)
**Grammar Says:** Complete object literal syntax with computed properties, spread
**Expected Failures:**
- Object literals with property access expressions (e.g., `arr.length`)
- Nested object structures
- Computed property names
- Spread syntax

### 3. Try-Catch-Finally (Grammar Lines 451-469)
**Grammar Says:** Full exception handling support
**Expected Failures:**
- May not parse at all
- Catch parameter binding may fail
- Finally blocks may not execute

### 4. Function Expressions (Grammar Lines 719-733)
**Grammar Says:** Anonymous function expressions supported
**Expected Failures:**
- Function keyword in callbacks (map, filter, etc.)
- Async function expressions

### 5. Member Access Chains (Grammar Lines 633-645)
**Grammar Says:** Full property access with optional chaining
**Expected Failures:**
- Complex chains (a.b.c.d)
- Optional chaining (?.)
- Mixed computed and dot access

### 6. Classes (Grammar Lines 311-360)
**Grammar Says:** Class declarations with constructors and methods
**Expected Failures:**
- May parse but not instantiate correctly
- Method calls on instances
- Inheritance with extends

### 7. Destructuring (Grammar Lines 248-286)
**Grammar Says:** Array and object destructuring patterns
**Expected Failures:**
- Complex destructuring patterns
- Rest parameters in destructuring
- Nested destructuring

### 8. Pipeline Operators (Grammar Lines 505-509)
**Grammar Says:** Wang-specific |> and -> operators
**Expected:** These might actually work as they're Wang-specific features

### 9. Template Literals (Grammar Lines 744-749)
**Grammar Says:** Basic template literals (no embedded expressions)
**Expected:** Should work for basic strings, no ${} support

### 10. Async/Await (Grammar Lines 78, 590)
**Grammar Says:** Full async/await support
**Expected Failures:**
- Await expressions may not suspend properly
- Async functions may not return promises

## User-Reported Failures

| Feature | Grammar Support | Actual Result |
|---------|----------------|---------------|
| `map(arr, (val, idx) => {...})` | ✅ Yes | ❌ Parse error |
| `{ prop: arr.length }` | ✅ Yes | ❌ Parse error |
| `new Promise(...)` | ✅ Yes (new expr) | ❌ Promise not defined |
| `arr.slice(0, 3)` | N/A (runtime) | ❌ Method not found |
| `arr.join(", ")` | N/A (runtime) | ❌ Method not found |
| `try { } catch(e) { }` | ✅ Yes | ❌ Not recognized |
| `function() { }` in callback | ✅ Yes | ❌ Parse error |

## Key Findings

### Grammar vs Implementation Gap
The grammar file (wang.ne) describes a nearly complete JavaScript-like language, but the implementation appears to only support:
- Basic variable declarations
- Simple for loops
- Basic function declarations (not expressions)
- Simple property assignment (one at a time)
- Built-in Wang functions (map, filter) with simple callbacks only

### Runtime Library Issues
Beyond syntax, the runtime lacks standard JavaScript objects/methods:
- No Promise constructor
- No Array prototype methods (slice, join, push sometimes works)
- No Date constructor
- No setTimeout/delay functions

### Parser Context Sensitivity
The parser seems to fail when certain constructs are nested or combined:
- Property access inside expressions
- Method calls in object literals
- Complex expressions in function arguments

## Conclusion

Wang has a **well-designed grammar specification** that promises near-JavaScript compatibility, but the **actual implementation** delivers perhaps 20-30% of the specified features. This creates a severe user experience problem where:

1. Users reasonably expect JavaScript patterns to work (based on the grammar)
2. The parser mysteriously fails on standard constructs
3. Error messages don't clearly indicate what's unsupported
4. The language becomes trial-and-error to use

## Recommendations

For Wang maintainers:
1. Either fix the implementation to match the grammar
2. Or update the grammar to reflect actual capabilities
3. Provide clear documentation on what actually works
4. Improve error messages to indicate unsupported features

For Wang users:
1. Stick to the simplest possible syntax
2. Avoid nested expressions
3. Build objects property by property
4. Use simple callbacks without complex logic
5. Don't rely on JavaScript standard library
6. Test every pattern before using in production