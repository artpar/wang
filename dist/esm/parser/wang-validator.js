/**
 * Wang Language Parser and Validator
 * Provides syntax validation without execution
 */
// Import the generated parser with bundled nearley runtime
// @ts-ignore - Generated file
import { grammar, nearley } from '../generated/wang-grammar.js';
export class WangValidator {
    /**
     * Validate Wang code without executing it
     */
    validate(code, options = {}) {
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
        }
        catch (error) {
            return this.formatError(error, code);
        }
    }
    /**
     * Format parser errors with helpful suggestions
     */
    formatError(error, code) {
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
            const expectationsMatch = errorMessage.match(/Instead, I was expecting to see one of the following:([\s\S]*)/);
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
        }
        else {
            // Fallback to original error message if we can't parse it
            formattedMessage = errorMessage;
        }
        // Provide specific suggestions for common errors
        let suggestion;
        // Check if error occurs near regex patterns with HTML-like content
        if ((errorMessage.includes('Unexpected identifier') || errorMessage.includes('Unexpected /')) &&
            line > 0 &&
            lines[line - 1] &&
            lines[line - 1].includes('match(')) {
            suggestion =
                'This appears to be a regex pattern containing HTML tags (e.g., </a>). The parser may be interpreting "</" as operators. ' +
                    'Try escaping the forward slash in closing tags: "<\\/a>" instead of "</a>".';
        }
        else if (errorMessage.includes('Unexpected ) token') ||
            errorMessage.includes('Unexpected }')) {
            suggestion =
                'Check for missing commas between object properties, or a missing closing brace/bracket earlier in the code.';
        }
        else if (errorMessage.includes('Unexpected NL token') && errorMessage.includes('=>')) {
            suggestion =
                'Arrow functions with newlines require braces. Change "=> \\n expression" to either "=> expression" (single line) or "=> { return expression }" (with braces).';
        }
        else if (errorMessage.includes('Unexpected NL token') && errorMessage.includes('ArrowBody')) {
            suggestion =
                'Multi-line arrow function bodies must use braces. Wrap your expression in { return ... }';
        }
        else if (errorMessage.includes('Unexpected identifier')) {
            suggestion = 'Check for missing operators, commas, or semicolons between statements.';
        }
        else if (errorMessage.includes('|>') || errorMessage.includes('->')) {
            suggestion = 'Pipeline operators must be followed by a valid expression or function call.';
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
    checkSyntaxPatterns(code) {
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
    suggestFixes(code) {
        const suggestions = [];
        const patterns = this.checkSyntaxPatterns(code);
        if (patterns.hasMultilineArrows) {
            suggestions.push('Found multi-line arrow functions without braces. Consider using braces for multi-line arrow function bodies.');
        }
        // Check for common mistakes
        if (/\)\s*\n\s*{/.test(code) && !/"function"/.test(code)) {
            suggestions.push('Found newline between closing parenthesis and opening brace. This might cause parsing issues in some contexts.');
        }
        if (/,\s*}/.test(code)) {
            suggestions.push('Found trailing comma before closing brace. While valid in JavaScript, ensure Wang supports this.');
        }
        return suggestions;
    }
}
// Export a singleton instance for convenience
export const validator = new WangValidator();
//# sourceMappingURL=wang-validator.js.map