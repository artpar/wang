export interface ErrorContext {
    type: 'LexError' | 'ParseError' | 'RuntimeError' | 'ModuleError';
    line?: number;
    column?: number;
    length?: number;
    token?: string;
    expected?: string[];
    stackTrace?: string[];
    suggestions?: string[];
    variables?: Record<string, any>;
}
export declare class WangError extends Error {
    context: ErrorContext;
    originalError?: Error;
    constructor(message: string, context?: ErrorContext, originalError?: Error);
    toString(): string;
    /**
     * Get a formatted error message with suggestions
     */
    getFormattedMessage(_sourceCode?: string): string;
    private formatValue;
}
export declare class ModuleNotFoundError extends WangError {
    constructor(modulePath: string, availableModules?: string[]);
}
export declare class CircularDependencyError extends WangError {
    constructor(cycle: string[]);
}
export declare class TypeMismatchError extends WangError {
    constructor(expected: string, received: any, context: string);
}
export declare class UndefinedVariableError extends WangError {
    constructor(varName: string, availableVars: string[]);
}
export declare class FunctionNotFoundError extends WangError {
    constructor(funcName: string, availableFuncs: string[]);
}
export declare class AbortError extends WangError {
    constructor();
}
//# sourceMappingURL=errors.d.ts.map