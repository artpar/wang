# Grammar Redesign Analysis

## The Core Problem

We're fighting against Nearley's fundamental nature. Nearley generates **all possible parse trees**, which creates exponential ambiguity with JavaScript's flexible syntax. Every `(A | B)+` creates 2^n parse paths.

## Root Issues

### 1. **The Separator Problem**
```nearley
# This creates massive ambiguity:
Sep -> (";" | %NL)+  # 2 newlines = 1 sep of 2 NL, or 2 seps of 1 NL each

# We tried:
ClassMemberList -> ... | ClassMemberList Sep ClassMember | ...
# Result: 20+ identical parse trees
```

### 2. **JavaScript's Inherent Ambiguity**
- `function f() {}` - Declaration or Expression?
- `{a: 1}` - Object literal or Block with label?
- `(x)` - Grouped expression or function parameter?
- ASI rules - When is newline significant?

### 3. **Nearley's All-Paths Parsing**
Unlike PEG parsers (first match wins) or LR parsers (deterministic), Nearley explores ALL possibilities. This is good for catching ambiguity but bad for intentionally flexible syntax.

## Strategic Options

### Option 1: Work WITH Nearley's Nature
**Accept ambiguity, handle it systematically**

```javascript
// Post-processor that handles benign ambiguity
class GrammarPostProcessor {
  process(parseResults) {
    if (parseResults.length === 1) return parseResults[0];
    
    // Check all results produce same AST
    const canonical = JSON.stringify(parseResults[0]);
    const allSame = parseResults.every(r => 
      JSON.stringify(r) === canonical
    );
    
    if (allSame) {
      return parseResults[0]; // Benign ambiguity
    } else {
      // Real ambiguity - need disambiguation rules
      return this.disambiguate(parseResults);
    }
  }
}
```

### Option 2: Eliminate Ambiguity at Grammar Level
**Use more restrictive, unambiguous patterns**

```nearley
# Instead of flexible separators, use rigid structure:
ClassBody -> "{" ClassMemberSequence "}"

ClassMemberSequence ->
    ε                                    {% () => [] %}
  | ClassMember                          {% d => [d[0]] %}
  | ClassMember ";" ClassMemberSequence  {% d => [d[0], ...d[2]] %}
  | ClassMember %NL ClassMemberSequence  {% d => [d[0], ...d[2]] %}

# Single path through the grammar
```

### Option 3: Grammar Macros/Preprocessing
**Generate consistent patterns programmatically**

```javascript
// Grammar preprocessor
function generateList(name, item, separator) {
  return `
    ${name} ->
        null                      {% () => [] %}
      | ${item}                   {% d => [d[0]] %}
      | ${name} ${separator} ${item}  {% d => [...d[0], d[2]] %}
      | ${name} ${separator}      {% d => d[0] %}
  `;
}

// Generate all lists consistently
generateList('StatementList', 'Statement', 'StatementSep');
generateList('ClassMemberList', 'ClassMember', 'MemberSep');
generateList('PropertyList', 'Property', 'PropertySep');
```

### Option 4: Alternative Parser Strategy
**Consider if Nearley is the right tool**

| Parser Type | Pros | Cons |
|------------|------|------|
| **PEG (Ohm.js)** | No ambiguity, ordered choice | Different paradigm, learning curve |
| **Hand-written** | Full control, optimal | Time-consuming, error-prone |
| **ANTLR** | Powerful, good tooling | Java-based, heavy |
| **Tree-sitter** | Incremental, error recovery | C-based, complex |
| **Chevrotain** | Pure JS, CSP-safe | Verbose, different API |

## Recommended Approach: Hybrid Solution

### Phase 1: Systematic Ambiguity Handling (Quick Win)
1. **Accept benign ambiguity** - Multiple parses that produce identical ASTs are OK
2. **Add disambiguator** - Post-process to select canonical parse
3. **Test for semantic equivalence** - Ensure all parses mean the same thing

### Phase 2: Consistent Grammar Patterns (Maintainability)
1. **Create grammar template system** - Generate lists, separators consistently
2. **Single separator strategy** - One pattern used everywhere
3. **Document ambiguity points** - Know where and why ambiguity exists

### Phase 3: Build Pipeline Fix (Developer Experience)
1. **Fix ESM generation** - Automatic, no manual fixes
2. **Add grammar validation** - Detect ambiguity early
3. **Better error messages** - Help users understand parse failures

## Concrete Next Steps

### 1. Create Universal List Pattern
```nearley
# Universal pattern for any separated list
@{%
function makeList(first, rest) {
  return rest ? [first, ...rest] : [first];
}

function makeOptionalList(list) {
  return list || [];
}
%}

# Macro-like pattern (manually expanded for now)
SepList[Item, Sep] ->
    null                        {% () => [] %}
  | $Item                       {% d => [d[0]] %}
  | SepList $Sep $Item         {% d => [...d[0], d[2]] %}
  | SepList $Sep               {% d => d[0] %}
```

### 2. Implement Smart Post-Processor
```javascript
// In wang-parser.js
export class WangParser {
  parse(code) {
    const parser = new nearley.Parser(grammar);
    parser.feed(code);
    
    if (parser.results.length === 0) {
      throw new Error('No parse found');
    }
    
    if (parser.results.length === 1) {
      return parser.results[0];
    }
    
    // Multiple parses - check if benign
    return this.selectBestParse(parser.results);
  }
  
  selectBestParse(results) {
    // For now, just check they're identical
    const first = JSON.stringify(results[0]);
    const allSame = results.every(r => JSON.stringify(r) === first);
    
    if (allSame) {
      return results[0];
    }
    
    // Apply disambiguation rules
    // Prefer declarations over expressions
    // Prefer object literals over blocks
    // etc.
    return this.disambiguate(results);
  }
}
```

### 3. Fix Build Process
```javascript
// scripts/build-grammar.js
import { readFileSync, writeFileSync } from 'fs';
import { compile } from 'nearley/lib/compile';
import { generate } from 'nearley/lib/generate';

function buildGrammar() {
  const grammar = readFileSync('src/grammar/wang.ne', 'utf8');
  
  // Compile grammar
  const compiled = compile(grammar);
  
  // Generate ES module
  const output = `
    import moo from 'moo';
    ${generated}
    export default grammar;
  `;
  
  writeFileSync('src/generated/wang-grammar.js', output);
}
```

## The Key Insight

**We're not building a parser for an unambiguous language - we're building a parser for JavaScript-like syntax, which is inherently ambiguous.** 

Instead of fighting this, we should:
1. **Embrace benign ambiguity** - Multiple valid parses that mean the same thing
2. **Handle real ambiguity** - Clear disambiguation rules when parses differ
3. **Focus on semantics** - What the code means, not how many ways to parse it

This approach aligns with how real JavaScript parsers work - they have disambiguation rules and error recovery, not perfectly unambiguous grammars.