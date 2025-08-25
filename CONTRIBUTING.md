# Contributing to Wang Language

Thank you for your interest in contributing to Wang! We welcome contributions from the community.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building something together!

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists
2. Create a new issue using the bug report template
3. Include:
   - Clear description
   - Reproduction steps
   - Expected vs actual behavior
   - Environment details

### Suggesting Features

1. Check existing feature requests
2. Open a feature request issue
3. Explain the use case and benefits
4. Provide example syntax if applicable

### Contributing Code

#### Setup

```bash
# Clone the repo
git clone https://github.com/artpar/wang.git
cd wang

# Install dependencies
npm install

# Build the grammar
npm run build:grammar

# Run tests
npm test
```

#### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add/update tests
5. Run tests (`npm test`)
6. Check linting (`npm run lint`)
7. Commit with conventional commits (`feat:`, `fix:`, etc.)
8. Push to your fork
9. Open a Pull Request

#### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Adding tests
- `chore:` Maintenance tasks
- `ci:` CI/CD changes

Examples:
```
feat: add support for async generators
fix: correct pipeline operator precedence
docs: update class inheritance examples
```

#### Code Style

- Use TypeScript for new code
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused

#### Testing

- Write tests for new features
- Update tests for changes
- Ensure all tests pass
- Aim for good coverage

Test files go in:
- `tests/unit/` - Unit tests
- `tests/e2e/` - End-to-end tests

#### Grammar Changes

If modifying the grammar (`src/grammar/wang.ne`):

1. Ensure no ambiguity is introduced
2. Rebuild grammar: `npm run build:grammar`
3. Test thoroughly
4. Document the syntax change

### Areas Needing Help

Current priorities:

1. **Language Features**
   - Default parameters in functions
   - Static methods in classes
   - Private fields (#field)
   - Switch statements
   - Do-while loops

2. **Module System**
   - Default exports/imports
   - Namespace imports
   - Re-exports

3. **Documentation**
   - More examples
   - Tutorial content
   - API documentation

4. **Testing**
   - Increase test coverage
   - Browser compatibility tests
   - Performance benchmarks

5. **Tooling**
   - VS Code extension
   - Syntax highlighting
   - Language server

## Development Tips

### Building

```bash
# Full build
npm run build

# Just grammar
npm run build:grammar

# Watch mode for tests
npm run test:watch
```

### Debugging

1. Use `console.log` in interpreter code
2. Check parse tree with `JSON.stringify(ast, null, 2)`
3. Use test files in isolation

### Project Structure

```
wang/
├── src/
│   ├── grammar/       # Nearley grammar
│   ├── interpreter/   # Core interpreter
│   ├── resolvers/     # Module resolvers
│   └── utils/         # Utilities
├── tests/
│   ├── unit/         # Unit tests
│   └── e2e/          # E2E tests
└── docs/             # Documentation
```

## Questions?

- Open a discussion on GitHub
- Check existing issues
- Read the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.