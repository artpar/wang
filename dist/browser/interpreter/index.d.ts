/**
 * Wang Interpreter - CSP-safe interpreter for the Wang language
 * Works with Nearley-generated AST
 */
import { ModuleResolver } from '../resolvers/base';
export interface ExecutionContext {
    variables: Map<string, any>;
    variableKinds: Map<string, 'const' | 'let' | 'var'>;
    functions: Map<string, Function>;
    classes: Map<string, any>;
    exports: Map<string, any>;
    parent?: ExecutionContext;
    moduleCache: Map<string, any>;
    moduleExports?: any;
    modulePath?: string;
    currentNode?: any;
}
export interface CallStackFrame {
    functionName: string;
    modulePath?: string;
    line?: number;
    column?: number;
    nodeType?: string;
}
export interface InterpreterOptions {
    moduleResolver?: ModuleResolver;
    functions?: Record<string, Function>;
    globalContext?: ExecutionContext;
    abortSignal?: AbortSignal;
}
export declare class WangInterpreter {
    protected moduleResolver: ModuleResolver;
    protected globalContext: ExecutionContext;
    protected currentContext: ExecutionContext;
    protected globalModuleCache: Map<string, any>;
    protected consoleLogs: Array<{
        type: 'log' | 'error' | 'warn';
        args: any[];
        timestamp: number;
    }>;
    protected callStack: CallStackFrame[];
    protected currentModulePath: string;
    protected nodeStack: any[];
    protected abortSignal?: AbortSignal;
    private static versionLogged;
    constructor(options?: InterpreterOptions);
    protected createContext(parent?: ExecutionContext): ExecutionContext;
    /**
     * Check if the abort signal has been triggered and throw AbortError if so
     */
    protected checkAbort(): void;
    private getStackTrace;
    private getNodeLocation;
    /**
     * Collect variables from the entire context chain, prioritizing user variables over globals
     */
    private collectVariablesFromContextChain;
    /**
     * Format a variable value for error context display
     */
    private formatVariableValue;
    /**
     * Check if a variable is a global/built-in variable
     */
    private isGlobalVariable;
    private enhanceErrorWithContext;
    /**
     * Enhanced error context for member expression calls that includes object inspection
     */
    private enhanceErrorWithMemberContext;
    /**
     * Get information about an object for error reporting
     */
    private getObjectInfo;
    /**
     * Find method names similar to the target name (for "did you mean" suggestions)
     */
    private findSimilarNames;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
    private bindBuiltins;
    bindFunction(name: string, fn: Function): void;
    setVariable(name: string, value: any): void;
    getVariable(name: string): any;
    execute(code: string, context?: ExecutionContext): Promise<any>;
    execute(code: string, context: ExecutionContext | undefined, options: {
        withMetadata: true;
    }): Promise<{
        result: any;
        metadata: {
            logs: Array<{
                type: 'log' | 'error' | 'warn';
                args: any[];
                timestamp: number;
            }>;
        };
    }>;
    private createSyncFunction;
    private evaluateNodeSync;
    protected evaluateNode(node: any): Promise<any>;
    private evaluateProgram;
    private processContinuations;
    private hoistVarDeclarations;
    private hoistVarPattern;
    private evaluateVariableDeclaration;
    private assignPattern;
    private evaluateFunctionDeclaration;
    private canExecuteSynchronously;
    private canExecuteSynchronouslyForCallback;
    private canStatementExecuteSynchronouslyForCallback;
    private canExpressionExecuteSynchronouslyForCallback;
    private canStatementExecuteSynchronously;
    private canExpressionExecuteSynchronously;
    private createFunction;
    private evaluateClassDeclaration;
    private evaluateBlock;
    private evaluateIfStatement;
    private evaluateForStatement;
    private evaluateWhileStatement;
    private evaluateDoWhileStatement;
    private evaluateLabeledStatement;
    private evaluateSwitchStatement;
    private evaluateTryStatement;
    private evaluateIdentifier;
    private evaluateCallExpression;
    private evaluateBinaryExpression;
    private evaluateUnaryExpression;
    private evaluateAssignmentExpression;
    private evaluateUpdateExpression;
    private evaluateConditionalExpression;
    private evaluateMemberExpression;
    /**
     * Extract a human-readable name from a member expression AST node
     * Examples: obj.method -> "obj.method", this.prop -> "this.prop", arr[0] -> "arr[0]"
     */
    private getMemberExpressionName;
    private getStringMethod;
    private getArrayMethod;
    /**
     * Determines if a function is a native JavaScript constructor that should be called with 'new'.
     * Uses multiple heuristics to distinguish native constructors from Wang-defined classes.
     */
    private isNativeConstructor;
    private evaluateNewExpression;
    private evaluateArrayExpression;
    private evaluateObjectExpression;
    private evaluateTemplateLiteral;
    private interpolateTemplate;
    private evaluateTemplateExpression;
    private evaluateImport;
    private evaluateExport;
    private importModule;
}
export default WangInterpreter;
//# sourceMappingURL=index.d.ts.map