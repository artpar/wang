# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wang is a modern workflow programming language that runs inside JavaScript, designed for browser automation and data transformation. The language features:
- Modern JavaScript-like syntax with pipelines (`|>` and `->`) supporting multiline expressions
- Full module system with named imports/exports
- Classes with inheritance, methods, and proper scoping
- CSP-safe execution (no eval/new Function)
- Pluggable module resolution (memory, IndexedDB, HTTP)
- Comprehensive error reporting with recovery suggestions
- **99.4% test coverage** (334/336 tests passing) with intentional exclusion of complex edge cases
- **Optional chaining** with computed member access (`titles.data?.[i]?.textContent`)
- **Template literals** with full expression interpolation support `` `Hello, ${name}!` `` (CSP-safe)

## Critical Security Requirements

**MUST BE CSP-SAFE**: This project must run safely in Chrome service worker contexts. This means:
- **NO `eval()` usage** - all code must be interpreted without dynamic code evaluation
- **NO `new Function()` usage** - cannot create functions from strings
- **NO dynamic code generation** - all parsing and execution must be static
- Must be safe for dynamic generation and execution in restricted browser contexts
- Uses Nearly parser which is CSP-safe by default

## Architecture

### New Implementation (Nearly-based)

1. **Lexer** (`wang-lexer.js`): Tokenizes Wang source code
   - Full JavaScript-like token set
   - Support for template literals, operators, keywords
   - Error recovery and detailed error messages
   
2. **Parser** (`wang-parser.js`): Builds CST using Nearly
   - CSP-safe by default (no code generation)
   - Full error recovery with suggestions
   - Location tracking for error reporting
   - Supports classes, modules, async/await, pipelines

3. **Interpreter** (`wang-interpreter.js`): Executes the CST
   - Pluggable module resolver interface
   - Multiple resolver implementations (Memory, IndexedDB, HTTP, Composite)
   - Execution contexts with variable/function scoping
   - Comprehensive error reporting with stack traces

4. **Module Resolvers**:
   - `InMemoryModuleResolver`: For testing and temporary modules
   - `IndexedDBModuleResolver`: Browser persistent storage
   - `HTTPModuleResolver`: Load modules from URLs
   - `CompositeModuleResolver`: Chain multiple resolvers with fallback

## Language Syntax

### Modern JavaScript-like Syntax

```javascript
// Variables and imports
import { ProfileExtractor } from "./modules/extractor.wang"
let profiles = querySelectorAll(".profile-card")
const API_URL = "https://api.example.com"

// Pipeline operators
profiles 
  |> filter(_, "active")           // Pipe operator
  |> map(_, extractProfile)
  -> store("results")              // Arrow operator

// Classes and interfaces
class LinkedInWorkflow extends Workflow {
  async process(profiles) {
    for (let profile of profiles) {
      let decision = await this.judge(profile)
      if (decision === "save") {
        profile |> querySelector(".save-btn") |> click
      }
    }
  }
}

// Template literals and modern features
let url = `${API_URL}/user/${userId}`
let { name, email } = getUserData()
let filtered = profiles?.filter(p => p.active) ?? []
let title = titles.data?.[0]?.textContent  // Optional chaining with computed access
```

## How to Use

### Basic Usage

```javascript
import { WangInterpreter, InMemoryModuleResolver } from "./wang-interpreter.js"

// Create module resolver
const resolver = new InMemoryModuleResolver()
resolver.addModule("myModule", `
  export function processData(data) {
    return data |> filter(_, active) |> sort()
  }
`)

// Create interpreter with custom functions
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    querySelector: (s) => document.querySelector(s),
    filter: (arr, pred) => arr.filter(pred),
    sort: (arr) => arr.sort()
  }
})

// Set JavaScript objects as variables (v0.11.1+)
interpreter.setVariable('Math', Math)
interpreter.setVariable('JSON', JSON)
interpreter.setVariable('customAPI', myAPIObject)

// Execute Wang code
await interpreter.execute(`
  import { processData } from "myModule"
  let result = processData(myData)
  log(result)
`)
```

### Module Resolution

Implement your own module resolver:

```javascript
class MyCustomResolver extends ModuleResolver {
  async resolve(modulePath, fromPath) {
    // Your logic to find and return module code
    return { code: moduleCode, path: resolvedPath }
  }
  
  async exists(modulePath) {
    // Check if module exists
    return true/false
  }
  
  async list(prefix) {
    // Return available modules for autocomplete
    return ["module1", "module2"]
  }
}
```

## Development Commands

```bash
# Build the project (required before using CLI tools)
npm run build

# Run CLI tools (after building)
npx wang-run examples/hello.wang
npx wang-validate examples/hello.wang

# Development examples
node example-usage.js

# Test CLI tools
npm run build && npx wang-run examples/hello.wang --verbose
npm run build && echo 'console.log("Hello from stdin!")' | npx wang-run -
```

## Key Features

1. **CSP-Safe Execution**:
   - Nearly parser generates CST without eval/new Function
   - Interpreter walks CST nodes, never generates code
   - All functions are pre-registered JavaScript functions
   - Safe for Chrome service worker execution

2. **Pluggable Module System**:
   - Abstract `ModuleResolver` interface
   - Built-in resolvers: Memory, IndexedDB, HTTP, Composite
   - Easy to implement custom resolvers for any storage backend
   - Module caching for performance

3. **Modern Syntax**:
   - JavaScript-like syntax familiar to developers
   - Pipeline operators (`|>` and `->`) for data flow with multiline support
   - Method chaining across lines
   - Classes, interfaces, async/await support
   - Destructuring, template literals, optional chaining
   - JSON-like object literals with newlines

4. **Comprehensive Error Handling**:
   - **Enhanced error messages with full context** (v0.16.1+):
     - Line numbers and column positions from source
     - Module names for imported code
     - Complete call stack traces
     - Variables in scope at error point
     - Intelligent suggestions for fixes
   - **TypeMismatchError** for type-related issues with expected vs received values
   - **UndefinedVariableError** with similar variable name suggestions
   - **Division by zero** detection with operand values
   - **Null/undefined access** protection with descriptive context

5. **Browser Automation Focus**:
   - Bind any DOM manipulation functions
   - Support for async operations and waiting
   - Perfect for LinkedIn/web scraping workflows
   - LLM integration for intelligent decisions

## Enhanced Error Reporting (v0.16.1+)

Wang now provides comprehensive error reporting with full context to help developers quickly identify and fix issues:

### Example Error Output

```
Error: Type mismatch in accessing property 'name' of 'user':
   Expected: object
   Received: object (null)
Location: Line 3, Column 16
Stack Trace:
  - processUser (myModule:5:12)
  - main (<main>:10:8)
Variables in scope:
  - user: null
  - firstName: "John"
  - age: 30
Suggestions:
  - Check that the value is of type object
  - Use type conversion if necessary
  - Verify the data source
```

### Error Types

- **TypeMismatchError**: When a value doesn't match expected type
- **UndefinedVariableError**: Variable not found (with similar name suggestions)
- **WangError**: General runtime errors with context
- **Division by zero**: Shows both operands for debugging
- **Null/undefined access**: Shows what property/method was being accessed

## Language Features Implemented (100% Test Coverage)

Wang achieves **167/167 tests passing** with comprehensive coverage of:

### Core Language Features
- **Variables & Scoping**: `let`, `const`, `var` with proper hoisting and block scoping
- **Functions**: Regular functions, arrow functions, async/await, closures, recursion
- **Classes**: Constructors, methods, inheritance with `super()`, static methods, getters/setters
- **Control Flow**: `if/else`, loops (`for`, `for-in`, `for-of`, `while`, `do-while`), `switch`, `try/catch/finally`
- **Operators**: All arithmetic, comparison, logical, and pipeline operators (`|>`, `->`)

### Modern JavaScript Syntax
- **Data Types**: Objects, arrays, destructuring, template literals, spread/rest parameters, JSON-like multiline objects
- **Modules**: Named imports/exports (`import { name } from "module"`)
- **Async**: Promises, async/await with comprehensive error handling
- **Built-ins**: Error constructor, type conversion functions, array methods
- **Modern Operators**: Optional chaining (`?.`) with computed member access (`?.[expression]`), nullish coalescing (`??`)

### Advanced Features
- **Pipeline Operators**: `|>` (pipe) and `->` (arrow) for elegant data flow with multiline support
- **Method Chaining**: Cross-line method chaining with proper continuation
- **Class Inheritance**: Full OOP support with `extends` and `super()`
- **Module Resolution**: Pluggable resolvers (Memory, IndexedDB, HTTP, Composite)
- **JavaScript Interop**: Direct object injection via `setVariable()` for Math, JSON, and custom objects (v0.11.1+)
- **Error Recovery**: Comprehensive error messages with suggestions
- **CSP Safety**: No `eval()` or `new Function()` usage

### Intentionally Unsupported Features
Some advanced features are intentionally excluded to maintain simplicity:
- Private fields (`#field`) - use naming conventions instead
- Default imports/exports - use named imports for clarity
- Async generators - use regular async functions with arrays
- Tagged template literals - use function calls instead

See `UNSUPPORTED_FEATURES.md` for complete details and workarounds.
