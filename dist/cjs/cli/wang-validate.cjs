#!/usr/bin/env node
"use strict";
/**
 * Wang Language Validator CLI
 * Usage: wang-validate <file.wang> [options]
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const wang_validator_js_1 = require("../parser/wang-validator.cjs");
// Parse command line arguments
const args = process.argv.slice(2);
function showHelp() {
    console.log(`
Wang Language Validator

Usage: wang-validate <file> [options]

Options:
  --ast         Show the Abstract Syntax Tree
  --suggestions Show syntax improvement suggestions
  --quiet       Only show errors (exit code indicates success/failure)
  --help        Show this help message

Examples:
  wang-validate script.wang
  wang-validate script.wang --ast
  wang-validate script.wang --suggestions
  echo 'let x = 1' | wang-validate -
`);
}
async function main() {
    // Handle help flag
    if (args.includes('--help') || args.length === 0) {
        showHelp();
        process.exit(0);
    }
    const options = {
        showAST: args.includes('--ast'),
        showSuggestions: args.includes('--suggestions'),
        quiet: args.includes('--quiet'),
    };
    // Get the file path (first non-flag argument)
    const filePath = args.find((arg) => !arg.startsWith('--'));
    if (!filePath) {
        console.error('Error: No file specified');
        showHelp();
        process.exit(1);
    }
    try {
        // Read code from file or stdin
        let code;
        if (filePath === '-') {
            // Read from stdin
            code = await readStdin();
        }
        else {
            // Read from file
            const fullPath = (0, path_1.resolve)(process.cwd(), filePath);
            code = (0, fs_1.readFileSync)(fullPath, 'utf-8');
        }
        // Validate the code
        const validator = new wang_validator_js_1.WangValidator();
        const result = validator.validate(code, { includeAST: options.showAST });
        if (result.valid) {
            if (!options.quiet) {
                console.log('✅ Valid Wang syntax');
                if (options.showAST && result.ast) {
                    console.log('\\nAST:');
                    console.log(JSON.stringify(result.ast, null, 2));
                }
                if (options.showSuggestions) {
                    const suggestions = validator.suggestFixes(code);
                    if (suggestions.length > 0) {
                        console.log('\\nSuggestions:');
                        suggestions.forEach((s) => console.log(`  • ${s}`));
                    }
                }
            }
            process.exit(0);
        }
        else {
            // Invalid syntax
            if (!options.quiet) {
                console.error('❌ Invalid Wang syntax\\n');
            }
            if (result.error) {
                console.error(`Error at line ${result.error.line}, column ${result.error.column}:`);
                console.error(result.error.message);
                if (result.error.suggestion) {
                    console.error(`\\n💡 Suggestion: ${result.error.suggestion}`);
                }
            }
            if (options.showSuggestions && !options.quiet) {
                const suggestions = validator.suggestFixes(code);
                if (suggestions.length > 0) {
                    console.error('\\nAdditional suggestions:');
                    suggestions.forEach((s) => console.error(`  • ${s}`));
                }
            }
            process.exit(1);
        }
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            resolve(data);
        });
        process.stdin.on('error', reject);
        // Start reading
        process.stdin.resume();
    });
}
// Run the CLI
main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
//# sourceMappingURL=wang-validate.js.map