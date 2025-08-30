/**
 * Pausable Wang Interpreter - Extends WangInterpreter with pause/resume and state serialization
 */
import { WangInterpreter, ExecutionContext, InterpreterOptions } from './index';
import { ModuleResolver } from '../resolvers/base';
export interface ExecutionState {
    type: 'running' | 'paused' | 'completed' | 'error';
    pauseRequested?: boolean;
    currentNode?: any;
    callStack: CallFrame[];
    result?: any;
    error?: any;
}
export interface CallFrame {
    type: 'function' | 'block' | 'loop' | 'module' | 'program';
    name?: string;
    node: any;
    context: ExecutionContext;
    localState?: any;
    returnValue?: any;
}
export interface SerializedState {
    version: string;
    globalContext: SerializedContext;
    currentContext: SerializedContext;
    executionState: ExecutionState;
    moduleCache: Array<[string, any]>;
    lastPipelineValue?: any;
    customFunctions?: string[];
}
export interface SerializedContext {
    variables: Array<[string, any]>;
    variableKinds: Array<[string, 'const' | 'let' | 'var']>;
    functionNames: string[];
    classNames: string[];
    exports: Array<[string, any]>;
    parentId?: string;
    moduleCache: Array<[string, any]>;
}
export interface PausableInterpreterOptions extends InterpreterOptions {
    pauseCheckInterval?: number;
}
export declare class PausableWangInterpreter extends WangInterpreter {
    private executionState;
    private pauseCheckInterval;
    private operationCounter;
    private contextIdMap;
    private idContextMap;
    private nextContextId;
    constructor(options?: PausableInterpreterOptions);
    pause(): void;
    resume(): Promise<any>;
    private checkPause;
    evaluateNode(node: any): Promise<any>;
    execute(code: string, context?: ExecutionContext): Promise<any>;
    getExecutionState(): ExecutionState;
    serialize(): SerializedState;
    static deserialize(state: SerializedState, options?: {
        moduleResolver?: ModuleResolver;
        functions?: Record<string, Function>;
    }): Promise<PausableWangInterpreter>;
    private assignContextIds;
    private serializeContext;
    private serializeValue;
    private deserializeValue;
    private serializeExecutionState;
    private deserializeExecutionState;
    private deserializeContexts;
    private restoreContextData;
    private getFrameType;
    private resumeFromCallStack;
    getCallStackTrace(): string[];
    getCurrentVariables(): Record<string, any>;
    isPaused(): boolean;
    isRunning(): boolean;
    isCompleted(): boolean;
    hasError(): boolean;
}
//# sourceMappingURL=pausable-interpreter.d.ts.map