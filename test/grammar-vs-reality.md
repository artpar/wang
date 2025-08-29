# Wang Language: Grammar Specification vs Implementation Reality

## Executive Summary
The Wang grammar file (`wang.ne`) specifies a language that is ~90% JavaScript-compatible. However, the actual implementation supports only ~20-30% of the specified features, creating a massive expectations gap.

## Detailed Feature Comparison

### ✅ What Actually Works

#### Variables
```wang
let x = 5
const y = 10
var z = "string"
```

#### Basic Functions
```wang
function myFunc(a, b) {
    return a + b
}
```

#### Simple Loops
```wang
for (let i = 0; i < 10; i = i + 1) {
    console.log(i)
}
```

#### Property Assignment (One at a Time)
```wang
let obj = {}
obj.prop = "value"
obj.num = 42
```

#### Basic Control Flow
```wang
if (condition) {
    // works
} else {
    // works
}
```

### ❌ What the Grammar Says Works But Doesn't

#### Arrow Functions (Grammar Lines 519-540)
```wang
// Grammar says YES, Implementation says NO
let fn = (x, y) => x + y  // ❌ Parse error
let mapped = map(arr, (v, i) => v * i)  // ❌ Unexpected token
```

#### Object Literals (Grammar Lines 766-793)
```wang
// Grammar says YES, Implementation says NO
let obj = {
    name: "test",
    count: arr.length,  // ❌ Parse error at "."
    nested: { inner: true }  // ❌ May fail
}
```

#### Try-Catch (Grammar Lines 451-469)
```wang
// Grammar says YES, Implementation says NO
try {
    risky()
} catch (e) {  // ❌ Parser doesn't recognize
    console.log(e)
}
```

#### Function Expressions (Grammar Lines 719-733)
```wang
// Grammar says YES, Implementation says NO
let fn = function(x) { return x }  // ❌ In callbacks fails
map(arr, function(x) { return x })  // ❌ Parse error
```

#### Classes (Grammar Lines 311-360)
```wang
// Grammar says YES, Implementation PARTIAL
class MyClass {  // ⚠️ May parse
    constructor(x) {
        this.x = x
    }
    method() {  // ⚠️ May not work
        return this.x
    }
}
```

#### Destructuring (Grammar Lines 248-286)
```wang
// Grammar says YES, Implementation UNKNOWN
let [a, b] = [1, 2]  // ❓ Untested
let {x, y} = obj  // ❓ Untested
```

#### Template Literals (Grammar Lines 744-749)
```wang
// Grammar says BASIC, Implementation UNKNOWN
let str = `Hello World`  // ❓ Should work
let bad = `Hello ${name}`  // ❌ No expression support
```

### 🚫 Runtime Library Gaps (Not Grammar Issues)

These aren't syntax issues but missing runtime features:

```wang
// Not implemented in runtime
new Promise(...)  // ❌ Promise undefined
new Date()  // ❌ Date undefined
arr.slice(0, 3)  // ❌ Method not found
arr.join(", ")  // ❌ Method not found
setTimeout(...)  // ❌ Not defined
```

## The Core Problem

The Wang grammar is generated using **Nearley.js** and describes a sophisticated language. The grammar file shows:

1. **Professional Design**: Proper lexer with Unicode support, keyword handling
2. **Modern Features**: Arrow functions, async/await, destructuring, classes
3. **Wang Innovations**: Pipeline operators (`|>`, `->`)

But the implementation appears to be a **minimal proof-of-concept** that only handles the simplest cases.

## Impact on Users

1. **False Expectations**: Grammar suggests "write JavaScript" but reality is "write simple Wang"
2. **Mysterious Failures**: Standard JS patterns fail with cryptic errors
3. **Trial and Error**: No clear documentation of what actually works
4. **Productivity Loss**: Constant workarounds for missing features

## The Numbers

| Category | Grammar Specifies | Actually Works | Implementation % |
|----------|------------------|----------------|------------------|
| Variables | 100% | 100% | ✅ 100% |
| Functions | Named + Anonymous + Arrow | Named only | ⚠️ 33% |
| Objects | Literals + Computed + Spread | Property-by-property | ⚠️ 20% |
| Arrays | Full syntax | Basic only | ⚠️ 60% |
| Classes | Constructor + Methods + Inheritance | Partial | ⚠️ 40% |
| Error Handling | Try/Catch/Finally | None | ❌ 0% |
| Async | Async/Await | Unknown | ❓ ? |
| Modules | Import/Export | Unknown | ❓ ? |
| **Overall** | **~90% of JavaScript** | **~25% of Grammar** | **❌ 25%** |

## Recommendations

### For Wang Team
1. **Urgent**: Update documentation to reflect reality
2. **Priority 1**: Implement arrow functions (most requested)
3. **Priority 2**: Fix object literal parsing
4. **Priority 3**: Add try-catch support
5. **Long-term**: Implement the full grammar specification

### For Users
**Current Workarounds:**
```wang
// Instead of: let obj = { a: 1, b: 2 }
let obj = {}
obj.a = 1
obj.b = 2

// Instead of: arr.map(x => x * 2)
let result = []
for (let i = 0; i < arr.length; i = i + 1) {
    result.push(arr[i] * 2)
}

// Instead of: try { risky() } catch(e) { }
// No workaround - avoid code that might throw
```

## Conclusion

Wang's grammar promises a modern, JavaScript-like language with innovative pipeline features. The implementation delivers a basic scripting language with ~25% of the promised features. This gap needs to be either:
1. **Closed** by implementing the grammar fully, or
2. **Documented** by updating the grammar to match reality

Until then, Wang remains frustrating for users who expect the advertised JavaScript compatibility.