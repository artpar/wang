# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take security seriously in Wang Language, especially given its use in browser automation contexts.

### How to Report

Please report security vulnerabilities by:

1. **Email**: Send details to security@wang-lang.dev (once available)
2. **GitHub**: Open a security advisory in the [Security tab](https://github.com/artpar/wang/security/advisories)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Time

- We aim to acknowledge receipt within 48 hours
- We'll provide an initial assessment within 1 week
- We'll work on a fix and coordinate disclosure

### Security Considerations

Wang is designed to be CSP-safe and runs without:
- `eval()` 
- `new Function()`
- Dynamic code generation

This makes it inherently safer for use in restricted environments like Chrome service workers.

## Security Best Practices

When using Wang:

1. **Never execute untrusted code** - Always validate and sanitize user input
2. **Limit function bindings** - Only bind necessary functions to the interpreter
3. **Use module isolation** - Keep sensitive operations in separate modules
4. **Validate module sources** - Ensure modules come from trusted sources
5. **Apply principle of least privilege** - Give minimum necessary permissions

## Known Security Features

- ✅ CSP-safe execution (no eval/new Function)
- ✅ Sandboxed execution context
- ✅ Module isolation
- ✅ No access to global scope by default
- ✅ Controlled function binding

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve Wang's security.