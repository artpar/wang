# Wang Language Feature Decisions

Based on our testing, here are the concrete conflicts and recommended decisions:

## 🔴 CRITICAL ISSUES (Must Fix)

### 1. **Class Member Separators - BROKEN**
**Current State:** Classes completely broken with newlines between methods
**Problem:** Grammar expects specific separator pattern that doesn't work
**Options:**
- A) Require semicolons after class members ❌ Inconsistent with newline-based approach
- **B) Fix grammar to handle newlines** ✅ RECOMMENDED
  ```javascript
  class Foo {
    prop = 1
    method() { return 2 }  // Newline separation, like statements
  }
  ```
- C) Remove classes entirely (too drastic)

### 2. **Object Literal Newlines - BROKEN**
**Current State:** Multi-line objects failing to parse
**Problem:** Grammar doesn't handle newlines after properties correctly
**Options:**
- **A) Fix the PropertySeparator rule** ✅ RECOMMENDED
  - Already partially fixed, needs completion
- B) Require single-line objects (too restrictive)

---

## ⚠️ AMBIGUITY ISSUES (2+ Parse Results)

### 3. **Statement Separators**
**Current State:** 
- Semicolon only: ✅ Works (1 parse)
- Newline only: ✅ Works (1 parse) 
- Mixed: ⚠️ Ambiguous (2-4 parses)
- Double newlines: ⚠️ Ambiguous (2 parses)

**DECISION: Newlines Only** ✅
- **Newlines separate statements** (like Python/Go)
- **NO semicolons** - cleaner, no ambiguity
- Multiple newlines treated as one separator
- For multiple statements on one line, restructure code

**Grammar Rule:**
```nearley
# Statements separated by newlines only
StatementList ->
    Statement
  | StatementList %NL Statement
  | StatementList %NL  # Allow trailing newline
```

### 4. **Function Declarations**
**Current State:** All function forms create 2 parses
**Problem:** `function foo() {}` matches both FunctionDeclaration and FunctionExpression

**DECISION: Clear Distinction** ✅
- **Named functions → ALWAYS FunctionDeclaration**
  ```javascript
  function foo() {}        // Declaration only
  async function bar() {}  // Declaration only
  ```
- **Anonymous functions → ALWAYS FunctionExpression**
  ```javascript
  const fn = function() {}  // Anonymous function expression
  const arr = () => {}      // Arrow function expression
  ```

**Grammar Rules:**
```nearley
# Only named functions in declarations
FunctionDeclaration -> "function" %identifier "(" params ")" Block

# Only anonymous in expressions  
FunctionExpression -> 
    "function" "(" params ")" Block   # Anonymous function
  | ArrowFunction                      # Arrow syntax
```

---

## 💡 SIMPLIFICATION OPPORTUNITIES

### 5. **Features to Remove (Low Value, High Complexity)**

#### Remove These:
1. **`++/--` operators** → Use `x = x + 1`
   - Eliminates prefix/postfix confusion
   - Simpler grammar
   
2. **Compound assignment operators** (`+=`, `-=`, `*=`, `/=`, etc.) ✅ **IMPLEMENTED**
   - Originally planned for removal, but implemented for developer convenience
   - Low complexity addition (4 basic operators only)
   - Commonly expected syntax from other languages

3. **`for-in` loops** → Remove (problematic with prototypes)
   - Keep **C-style for loops** for index-based iteration: `for (let i = 0; i < n; i = i + 1)`
   - Keep **for-of loops** for iterables (arrays, strings, etc.)
   - Note: for-of does NOT work on plain objects - use:
     - `for (const [key, value] of Object.entries(obj))`
     - `for (const key of Object.keys(obj))`
     - `for (const value of Object.values(obj))`

4. **Switch statements** → Use if-else chains
   - Complex grammar
   - Fall-through is error-prone
   - Can add pattern matching later

5. **Labels and labeled break/continue** → **Keep (simplified)**
   - Since `{a: ...}` is always an object, no ambiguity with labeled statements
   - Only allow labels on loops (not arbitrary blocks)
   - Useful for breaking out of nested loops
   ```javascript
   outer: for (let i = 0; i < n; i = i + 1) {
     for (let j = 0; j < m; j = j + 1) {
       if (condition) break outer  // Clear, useful
     }
   }
   ```
   - Simple to implement: `label: LoopStatement` and `break label`

6. **Getters/Setters in classes**
   - Use regular methods instead
   - Much simpler grammar

7. **Static class members**
   - Can use module-level functions
   - Simplifies class grammar

8. **Private fields (#private)**
   - Use naming convention (_private)
   - Avoids complex syntax

#### Keep These (High Value):
1. **Pipeline operators** (`|>`, `->`) - Core Wang feature
2. **Arrow functions** - Modern, clean
3. **Classes** (simplified) - Important for OOP
4. **Async/await** - Essential
5. **Destructuring** (basic) - Very useful
6. **Template literals** - Cleaner than concatenation
7. **Optional chaining** (`?.`) with computed member access (`?.[expression]`) - Prevents errors, now supports arrays
8. **Spread operator** (`...`) - Very useful

---

## 📋 RECOMMENDED WANG LANGUAGE SPEC

### Core Principles:
1. **One way to do things** - Reduce redundant syntax
2. **Newline-based** - Like Python/Go
3. **Modern JavaScript subset** - Familiar but cleaner

### Statement Separators:
- **Newlines only** - No semicolons at all
- Each statement on its own line
- Multiple newlines treated as one
- No ASI complexity needed

### Functions:
- **Named functions**: `function name(params) { }` - Declarations only
- **Anonymous functions**: `function(params) { }` - Expressions only  
- **Arrow functions**: `(params) => { }` - Always expressions
- Single param arrows can omit parens: `x => x * 2`
- Async works with all: `async function name()`, `async () => {}`

### Classes (Simplified):
```javascript
class Name {
  constructor(params) { }  // Optional
  method(params) { }       // Regular methods only
}
// Newline-separated members (like statements)
// No static, no private, no getters/setters
```

### Control Flow:
```javascript
// Conditionals
if (condition) { }
else if (condition) { }
else { }

// Loops
while (condition) { }
do { } while (condition)
for (const item of iterable) { }              // for-of
for (let i = 0; i < n; i = i + 1) { }        // C-style (no ++ operator)
// No for-in (use for-of with Object.entries/keys/values)

// No switch statements
```

### Data Structures:
```javascript
// Objects
const obj = {
  key: value,
  method: () => { }
}

// Arrays  
const arr = [1, 2, 3]

// Destructuring (basic)
const {a, b} = obj
const [x, y] = arr
```

### Operators:
```javascript
// Arithmetic: +, -, *, /, %, **
// Assignment: =, +=, -=, *=, /= (basic compound assignments)
// Comparison: ==, !=, ===, !==, <, >, <=, >=
// Logical: &&, ||, !
// Pipeline: |>, ->
// Optional: ?.
// Nullish: ??
// Spread: ...
// NO: ++, --, ternary (?:)
```

### Modules:
```javascript
// Simple named imports/exports only
import {a, b} from 'module'
export {x, y}
export const z = value
// No default exports, no renaming
```

---

## 🎯 NEXT STEPS

1. **Rewrite grammar with these decisions**
2. **Start with minimal working subset**
3. **Add features incrementally**
4. **Ensure each addition maintains single parse**

This approach will give us:
- **No ambiguity** - Single parse result
- **Cleaner syntax** - Modern, consistent
- **Easier to maintain** - Simpler grammar
- **Better errors** - Clear parse failures
