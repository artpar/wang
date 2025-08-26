# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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