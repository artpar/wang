# Known Issues and Limitations

## Test Coverage
Currently **83/90 tests passing** (92.2% coverage)

## Reserved Keywords as Identifiers
- **Issue**: Reserved keywords cannot be used as parameter names or variable names
- **Example**: The state machine test uses `from` as a parameter name, which conflicts with the `from` keyword used in import statements
- **Workaround**: Rename parameters to avoid reserved keywords (e.g., `fromState` instead of `from`)
- **Affected Tests**: State machine implementation test

## Arrow Function `this` Preservation in Closures
- **Issue**: Arrow functions don't fully preserve `this` from their lexical scope when returned from methods
- **Workaround**: Capture `this` in a variable (e.g., `const self = this`) and use regular functions instead of arrow functions
- **Affected Tests**: Reactive observable pattern test

## Features Not Yet Implemented

### Private Fields (#field syntax)
- **Required For**: Private methods and properties test
- **Implementation Needed**: Grammar support for `#` prefix in identifiers, interpreter support for private field access

### Async Generators
- **Required For**: Async generator test
- **Implementation Needed**: Grammar support for `async function*` and `yield` keyword, iterator protocol implementation

### Module System Features
- **Default Exports/Imports**: Need grammar support for `export default` and `import name from`
- **Namespace Imports**: Need support for `import * as name from`
- **Re-exports**: Need support for `export { name } from`
- **Circular Dependencies**: Requires deferred module execution

### Destructuring in Function Parameters
- **Required For**: Function parameter destructuring test
- **Implementation Needed**: Grammar changes to allow destructuring patterns in parameter lists

### Tagged Template Literals
- **Required For**: Tagged template literal test
- **Implementation Needed**: Grammar and interpreter support for tagged templates

### Spread Syntax in Expressions  
- **Required For**: Functional programming library test (uses `...array` in expressions)
- **Implementation Needed**: Grammar support for spread operator in call expressions and array literals
- **Status**: Workaround implemented using `apply()` and `concat()`

### Complex Closure Scenarios
- **Issue**: Named function expressions inside arrow functions don't properly capture closure variables
- **Example**: Curry function where `curried` function can't access `arity` from parent scope
- **Status**: Complex scoping issue requiring significant interpreter changes

## Workarounds for Common Issues

### Using Reserved Keywords
If you need to use a reserved keyword as an identifier, consider these alternatives:
- `from` → `fromState`, `source`, `origin`
- `as` → `alias`, `renamed`
- `export` → `exported`, `output`
- `import` → `imported`, `input`

### Arrow Function `this` Binding
When arrow functions don't preserve `this` correctly:
```javascript
// Instead of:
class MyClass {
  method() {
    return () => {
      this.doSomething(); // might fail
    }
  }
}

// Use:
class MyClass {
  method() {
    const self = this;
    return function() {
      self.doSomething(); // works
    }
  }
}
```

### Missing Spread Operator
When you need spread syntax in expressions:
```javascript
// Instead of:
const result = func(...array);

// Use:
const result = array.reduce((acc, item) => func(acc, item), initialValue);
// Or bind the function with apply:
const result = func.apply(null, array);
```

## Circular Module Dependencies
- **Behavior**: Circular dependencies are allowed, but functions may be undefined if called during module initialization
- **Example**: If moduleA imports from moduleB, and moduleB imports from moduleA, functions will be undefined until both modules finish loading
- **Runtime Error**: Calling an undefined imported function will throw a runtime error: "Type mismatch in call expression"
- **Design Decision**: This is intentional behavior - no complex ES6-style hoisting is implemented
- **Best Practice**: Structure modules to avoid calling imported functions during initialization; only call them after all modules are loaded