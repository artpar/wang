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
}
export declare class WangInterpreter {
    protected moduleResolver: ModuleResolver;
    protected globalContext: ExecutionContext;
    protected currentContext: ExecutionContext;
    protected lastPipelineValue: any;
    protected globalModuleCache: Map<string, any>;
    protected consoleLogs: Array<{
        type: 'log' | 'error' | 'warn';
        args: any[];
        timestamp: number;
    }>;
    protected callStack: CallStackFrame[];
    protected currentModulePath: string;
    protected nodeStack: any[];
    private static versionLogged;
    constructor(options?: InterpreterOptions);
    protected createContext(parent?: ExecutionContext): ExecutionContext;
    private getStackTrace;
    private getNodeLocation;
    private enhanceErrorWithContext;
    private bindBuiltins;
    bindFunction(name: string, fn: Function): void;
    setVariable(name: string, value: any): void;
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
    private evaluatePipelineExpression;
    private evaluateBinaryExpression;
    private evaluateUnaryExpression;
    private evaluateAssignmentExpression;
    private evaluateUpdateExpression;
    private evaluateConditionalExpression;
    private evaluateMemberExpression;
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