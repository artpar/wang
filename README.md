# @wang-lang/core

A CSP-safe workflow programming language for browser automation, designed to run in Chrome service workers and other restricted JavaScript environments.

[![npm version](https://img.shields.io/npm/v/@wang-lang/core.svg)](https://www.npmjs.com/package/@wang-lang/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

- = **100% CSP-Safe** - No `eval()` or `new Function()`, runs safely in Chrome service workers
- =� **Modern JavaScript-like Syntax** - Familiar syntax with classes, modules, async/await
- =' **Pluggable Module System** - Implement your own module resolution (memory, IndexedDB, HTTP, etc.)
- =� **Comprehensive Error Reporting** - Detailed error messages with line numbers and recovery suggestions
- < **Browser Automation Focus** - Built for DOM manipulation and web workflows
- >� **Pipeline Operators** - Elegant data flow with `|>` and `->` operators

## Installation

```bash
npm install @wang-lang/core
```

## Quick Start

```javascript
import { WangInterpreter, InMemoryModuleResolver } from '@wang-lang/core';

// Create a module resolver
const resolver = new InMemoryModuleResolver();

// Add a module
resolver.addModule('utils', `
  export function processData(data) {
    return data 
      |> filter(_, item => item.active)
      |> map(_, item => item.name)
      |> sort()
  }
`);

// Create interpreter with custom functions
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    filter: (arr, pred) => arr.filter(pred),
    map: (arr, fn) => arr.map(fn),
    sort: (arr) => arr.sort(),
    log: console.log
  }
});

// Execute Wang code
await interpreter.execute(`
  import { processData } from "utils"
  
  let data = [
    { name: "Alice", active: true },
    { name: "Bob", active: false },
    { name: "Charlie", active: true }
  ]
  
  let result = processData(data)
  log(result)  // ["Alice", "Charlie"]
`);
```

## Language Syntax

Wang uses a modern JavaScript-like syntax with additional pipeline operators:

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

// Classes
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

// Modern features
let url = `${API_URL}/user/${userId}`
let { name, email } = getUserData()
let filtered = profiles?.filter(p => p.active) ?? []
```

## Module Resolution

Wang provides a pluggable module resolution system. Implement your own resolver:

```javascript
import { ModuleResolver } from '@wang-lang/core';

class MyCustomResolver extends ModuleResolver {
  async resolve(modulePath, fromPath) {
    // Your logic to find and return module code
    const code = await fetchModuleFromSomewhere(modulePath);
    return { code, path: modulePath };
  }
  
  async exists(modulePath) {
    // Check if module exists
    return await checkIfModuleExists(modulePath);
  }
  
  async list(prefix) {
    // Return available modules for autocomplete
    return await getAvailableModules(prefix);
  }
}

const interpreter = new WangInterpreter({
  moduleResolver: new MyCustomResolver()
});
```

### Built-in Resolvers

- **InMemoryModuleResolver** - Store modules in memory (great for testing)
- **IndexedDBModuleResolver** - Persist modules in browser storage
- **HTTPModuleResolver** - Load modules from URLs
- **CompositeModuleResolver** - Chain multiple resolvers with fallback

## Browser Automation Example

```javascript
// Define a workflow module
resolver.addModule('linkedin-workflow', `
  export async function extractProfiles() {
    let profiles = querySelectorAll(".profile-card")
    let results = []
    
    for (let profile of profiles) {
      let data = {
        name: profile |> querySelector(".name") |> getText,
        title: profile |> querySelector(".title") |> getText,
        company: profile |> querySelector(".company") |> getText
      }
      
      results.push(data)
      await wait(1000)  // Rate limiting
    }
    
    return results
  }
`);

// Bind DOM functions
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    querySelectorAll: (sel) => [...document.querySelectorAll(sel)],
    querySelector: (el, sel) => el.querySelector(sel),
    getText: (el) => el?.innerText || "",
    wait: (ms) => new Promise(r => setTimeout(r, ms))
  }
});

// Execute the workflow
await interpreter.execute(`
  import { extractProfiles } from "linkedin-workflow"
  
  let profiles = await extractProfiles()
  log(\`Found \${profiles.length} profiles\`)
`);
```

## Error Handling

Wang provides comprehensive error reporting with helpful suggestions:

```javascript
try {
  await interpreter.execute(`
    let x = undefinedVariable + 5
  `);
} catch (error) {
  console.log(error.getFormattedMessage());
  // L Runtime Error at line 2, column 13:
  //    let x = undefinedVariable + 5
  //            ^^^^^^^^^^^^^^^^^
  //    
  //    Variable "undefinedVariable" is not defined
  //    
  //    =� Suggestions:
  //    1. Check for typos in the variable name
  //    2. Ensure the variable is declared before use
  //    
  //    =� Variables in scope:
  //    " console: [object]
  //    " log: [function]
}
```

## CSP Safety

Wang is designed to run in Content Security Policy restricted environments where `eval()` and `new Function()` are blocked:

```html
<!-- Strict CSP that blocks eval -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self';">

<script type="module">
  import { WangInterpreter } from '@wang-lang/core';
  
  // This works even with strict CSP!
  const interpreter = new WangInterpreter();
  await interpreter.execute('log("Hello from Wang!")');
</script>
```

## API Documentation

### WangInterpreter

The main interpreter class.

```typescript
class WangInterpreter {
  constructor(options?: {
    moduleResolver?: ModuleResolver;
    functions?: Record<string, Function>;
  });
  
  execute(code: string): Promise<any>;
  bindFunction(name: string, fn: Function): void;
}
```

### ModuleResolver

Base class for implementing module resolution.

```typescript
abstract class ModuleResolver {
  abstract resolve(modulePath: string, fromPath?: string): Promise<ModuleResolution>;
  abstract exists(modulePath: string, fromPath?: string): Promise<boolean>;
  abstract list(prefix?: string): Promise<string[]>;
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build

# Run linter
npm run lint

# Generate documentation
npm run docs
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Works in:
-  Browser main thread
-  Web Workers
-  Service Workers
-  Chrome Extensions (with CSP)
-  Electron apps

## License

MIT � 2024

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## Links

- [GitHub Repository](https://github.com/artpar/wang)
- [npm Package](https://www.npmjs.com/package/@wang-lang/core)
- [Documentation](https://github.com/artpar/wang#readme)
- [Issue Tracker](https://github.com/artpar/wang/issues)
