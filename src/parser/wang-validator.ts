/**
 * Wang Language Parser and Validator
 * Provides syntax validation without execution
 */

// Import the generated parser with bundled nearley runtime
// @ts-ignore - Generated file
import { grammar, nearley } from '../generated/wang-grammar.js';

export interface ValidationResult {
  valid: boolean;
  error?: {
    message: string;
    line: number;
    column: number;
    suggestion?: string;
  };
  ast?: any;
}

export interface ParserOptions {
  includeAST?: boolean;
}

export class WangValidator {
  /**
   * Validate Wang code without executing it
   */
  validate(code: string, options: ParserOptions = {}): ValidationResult {
    try {
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

      // Set a reasonable limit for code size to prevent OOM
      const MAX_CODE_LENGTH = 50000; // ~50KB of code
      const MAX_AMBIGUITY = 1000; // Maximum number of parse trees

      if (code.length > MAX_CODE_LENGTH) {
        return {
          valid: false,
          error: {
            message: `Code is too large (${code.length} characters). Maximum supported size is ${MAX_CODE_LENGTH} characters.`,
            line: 1,
            column: 1,
            suggestion: 'Consider splitting your code into multiple modules or files',
          },
        };
      }

      // Use a timeout to prevent infinite parsing
      const startTime = Date.now();
      const PARSE_TIMEOUT = 5000; // 5 seconds

      try {
        parser.feed(code);
      } catch (parseError: any) {
        // Check if it's taking too long
        if (Date.now() - startTime > PARSE_TIMEOUT) {
          return {
            valid: false,
            error: {
              message:
                'Parse timeout: Code structure is too complex for the parser to handle efficiently.',
              line: 1,
              column: 1,
              suggestion: 'Try breaking complex nested expressions into separate statements',
            },
          };
        }
        throw parseError;
      }

      if (parser.results.length === 0) {
        return {
          valid: false,
          error: {
            message: 'No valid parse found',
            line: 0,
            column: 0,
          },
        };
      }

      if (parser.results.length > MAX_AMBIGUITY) {
        return {
          valid: false,
          error: {
            message: `Code is too ambiguous: ${parser.results.length} possible interpretations found (maximum: ${MAX_AMBIGUITY}).`,
            line: 1,
            column: 1,
            suggestion:
              'Simplify complex expressions, especially nested ternary operators and object literals with logical OR operators',
          },
        };
      }

      if (parser.results.length > 1) {
        console.warn(`Grammar ambiguity: ${parser.results.length} possible parses found`);
      }

      return {
        valid: true,
        ast: options.includeAST ? parser.results[0] : undefined,
      };
    } catch (error: any) {
      // Check for stack overflow or memory errors
      if (
        error.message &&
        (error.message.includes('Maximum call stack') || error.message.includes('out of memory'))
      ) {
        return {
          valid: false,
          error: {
            message:
              'Parser ran out of memory: Code contains expressions that are too complex to parse.',
            line: 1,
            column: 1,
            suggestion:
              'Break down complex nested expressions, especially combinations of ternary operators, logical OR, and object literals',
          },
        };
      }
      return this.formatError(error, code);
    }
  }

  /**
   * Format parser errors with helpful suggestions
   */
  private formatError(error: any, code: string): ValidationResult {
    const errorMessage = error.message || error.toString();

    // Extract line and column from error message
    const match = errorMessage.match(/line (\d+) col (\d+)/);
    const line = match ? parseInt(match[1]) : 0;
    const column = match ? parseInt(match[2]) : 0;

    // Build formatted message with context
    const lines = code.split('\n');
    let formattedMessage = '';

    // Check if this is a Nearley parse error with location info
    if (match && line > 0) {
      formattedMessage = `Parse error: Syntax error at line ${line} col ${column}:\n\n`;
      // Add context lines (show 2 lines before the error if possible)
      const startLine = Math.max(0, line - 3);
      const endLine = Math.min(lines.length, line);
      for (let i = startLine; i < endLine; i++) {
        const lineNum = i + 1;
        const lineContent = lines[i];
        const lineNumStr = String(lineNum).padStart(String(line).length, ' ');
        formattedMessage += `${lineNumStr} ${lineContent}\n`;
      }
      // Add the error pointer
      formattedMessage += ' '.repeat(String(line).length + column) + '^\n';
      // Add the token info from the error message
      const unexpectedMatch = errorMessage.match(/Unexpected (.+?) token: "(.+?)"/);
      if (unexpectedMatch) {
        formattedMessage += `Unexpected ${unexpectedMatch[1]} token: "${unexpectedMatch[2]}". `;
      }
      // Add expectations
      const expectationsMatch = errorMessage.match(
        /Instead, I was expecting to see one of the following:([\s\S]*)/,
      );
      if (expectationsMatch) {
        formattedMessage += 'Instead, I was expecting to see one of the following:\n';
        // Extract and format the expectations
        const expectations = expectationsMatch[1].trim();
        const expectationLines = expectations.split('\n').slice(0, 10); // Limit to first 10 expectations
        for (const expLine of expectationLines) {
          if (expLine.trim()) {
            formattedMessage += '\n' + expLine;
          }
        }
        if (expectations.split('\n').length > 10) {
          formattedMessage += '\n... and more';
        }
      }
    } else {
      // Fallback to original error message if we can't parse it
      formattedMessage = errorMessage;
    }

    // Provide specific suggestions for common errors
    let suggestion: string | undefined;

    // Check if error occurs near regex patterns with HTML-like content
    if (
      (errorMessage.includes('Unexpected identifier') || errorMessage.includes('Unexpected /')) &&
      line > 0 &&
      lines[line - 1] &&
      lines[line - 1].includes('match(')
    ) {
      suggestion =
        'This appears to be a regex pattern containing HTML tags (e.g., </a>). The parser may be interpreting "</" as operators. ' +
        'Try escaping the forward slash in closing tags: "<\\/a>" instead of "</a>".';
    } else if (
      errorMessage.includes('Unexpected ) token') ||
      errorMessage.includes('Unexpected }')
    ) {
      suggestion =
        'Check for missing commas between object properties, or a missing closing brace/bracket earlier in the code.';
    } else if (errorMessage.includes('Unexpected NL token') && errorMessage.includes('=>')) {
      suggestion =
        'Arrow functions with newlines require braces. Change "=> \\n expression" to either "=> expression" (single line) or "=> { return expression }" (with braces).';
    } else if (errorMessage.includes('Unexpected NL token') && errorMessage.includes('ArrowBody')) {
      suggestion =
        'Multi-line arrow function bodies must use braces. Wrap your expression in { return ... }';
    } else if (errorMessage.includes('Unexpected identifier')) {
      suggestion = 'Check for missing operators, commas, or semicolons between statements.';
    }

    return {
      valid: false,
      error: {
        message: formattedMessage,
        line,
        column,
        suggestion,
      },
    };
  }

  /**
   * Check if code has specific syntax patterns
   */
  checkSyntaxPatterns(code: string): {
    hasMultilineArrows: boolean;
    hasAsyncAwait: boolean;
    hasClasses: boolean;
    hasModules: boolean;
  } {
    return {
      hasMultilineArrows: /=>\s*\n\s*[^{]/.test(code),
      hasAsyncAwait: /\basync\b|\bawait\b/.test(code),
      hasClasses: /\bclass\b/.test(code),
      hasModules: /\bimport\b|\bexport\b/.test(code),
    };
  }

  /**
   * Suggest fixes for common issues
   */
  suggestFixes(code: string): string[] {
    const suggestions: string[] = [];
    const patterns = this.checkSyntaxPatterns(code);

    if (patterns.hasMultilineArrows) {
      suggestions.push(
        'Found multi-line arrow functions without braces. Consider using braces for multi-line arrow function bodies.',
      );
    }

    // Check for common mistakes
    if (/\)\s*\n\s*{/.test(code) && !/"function"/.test(code)) {
      suggestions.push(
        'Found newline between closing parenthesis and opening brace. This might cause parsing issues in some contexts.',
      );
    }

    if (/,\s*}/.test(code)) {
      suggestions.push(
        'Found trailing comma before closing brace. While valid in JavaScript, ensure Wang supports this.',
      );
    }

    return suggestions;
  }
}

// Export a singleton instance for convenience
export const validator = new WangValidator();
