# Wang Grammar Testing Strategy

## Problem Analysis

The current `wang.ne` grammar is comprehensive but the implementation fails. We need to identify which specific grammar rules cause parser failures.

## Testing Approach

### 1. **wang-minimal.ne** - Proven Working Features
- Basic variables (`let`, `const`, `var`)
- Simple functions (named only)
- Basic control flow (`if`, `for`, `while`)
- Simple expressions (no arrows, no complex objects)
- Empty objects only

### 2. **wang-progressive.ne** - Add Features One by One
Added features to test:
- ✅ Arrow functions (`=>`)
- ✅ Function expressions
- ✅ Object literals with properties
- ✅ Try-catch blocks
- ✅ Ternary operator
- ✅ Spread operator

### 3. **wang-fixed.ne** - Production Grammar
Will contain only features that pass testing.

## Key Grammar Issues to Test

### Issue 1: Arrow Functions
**Current Grammar (lines 519-540):**
- Has proper arrow function rules
- But may conflict with assignment expression precedence

**Test:**
```wang
let fn = x => x * 2
let fn2 = (a, b) => a + b
let fn3 = x => { return x * 3 }
```

### Issue 2: Object Literals
**Current Grammar (lines 766-793):**
- Allows complex property definitions
- May fail when property value contains member access

**Test:**
```wang
let obj = {
  simple: "value",
  number: 42
}

// This likely fails:
let obj2 = {
  computed: arr.length
}
```

### Issue 3: Member Access in Expressions
**Grammar allows it, but parser may fail on:**
```wang
// In object literal
{ prop: obj.value }

// In console.log
console.log("Value: " + obj.prop)

// In callback
map(arr, item => item.value)
```

### Issue 4: Try-Catch
**Current Grammar (lines 451-469):**
- Full try-catch-finally support
- May not be recognized by parser

**Test:**
```wang
try {
  risky()
} catch (e) {
  console.log(e)
}
```

## Grammar Fixes to Try

### Fix 1: Simplify Arrow Function Precedence
Instead of having ArrowFunction at AssignmentExpression level, move it to a specific context.

### Fix 2: Restrict Object Literal Property Values
Limit property values to literals and identifiers initially, then gradually add expressions.

### Fix 3: Add Explicit Precedence Rules
Use Nearley's precedence declarations to resolve ambiguities.

### Fix 4: Separate Statement vs Expression Context
Some constructs may work as statements but not as expressions.

## Testing Process

1. **Compile grammars:**
```bash
npx nearleyc src/grammar/wang-minimal.ne -o src/grammar/wang-minimal.js
npx nearleyc src/grammar/wang-progressive.ne -o src/grammar/wang-progressive.js
```

2. **Test with parser:**
Create test files that use each grammar version.

3. **Identify breaking point:**
Find exactly which rule addition causes failures.

4. **Fix and iterate:**
Adjust the problematic rules and retest.

## Expected Outcomes

### Working Features (Minimal Grammar)
- ✅ Basic variables and functions
- ✅ Simple control flow
- ✅ Basic expressions
- ✅ Empty objects

### Features to Fix (Progressive Grammar)
- ⚠️ Arrow functions - needs precedence fix
- ⚠️ Object literals with expressions - needs restriction
- ⚠️ Try-catch - needs proper token handling
- ⚠️ Function expressions in callbacks

### Final Grammar
Will include only features that:
1. Parse correctly
2. Execute properly in the interpreter
3. Don't conflict with other rules

## Next Steps

1. Compile and test `wang-minimal.ne`
2. Compile and test `wang-progressive.ne`
3. Identify exact failure points
4. Create `wang-fixed.ne` with working features only
5. Document limitations clearly for users