# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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