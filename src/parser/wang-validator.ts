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
      parser.feed(code);

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

      if (parser.results.length > 1) {
        console.warn(`Grammar ambiguity: ${parser.results.length} possible parses found`);
      }

      return {
        valid: true,
        ast: options.includeAST ? parser.results[0] : undefined,
      };
    } catch (error: any) {
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

    // Provide specific suggestions for common errors
    let suggestion: string | undefined;

    if (errorMessage.includes('Unexpected NL token') && errorMessage.includes('=>')) {
      suggestion =
        'Arrow functions with newlines require braces. Change "=> \\n expression" to either "=> expression" (single line) or "=> { return expression }" (with braces).';
    } else if (errorMessage.includes('Unexpected NL token') && errorMessage.includes('ArrowBody')) {
      suggestion =
        'Multi-line arrow function bodies must use braces. Wrap your expression in { return ... }';
    } else if (errorMessage.includes('Unexpected }')) {
      suggestion =
        'Check for missing commas between object properties or unclosed parentheses/brackets.';
    } else if (errorMessage.includes('Unexpected identifier')) {
      suggestion = 'Check for missing operators, commas, or semicolons between statements.';
    } else if (errorMessage.includes('|>') || errorMessage.includes('->')) {
      suggestion = 'Pipeline operators must be followed by a valid expression or function call.';
    }

    // Get the problematic line for context
    const lines = code.split('\\n');
    const problemLine = lines[line - 1];

    let formattedMessage = errorMessage.split('\\n')[0];
    if (problemLine) {
      formattedMessage += `\\n\\nProblematic line ${line}:\\n${problemLine}\\n${' '.repeat(column - 1)}^`;
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
    hasPipelines: boolean;
    hasAsyncAwait: boolean;
    hasClasses: boolean;
    hasModules: boolean;
  } {
    return {
      hasMultilineArrows: /=>\s*\n\s*[^{]/.test(code),
      hasPipelines: /\|>|->/.test(code),
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
