# Wang Language Syntax Conflicts Analysis

## 1. Statement Separators: Newlines vs Semicolons
**Conflict:** Multiple ways to separate statements creates exponential parse paths
```javascript
// These all mean the same thing:
x = 1; y = 2     // semicolon
x = 1            // newline
y = 2

x = 1;           // semicolon + newline
y = 2
```
**Ambiguity:** `\n\n` could be 1 separator or 2 separators
**Impact:** Every statement list has 2^n possible parses

**Options:**
- A) Require semicolons (like C/Java)
- B) Require newlines (like Python)
- C) Allow both but normalize in lexer
- D) Keep both, accept ambiguity

---

## 2. Function Syntax: Declaration vs Expression
**Conflict:** Named functions can be both declarations and expressions
```javascript
// Declaration (statement)
function add(a, b) { return a + b }

// Expression (can be in expression position)
const fn = function add(a, b) { return a + b }

// Ambiguous at statement level:
function add(a, b) { return a + b };  // Declaration or ExpressionStatement?
```
**Impact:** Parser sees both paths, creates multiple parses

**Options:**
- A) Only allow anonymous functions in expressions (current fix)
- B) Remove function expressions entirely, use arrow functions only
- C) Remove function declarations, only use const/let with arrows
- D) Keep both, use context to disambiguate

---

## 3. Object Literals vs Block Statements
**Conflict:** `{}` syntax is ambiguous
```javascript
{}           // Empty block or empty object?
{a: 1}       // Block with label or object with property?
({a: 1})     // Clearly an object (parentheses force expression context)
```
**Impact:** Parser must track context (statement vs expression position)

**Options:**
- A) Require parentheses around object literals in statement position
- B) Remove labeled statements (rarely used)
- C) Use different syntax for objects (like `@{a: 1}`)
- D) Keep both, disambiguate by context

---

## 4. Arrow Functions vs Greater-Than
**Conflict:** `=>` can be confused in complex expressions
```javascript
x = y => z      // Arrow function
x = y >= z      // Comparison
(a, b) => c     // Clear arrow function
a, b => c       // Ambiguous without parens
```
**Impact:** Minor - mostly handled by precedence

**Options:**
- A) Require parentheses for arrow function parameters
- B) Use different arrow syntax (like `->` or `|>`)
- C) Keep as-is (not a major issue)

---

## 5. Increment/Decrement Operators
**Conflict:** Multiple ways to do the same thing
```javascript
x++              // Postfix increment
++x              // Prefix increment
x += 1           // Compound assignment
x = x + 1        // Regular assignment
```
**Impact:** More operators = more grammar complexity

**Options:**
- A) Remove `++/--` entirely, use `+= 1`
- B) Keep only postfix `x++`
- C) Keep only prefix `++x`
- D) Keep all (adds complexity but familiar)

---

## 6. Optional Semicolons (ASI)
**Conflict:** When are newlines significant?
```javascript
return           // ASI: return undefined
  value

return value     // return value

x = y            // Complete statement
  + z            // Or continuation? x = y + z
```
**Impact:** Complex lexer rules, parsing ambiguity

**Options:**
- A) No ASI - require explicit semicolons
- B) Simple ASI - newline always ends statement unless preceded by operator
- C) Full JavaScript ASI (complex rules)
- D) Python-like - newlines end statements, use `\` for continuation

---

## 7. Template Literals
**Conflict:** Complex to parse with embedded expressions
```javascript
`hello ${name}`                    // Simple
`hello ${user.name || 'guest'}`   // Complex expression
`hello ${`nested ${x}`}`           // Nested templates
```
**Impact:** Requires stateful lexer or complex grammar

**Options:**
- A) Remove template literals, use string concatenation
- B) Simple templates only (no nested expressions)
- C) Full template support (complex)
- D) Alternative syntax like Python f-strings

---

## 8. Destructuring
**Conflict:** Complex syntax with many edge cases
```javascript
{a, b} = obj           // Object destructuring
[a, b] = arr           // Array destructuring
{a: x, b: y} = obj     // With renaming
{a = 1} = obj          // With defaults
{a: {b}} = obj         // Nested
```
**Impact:** Significantly complicates the grammar

**Options:**
- A) Remove destructuring entirely
- B) Simple destructuring only (no renaming/defaults)
- C) Object destructuring only
- D) Array destructuring only
- E) Keep full destructuring

---

## 9. Optional Chaining & Nullish Coalescing
**Conflict:** More operators to handle
```javascript
obj?.prop          // Optional chaining
obj?.[key]         // Optional bracket access
func?.()           // Optional call
value ?? default   // Nullish coalescing
```
**Impact:** Additional complexity but useful

**Options:**
- A) Remove these modern operators
- B) Keep only `?.` for property access
- C) Keep only `??`
- D) Keep all

---

## 10. Class Syntax
**Conflict:** Many features, complex grammar
```javascript
class Foo extends Bar {
  static prop = 1        // Static properties
  #private = 2           // Private fields
  constructor() {}       // Constructor
  method() {}            // Methods
  get prop() {}          // Getters
  set prop(v) {}         // Setters
  async method() {}      // Async methods
  *generator() {}        // Generators
}
```
**Impact:** Each feature adds grammar complexity

**Options:**
- A) Remove classes, use functions/prototypes
- B) Basic classes only (constructor + methods)
- C) No inheritance (remove extends)
- D) No static/private/getters/setters
- E) Keep full class syntax

---

## 11. Switch Statements
**Conflict:** Complex control flow, fall-through behavior
```javascript
switch(x) {
  case 1:
    doA();
    break;
  case 2:
  case 3:      // Fall-through
    doB();
    break;
  default:
    doC();
}
```
**Impact:** Complex grammar, multiple block types

**Options:**
- A) Remove switch, use if/else chains
- B) Pattern matching syntax instead (like Rust match)
- C) Simplified switch (no fall-through)
- D) Keep standard switch

---

## 12. For Loops Variants
**Conflict:** Multiple loop syntaxes
```javascript
for (let i = 0; i < n; i++) {}     // C-style
for (let x of array) {}            // for-of
for (let k in object) {}           // for-in
for await (let x of async) {}      // for-await-of
```
**Impact:** Each variant needs grammar rules

**Options:**
- A) Only while loops
- B) Only for-of loops
- C) Remove for-in (often problematic)
- D) Keep all variants

---

## 13. Export/Import Variants
**Conflict:** Many ways to import/export
```javascript
import foo from 'module'              // Default import
import {bar} from 'module'            // Named import
import * as baz from 'module'         // Namespace import
import foo, {bar} from 'module'       // Mixed

export default foo                     // Default export
export {bar}                          // Named export
export {bar as baz}                   // Renamed export
export * from 'other'                 // Re-export
```
**Impact:** Complex module syntax

**Options:**
- A) Named imports/exports only
- B) Remove default imports/exports
- C) Simple import/export (no renaming/re-exports)
- D) Keep full ESM syntax

---

## Priority Recommendation

### High Value, Keep:
1. **Pipeline operators** (`|>`, `->`) - Core Wang feature
2. **Basic functions** - Either declarations OR arrow functions
3. **Basic objects/arrays** - Essential data structures
4. **Basic classes** - Important for OOP
5. **Async/await** - Critical for modern JS
6. **Basic imports/exports** - Need modules

### Medium Value, Simplify:
1. **Destructuring** - Keep simple forms only
2. **Template literals** - Keep but limit complexity
3. **Optional chaining** (`?.`) - Useful, keep simple form

### Low Value, Consider Removing:
1. **Increment/decrement** (`++`, `--`) - Use `+= 1` instead
2. **for-in loops** - Often problematic
3. **Switch statements** - Use if/else
4. **Labels & break/continue** - Rarely used
5. **Getters/setters** - Complexity not worth it
6. **Generators** - Too complex
7. **Private fields** - Use naming convention instead

### Critical Decisions Needed:
1. **Semicolons vs Newlines** - Pick one approach
2. **Function syntax** - Simplify to one style
3. **ASI rules** - Yes or no?