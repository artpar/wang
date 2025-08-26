# Wang Language - Failing Test Analysis

## Summary
- **36 tests failing** out of 169 total tests
- **133 tests passing** (78.7% pass rate)
- Most failures are in interpreter implementation, not parser

## Categorized Issues

### 1. **Destructuring Assignment Issues** (INTERPRETER)
**Problem**: Variables from destructuring are returning `undefined`
```javascript
const { name, age } = person  // name and age are undefined
const { address: { city } } = person  // nested destructuring fails
const { x: newX } = obj  // renaming fails
```
**Root Cause**: Interpreter not properly extracting and assigning values from destructuring patterns

### 2. **Template Literal Issues** (PARSER/INTERPRETER)
**Problem**: Template literals don't interpolate expressions
```javascript
`Hello, ${name}!`  // Returns "Hello, ${name}!" instead of "Hello, Alice!"
```
**Root Cause**: Lexer treats entire template literal as one token, doesn't parse `${}` expressions

### 3. **Pipeline with Multiline Issues** (PARSER)
**Problem**: Multiline pipelines still failing
```javascript
data
  |> filter(_, x => x > 5)  // Syntax error
  |> map(_, x => x * 2)
```
**Root Cause**: Newline handling conflicts with pipeline continuation

### 4. **Try-Finally Without Catch** (PARSER)
**Problem**: `try...finally` without `catch` doesn't parse
```javascript
try {
  doSomething()
} finally {  // Parser expects catch
  cleanup()
}
```
**Root Cause**: Grammar requires catch clause, doesn't allow try-finally alone

### 5. **Increment/Decrement Operators** (INTENTIONALLY REMOVED)
**Problem**: `++` and `--` operators not supported
```javascript
x++  // Fails - must use x = x + 1
--y  // Fails - must use y = y - 1
```
**Note**: This is by design per FEATURE_DECISIONS.md

### 6. **Module Import Issues** (INTERPRETER)
**Problem**: `path.endsWith is not a function` error in module resolver
```javascript
import { foo } from "module"  // TypeError in resolver
import * as Utils from "utils"  // Namespace imports fail
```
**Root Cause**: Bug in module resolver expecting string path but getting something else

### 7. **Error Handling Edge Cases** (INTERPRETER)
**Problem**: Various error handling scenarios fail
- Custom error objects not preserved
- Error types not maintained
- Async error handling issues
**Root Cause**: Interpreter's error handling implementation incomplete

### 8. **State Machine Pattern** (PARSER)
**Problem**: Complex object method chaining fails
```javascript
sm.addTransition("idle", "start", "running")
  .addTransition("running", "pause", "paused")  // Multiline chaining issue
```

## Priority Fixes

### High Priority (Affects LLM usage)
1. **Destructuring assignments** - Common JavaScript pattern
2. **Try-finally without catch** - Standard JavaScript feature
3. **Multiline pipelines** - Core Wang feature

### Medium Priority  
4. **Template literal interpolation** - Useful but has workarounds
5. **Module imports** - Important for larger programs

### Low Priority
6. **Error handling edge cases** - Advanced scenarios
7. **State machine patterns** - Specific use case

## Test Files Status

| File | Status | Pass/Total | Issues |
|------|--------|------------|--------|
| `return-value.test.js` | ✅ PASSING | 14/14 | None |
| `metadata.test.js` | ✅ PASSING | 43/43 | None |
| `parser.test.js` | ⚠️ FAILING | 12/13 | Class ambiguity (18 parses) |
| `interpreter.test.js` | ⚠️ FAILING | 18/22 | Destructuring, modules |
| `edge-cases-errors.test.js` | ⚠️ FAILING | 27/53 | Try-finally, error handling |
| `language-features.test.js` | ⚠️ FAILING | 19/27 | Multiple issues |

## Recommendations

1. **Fix destructuring in interpreter** - This is a fundamental JavaScript feature
2. **Allow try-finally without catch** - Simple grammar fix
3. **Implement proper template literal parsing** - May require lexer changes
4. **Fix module resolver path issue** - Likely a simple type error
5. **Document unsupported features clearly** - So LLMs know what to avoid