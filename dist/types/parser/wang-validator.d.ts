/**
 * Wang Language Parser and Validator
 * Provides syntax validation without execution
 */
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
export declare class WangValidator {
    /**
     * Validate Wang code without executing it
     */
    validate(code: string, options?: ParserOptions): ValidationResult;
    /**
     * Format parser errors with helpful suggestions
     */
    private formatError;
    /**
     * Check if code has specific syntax patterns
     */
    checkSyntaxPatterns(code: string): {
        hasMultilineArrows: boolean;
        hasPipelines: boolean;
        hasAsyncAwait: boolean;
        hasClasses: boolean;
        hasModules: boolean;
    };
    /**
     * Suggest fixes for common issues
     */
    suggestFixes(code: string): string[];
}
export declare const validator: WangValidator;
//# sourceMappingURL=wang-validator.d.ts.map