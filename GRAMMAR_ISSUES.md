# Grammar Issues Analysis

## Identified Issues from Failing Tests

### 1. **Function Declaration Ambiguity** ❌
- **Problem**: `function name() {}` is parsed as both FunctionDeclaration and FunctionExpression
- **Tests affected**: parser.test.js - "should parse function declaration" (getting 2-4 results)
- **Root cause**: Both `Declaration -> FunctionDeclaration` and `ExpressionStatement -> FunctionExpression` can match
- **Fix needed**: Restrict FunctionExpression to not allow named functions at statement level

### 2. **Class Body Parsing** ❌  
- **Problem**: Classes with methods fail when there's a newline before closing `}`
- **Tests affected**: 
  - parser.test.js - "should parse class declaration"
  - return-value.test.js - class tests
- **Error**: `Unexpected } token` at end of class body
- **Root cause**: The `OptionalNewlines` rule in ClassMemberList doesn't handle the final newline before `}`
- **Fix needed**: Allow optional newlines before closing `}` in ClassBody

### 3. **Object Literal Newlines** ✅ (Fixed)
- **Problem**: Nested object literals failed with newlines
- **Status**: Already fixed by adding `%NL:*` in ObjectLiteral rule

### 4. **Multiple Statement Ambiguity** ✅ (Fixed)
- **Problem**: Multiple statements were creating 4 parse results
- **Status**: Fixed by simplifying StatementList separators

### 5. **Try-Catch-Finally Ambiguity** ✅ (Fixed)
- **Problem**: Was getting 2 parse results
- **Status**: Now working correctly (1 result)

## Patterns in E2E Test Failures

### Common Parse Errors:
1. **Unexpected `}` token**: Occurring in class bodies when methods don't have semicolons
2. **Unexpected `NL` token**: Happening in complex nested structures
3. **Function/Expression ambiguity**: Named functions being parsed multiple ways

### Features Failing:
- Class inheritance (`extends`)
- Static methods
- Getters/setters
- Method chaining
- Switch statements
- Complex pipelines
- Destructuring with renaming
- Increment/decrement operators
- Template literals with expressions

## Priority Fixes

1. **Fix Function Declaration Ambiguity** - Affects basic parsing
2. **Fix Class Body Newline Handling** - Blocks all class-based tests
3. **Add missing operator support** - Increment/decrement (`++`, `--`)
4. **Fix destructuring edge cases** - Renaming syntax