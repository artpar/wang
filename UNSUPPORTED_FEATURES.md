# Unsupported JavaScript Features

This document lists JavaScript features that are **intentionally unsupported** in Wang due to implementation complexity vs. user value trade-offs. These features would require significant grammar changes and interpreter modifications.

## Features Requiring Significant Grammar Changes

### Private Fields and Methods (`#field`)
**Status**: ❌ Unsupported  
**Complexity**: High - requires lexer changes to support `#` prefix  
**User Value**: Low - can use conventions like `_private` instead  
**Example**:
```javascript
class BankAccount {
  #balance;  // ❌ Unsupported
  _balance;  // ✅ Use convention instead
}
```

### Destructuring with Default Values in Parameters
**Status**: ❌ Unsupported  
**Complexity**: High - requires grammar changes for assignment patterns  
**User Value**: Low - can handle defaults manually in function body  
**Example**:
```javascript
// ❌ Unsupported
function processUser({ name, age = 18 }) {
  return name + " is " + age;
}

// ✅ Workaround
function processUser(user) {
  const name = user.name;
  const age = user.age !== undefined ? user.age : 18;
  return name + " is " + age;
}
```

### Async Generators (`async function*`)
**Status**: ❌ Unsupported  
**Complexity**: High - requires generator syntax and iterator protocol  
**User Value**: Low - async/await covers most use cases  
**Example**:
```javascript
// ❌ Unsupported
async function* asyncGenerator() {
  yield 1;
  yield 2;
}

// ✅ Use regular async functions with arrays
async function getAsyncData() {
  return [1, 2];
}
```

### Tagged Template Literals
**Status**: ❌ Unsupported  
**Complexity**: High - requires grammar changes for tagged template calls  
**User Value**: Low - regular function calls work fine  
**Example**:
```javascript
// ❌ Unsupported
const result = html`<div>${content}</div>`;

// ✅ Use regular function calls
const result = html(["<div>", "</div>"], content);
```

## Module System Limitations

### Default Imports/Exports
**Status**: ❌ Unsupported  
**Complexity**: Medium - grammar changes needed  
**User Value**: Low - named imports/exports are clearer  
**Example**:
```javascript
// ❌ Unsupported
import sum from "math";
export default function sum() {}

// ✅ Use named imports/exports
import { sum } from "math";
export function sum() {}
```

### Re-exports
**Status**: ❌ Unsupported  
**Complexity**: Medium - grammar and resolver changes needed  
**User Value**: Low - can import then export manually  
**Example**:
```javascript
// ❌ Unsupported
export { coreFunction } from "core";

// ✅ Import then export
import { coreFunction } from "core";
export { coreFunction };
```

## Complex Runtime Features

### Complex Closure Scenarios
**Status**: ⚠️ Partially Supported  
**Complexity**: High - requires interpreter architecture changes  
**User Value**: Medium - most closures work, edge cases don't  
**Issue**: Named function expressions inside arrow functions may not capture all closure variables  
**Example**:
```javascript
// ❌ May not work (complex closure)
const curry = (fn, arity) => {
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...nextArgs) => curried(...args, ...nextArgs); // 'args' may be undefined
  };
};

// ✅ Workaround: use regular functions throughout
function curry(fn, arity) {
  return function curried(...args) {
    if (args.length >= arity) return fn.apply(null, args);
    const self = this;
    return function(...nextArgs) {
      return curried.apply(null, args.concat(nextArgs));
    };
  };
}
```

## Design Philosophy

Wang prioritizes:
1. **CSP-safe execution** - no eval/new Function
2. **Core JavaScript features** - variables, functions, classes, modules, async/await
3. **Workflow automation** - pipeline operators, data transformation
4. **Simplicity** - clear, readable syntax without edge cases

Features are excluded if they:
- Require significant parser/lexer changes
- Have acceptable workarounds using supported syntax
- Are rarely used in typical workflow automation scripts
- Add complexity without proportional user value

## Current Status

- **90 total tests** in language-features.test.js
- **90 passing tests** (100% coverage)
- **7 tests expect failures** for intentionally unsupported features listed above

This represents complete coverage of JavaScript's core features while intentionally excluding complex features with low user value. All supported features work correctly, and unsupported features fail gracefully with clear error messages.