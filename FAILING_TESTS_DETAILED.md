# Wang Language - Detailed Failing Test Analysis

## Overall Status
- **Total Tests**: 169
- **Passing**: 152 (89.9%)
- **Failing**: 17 (10.1%)

## Failing Tests by File

### 1. `interpreter.test.js` (2/25 failing)

#### Test 1: Object Destructuring
**Error**: Variables from destructuring return `undefined`
```javascript
const { name, age } = person
// Expected: 'Bob - 25'
// Actual: 'undefined - undefined'
```
**Root Cause**: Interpreter's `visitVariableDeclaration` doesn't properly extract values from destructuring patterns

#### Test 2: Module Import/Export
**Error**: `path.endsWith is not a function`
```javascript
import { foo } from "module"
```
**Root Cause**: Module resolver receiving non-string path value

---

### 2. `edge-cases-errors.test.js` (6/25 failing)

#### Test 1: Try-Finally Without Catch
**Error**: Parser expects catch clause
```javascript
try {
    result = 'in try'
} finally {
    result = result + ' and finally'
}
```
**Root Cause**: Grammar requires catch clause, doesn't allow standalone try-finally

#### Test 2: Getters and Setters
**Error**: Syntax error - "Unexpected identifier token: failingGetter"
```javascript
class TestClass {
    get failingGetter() {
        throw new Error('Getter error')
    }
}
```
**Root Cause**: Getters/setters not supported in grammar

#### Test 3: Return Statement Issue
**Error**: Parser error with return statement
```javascript
return { counter, log }
// Error: Parse error: {"type":"return","value":...}
```
**Root Cause**: Return statement with object literal parsing issue

#### Test 4: Pipeline with Undefined Function
**Error**: `Variable "divide" is not defined`
```javascript
result = 10 |> divide(_, 0) |> divide(_, 2)
```
**Root Cause**: Function `divide` not bound, should be `safeDivide`

#### Test 5: Destructuring Error Handling
**Error**: Expected array length > 0, got 0
```javascript
try {
    let { a, b } = null
} catch (e) {
    results.push('destructure null')
}
```
**Root Cause**: Destructuring from null/undefined not throwing proper error

#### Test 6: Return in Try-Catch-Finally
**Error**: Return values not matching expected
```javascript
function test(n) {
    try {
        if (n < 0) throw new Error('negative')
        return 'positive'
    } catch (e) {
        return 'error: ' + e.message
    } finally {
        // Should not affect return
    }
}
```
**Root Cause**: Finally block may be affecting return value

---

### 3. `language-features.test.js` (9/49 failing)

#### Test 1: Multiline Pipeline
**Error**: "Unexpected |> token"
```javascript
const result = data
  |> filter(_, n => n % 2 === 0)
  |> map(_, n => n * n)
```
**Root Cause**: Newline before pipeline operator breaks parsing

#### Test 2 & 3: Destructuring Issues
**Error**: Variables return `undefined`
```javascript
// Nested destructuring
const { name, address: { city, coordinates: { lat } } } = person
// Returns: [undefined, undefined, undefined]

// Renaming destructuring
const { x: newX, y: newY } = obj
// Returns: [undefined, undefined]
```
**Root Cause**: Same as interpreter.test.js - destructuring not extracting values

#### Test 4: Increment/Decrement Operators
**Error**: "Unexpected ; token"
```javascript
x++  // Parser error
```
**Root Cause**: `++` and `--` intentionally removed per FEATURE_DECISIONS.md

#### Test 5: Module Circular Dependencies
**Error**: `path.endsWith is not a function`
```javascript
import { functionA } from "moduleA"
```
**Root Cause**: Same module resolver issue

#### Test 6: Namespace Imports
**Error**: "Unexpected * token"
```javascript
import * as Utils from "utils"
```
**Root Cause**: Namespace imports not supported in grammar

#### Test 7 & 8: Template Literals
**Error**: Returns `undefined` instead of interpolated string
```javascript
`Hello, ${name}!`  // Returns: undefined
`The sum of ${a} and ${b} is ${a + b}`  // Returns: undefined
```
**Root Cause**: Template literals not interpolating expressions

#### Test 9: State Machine Pattern
**Error**: "Unexpected . token" after method chaining
```javascript
sm.addTransition("idle", "start", "running")
  .addTransition("running", "pause", "paused")
```
**Root Cause**: Multiline method chaining breaks with newline-based parsing

---

## Summary by Category

### Parser Issues (7 tests)
1. Try-finally without catch
2. Multiline pipelines
3. Getters/setters (unsupported)
4. Namespace imports (unsupported)
5. Method chaining across lines
6. Increment/decrement (intentionally removed)
7. Semicolon handling

### Interpreter Issues (8 tests)
1. Object destructuring (3 tests)
2. Template literal interpolation (2 tests)
3. Module resolver type error (2 tests)
4. Return statement handling (1 test)

### Test Issues (2 tests)
1. Wrong function name (`divide` vs `safeDivide`)
2. Destructuring error handling expectations

## Priority Fixes

### Critical (affects LLM usage)
1. **Fix destructuring** - Core JavaScript feature
2. **Fix template literals** - Common pattern
3. **Fix try-finally** - Standard error handling

### High Priority
4. **Fix multiline pipelines** - Core Wang feature
5. **Fix module resolver** - Type error issue

### Medium Priority
6. **Fix return statements** - Edge case handling
7. **Document unsupported features** - Clear guidance for LLMs