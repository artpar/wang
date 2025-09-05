# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.21.0] - 2025-01-05

### Added
- **Multiline Expressions**: Full support for multiline conditionals and expressions
  - Complex conditionals can span multiple lines with proper indentation
  - Newlines supported around all binary operators (`&&`, `||`, `??`, `==`, `!=`, `+`, `-`, etc.)
  - Multiline support for for/while/do-while loop conditions
  - Multiline ternary operator expressions with nested indentation
  - Multiline parenthesized expressions for better code organization
  - No breaking changes - all existing code continues to work
  - Comprehensive test suite with 17 tests covering all multiline scenarios
  - Addresses real-world use cases like complex form validation and URL filtering

## [0.18.0] - 2025-01-03

### Added
- **Template Literals**: Full support for template strings with expression interpolation
  - CSP-safe implementation using Wang's own parser (no eval/new Function)
  - Supports all expression types: variables, arithmetic, object access, function calls
  - Proper escape sequence processing (`\n`, `\t`, `\\`, `\$`, etc.)
  - Null and undefined values correctly convert to string representation
  - Known limitations: Nested template literals throw parse errors (architectural constraint)
  - Invalid expressions in templates are left unevaluated as fail-safe behavior
  - Comprehensive test suite with 36 tests documenting all behaviors

## [Unreleased]

### Fixed
- **Grammar**: Fixed method chaining on `new` expressions (e.g., `new Date().toISOString()`)
  - Previously required parentheses: `(new Date()).toISOString()`
  - Now works without parentheses as expected in JavaScript
  - Supports property access, method calls, and computed member access on newly created instances
  - Added comprehensive test coverage for various chaining scenarios

### Added
- **CLI Tools**: New command-line interface for executing and validating Wang files
  - `wang-run`: Execute .wang files from command line with built-in functions and global objects
    - Supports file execution (`wang-run script.wang`) and stdin input (`wang-run -`)
    - Verbose mode (`--verbose`) for detailed execution information
    - Quiet mode (`--quiet`) for output-only display
    - Built-in console functions, array utilities (filter, map), Math, JSON, Date, and process objects
    - Comprehensive error handling with formatted output
  - `wang-validate`: Enhanced validation tool (existing functionality)
    - Support for AST display, syntax suggestions, and stdin validation
  - Both tools work seamlessly with `npx` for easy execution without global installation
  - Comprehensive test suite with 15+ CLI-specific test scenarios
  - Example `.wang` files included in `/examples` directory

- **WangValidator**: New syntax validation API for checking Wang code without execution
  - `validate()` method for syntax checking with optional AST extraction
  - `checkSyntaxPatterns()` for detecting specific language features in code
  - `suggestFixes()` for identifying common issues and providing recommendations
  - Detailed error messages with line/column information and visual context
  - Context-aware suggestions for common syntax errors (regex patterns, arrow functions, etc.)
  - Perfect for IDE integrations, linting tools, and pre-execution validation
  - Exported as both `WangValidator` class and `validator` singleton instance

## [0.12.0] - 2025-01-01

### Added
- **Console Capture**: New metadata API for capturing console output from Wang code
  - `execute()` method now supports optional `withMetadata` parameter
  - When enabled, returns `{ result, metadata: { logs } }` with all console.log, warn, and error outputs
  - Each captured log includes type, arguments, and timestamp
  - Fully backward compatible - default behavior returns just the result
  - Comprehensive test suite with 20+ test scenarios covering all aspects

### Changed
- Enhanced `bindBuiltins()` to capture console outputs when logging from Wang code
- Updated TypeScript method signatures with proper overloads for type safety
- Test suite expanded to include console capture tests

### Technical Details
- Console logs are captured in a dedicated array that's cleared on each execution
- Timestamps are captured using `Date.now()` for each log entry
- Internal module imports don't affect user-facing console capture
- Full backward compatibility maintained through optional parameter approach

## [0.8.1] - 2024-12-27

### Added
- **Optional Chaining with Computed Member Access**: Full support for `?.[expression]` syntax
  - Works with arrays: `titles.data?.[0]?.textContent`
  - Works with dynamic indices: `matrix?.[row]?.[col]?.value`
  - Works with complex expressions: `obj?.[computedKey]?.nested?.[i]`
  - Maintains CSP-safety and zero-ambiguity grammar
  - Comprehensive test coverage with 11 test scenarios

### Changed
- Test suite expanded from 333 to 334 tests (99.4% passing - 334/336)
- Updated grammar with unified OptionalMemberAccess rule to eliminate parser ambiguity
- Enhanced documentation with optional chaining examples throughout

### Technical Details
- Implemented unified grammar rule for optional member access handling both identifier and computed access patterns
- Eliminated Nearley parser ambiguity by creating single `OptionalMemberAccess` rule instead of separate ambiguous rules
- Full backwards compatibility maintained - all existing optional chaining continues to work

## [0.8.0] - 2024-12-27

### Added
- **Advanced Pipeline Features**: Major enhancements to pipeline operators
  - **Chained Pipelines**: Multiple pipelines can now be chained on the same line (`data |> filter() |> map() |> sort()`)
  - **Nested Pipelines**: Full support for nested pipelines in single-line expressions (`groups |> map(_, g => g |> filter())`)
  - **Pipeline Continuations in Blocks**: Multiline pipelines now work correctly in if/for/while block statements
  - **Improved Grammar**: Fixed expression hierarchy to properly support pipelines in variable declarations
  - **Synchronous Pipeline Support**: Added PipelineExpression handling in synchronous evaluation contexts

### Fixed
- **Pipeline Operator Fixes**:
  - Fixed "Unknown node type: PipelineContinuation" error in block statements
  - Fixed pipeline continuations in assignment expressions
  - Fixed nested pipeline execution with proper value passing
  - Fixed pipeline re-execution bug in loops (cached processed continuations)
  - Fixed `get` function to handle numeric indices correctly
  - Made stdlib functions async to handle async arrow functions in pipelines

### Changed
- Test suite expanded from 283 to 333 tests (99.4% passing - 333/335)
- Two edge cases documented as known limitations (multiline arrow functions, ternary pipeline continuations)
- Updated documentation with comprehensive pipeline examples and workarounds

### Documentation
- Added detailed pipeline operator examples showing chaining and nesting
- Documented pipeline limitations and workarounds
- Updated test coverage metrics in README

## [0.7.1] - 2024-12-27

### Fixed
- **Compound Assignment Operators**: Fixed critical runtime bugs in `+=`, `-=`, `*=`, `/=` operators
  - Resolved variable scoping issues causing "Cannot access 'ctx' before initialization" errors
  - Implemented missing `*=` and `/=` operators in interpreter (were only in grammar)
  - Added proper const variable protection for all compound operators
  - Fixed member expression compound assignments for objects and arrays
  - Added division by zero protection for `/=` operator
  - All compound assignment operators now fully functional

### Added
- Comprehensive E2E test suite for compound assignment operators (27 new tests)
  - Tests for basic operators, object properties, array elements
  - Tests for scoping, closures, and type coercion
  - Tests for integration with other operators
  - All tests verify actual execution, not just parsing

### Changed
- Total test count increased from 256 to 283 (all passing)

## [0.6.2] - 2025-08-27

### Added
- **Compound Assignment Operators**: Added `+=`, `-=`, `*=`, and `/=` operators for basic arithmetic compound assignments
  - Simple, clean syntax for common operations: `counter += 5`, `value *= 2` 
  - Maintains Wang's zero-ambiguity grammar principles
  - Only basic math operators included to keep complexity low

### Fixed
- Fixed flaky timing test in stdlib sleep/wait function (improved timing tolerance)
- All 256 tests now consistently pass

## [0.6.1] - 2025-08-27

### Removed
- **Breaking**: Removed `is_undefined` function from stdlib due to interpreter compatibility issues
  - Users should use `val === undefined` for undefined checking
  - Updated documentation to reflect this change

### Fixed
- Resolved test failures in stdlib suite (all 256 tests now pass)

## [0.6.0] - 2024-12-27

### Added
- **Standard Library**: 70+ built-in functions automatically available globally
  - Array operations: `sort_by`, `unique`, `unique_by`, `group_by`, `chunk`, `flatten`, `zip`, `partition`, `compact`, `at`
  - Object operations: `pick`, `omit`, `merge`, `clone`, `get`, `set`, `has`
  - String operations: `upper`, `lower`, `capitalize`, `trim`, `split`, `join`, `replace_all`, `starts_with`, `ends_with`, `truncate`
  - Math operations: `sum`, `avg`, `median`, `clamp`, `random_int`
  - Type checking: `is_array`, `is_object`, `is_string`, `is_number`, `is_boolean`, `is_null`, `is_empty`
  - Functional utilities: `count`, `find`, `find_index`, `every`, `some`, `map`, `filter`, `reduce`, `for_each`
  - Utility functions: `range`, `uuid`, `to_json`, `from_json`, `encode_base64`, `decode_base64`, `sleep`
- All stdlib functions use snake_case naming convention
- All operations are immutable and return new values
- Functions designed to work naturally with pipeline operators
- Comprehensive test suite for stdlib (38 new tests)

### Documentation
- Updated README with Standard Library section and examples
- Added complete stdlib reference to WANG_LANGUAGE_REFERENCE.md
- Updated test count from 183 to 256 tests

## [0.5.0] - 2024-12-27

### Added
- **Ternary Conditional Operator** (`condition ? true : false`)
  - Single-line only to avoid grammar ambiguity
  - Full support for nested ternary expressions
  - Works with all expression types
- **Increment/Decrement Operators** (`++` and `--`)
  - Prefix and postfix modes supported
  - Works with identifiers and member expressions
  - Supports complex expressions like `this.count++` and `obj.prop--`
- Comprehensive test coverage for new operators (51 new tests)

### Changed
- Grammar updated to support new operators while maintaining zero ambiguity
- Updated interpreter to handle UpdateExpression nodes
- Enhanced member expression evaluation for increment/decrement

### Documentation
- Updated feature list in README to include new operators
- Added ternary and increment/decrement examples to language reference
- Updated test count from 132 to 183 tests

## [0.4.5] - 2024-12-26

### Added
- **Return Value Feature**: The interpreter now returns the last evaluated expression as the result of execution
  - Makes Wang perfect for REPL usage and workflow results
  - Supports all expression types: primitives, objects, arrays, pipeline results
  - Declarations return `undefined` when they are the last statement
- Comprehensive documentation for return values in `docs/RETURN_VALUES.md`
- Complete test suite for return value behavior (14 tests)
- Updated README with return value examples and feature highlight
- Added return value section to WANG_LANGUAGE_REFERENCE.md

### Fixed
- CommonJS build now properly resolves directory imports to `index.cjs`
- Fixed build script to detect and convert directory imports correctly
- Published npm package v0.4.3+ with working CommonJS imports

### Documentation
- Added "Implicit Return Values" to feature list in README
- Created comprehensive RETURN_VALUES.md documentation with examples
- Updated language reference with return value rules and examples
- Added workflow examples showing return value usage

## [0.4.0] - 2024-12-26

### Added
- Comprehensive Metadata API for compilation and execution analysis
  - Token and AST node tracking with statistics
  - Module resolution and dependency graph generation
  - Function call and variable access profiling
  - Control flow and pipeline operation tracking
  - Live execution state and path recording
  - Export capability for external tools
- MetadataCollector class for easy integration with interpreter
- Query methods for hot functions, hot variables, and execution insights
- Full test suite for metadata API (43 tests)

### Changed
- Updated documentation to include Metadata API usage examples
- Enhanced README with metadata feature highlights

## [0.1.0] - 2024-01-25

### Added
- Initial release of Wang Language
- CSP-safe interpreter that runs without eval() or new Function()
- Modern JavaScript-like syntax with classes, modules, and async/await
- Full class inheritance support with extends and super()
- Pipeline operators (|> and ->) for elegant data flow
- Pluggable module system with memory, IndexedDB, and HTTP resolvers
- Comprehensive error reporting with line numbers and suggestions
- Robust variable scoping (const, let, var) with proper semantics
- Support for arrow functions and regular functions
- Template literals (basic support)
- Spread operator and rest parameters
- For...of and for...in loops
- Try/catch/finally error handling
- Module imports and exports
- Object and array destructuring (partial)
- Method chaining support
- Vitest-based test suite with 66/90 tests passing

### Known Issues
- Default parameters in functions not yet implemented
- Static methods in classes not working
- Private fields (#field) not supported
- Switch statements not implemented
- Do-while loops not implemented
- Async generators not supported
- Template literals with expressions need fixes
- Some module system features incomplete (default exports, namespace imports)