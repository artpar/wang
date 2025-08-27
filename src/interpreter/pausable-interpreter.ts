/**
 * Pausable Wang Interpreter - Extends WangInterpreter with pause/resume and state serialization
 */

import { WangInterpreter, ExecutionContext, InterpreterOptions } from './index';
import { ModuleResolver } from '../resolvers/base';
import { InMemoryModuleResolver } from '../resolvers/memory';

// Execution state for tracking where we are in the code
export interface ExecutionState {
  type: 'running' | 'paused' | 'completed' | 'error';
  pauseRequested?: boolean;
  currentNode?: any; // Current AST node being executed
  callStack: CallFrame[];
  result?: any;
  error?: any;
}

// Represents a single frame in the call stack
export interface CallFrame {
  type: 'function' | 'block' | 'loop' | 'module' | 'program';
  name?: string;
  node: any;
  context: ExecutionContext;
  localState?: any; // For storing loop counters, etc.
  returnValue?: any;
}

// Serializable state of the entire interpreter
export interface SerializedState {
  version: string; // For compatibility checking
  globalContext: SerializedContext;
  currentContext: SerializedContext;
  executionState: ExecutionState;
  moduleCache: Array<[string, any]>;
  lastPipelineValue?: any;
  customFunctions?: string[]; // Names of custom functions (can't serialize functions)
}

// Serializable context (without functions which can't be serialized)
export interface SerializedContext {
  variables: Array<[string, any]>;
  variableKinds: Array<[string, 'const' | 'let' | 'var']>;
  functionNames: string[]; // Just store names, not actual functions
  classNames: string[]; // Just store names
  exports: Array<[string, any]>;
  parentId?: string; // Reference to parent context by ID
  moduleCache: Array<[string, any]>;
}

export interface PausableInterpreterOptions extends InterpreterOptions {
  pauseCheckInterval?: number; // How often to check for pause (default: 10)
}

export class PausableWangInterpreter extends WangInterpreter {
  private executionState: ExecutionState;
  private pauseCheckInterval: number; // Check for pause every N operations
  private operationCounter: number = 0;
  private contextIdMap: Map<ExecutionContext, string> = new Map();
  private idContextMap: Map<string, ExecutionContext> = new Map();
  private nextContextId: number = 0;

  constructor(options: PausableInterpreterOptions = {}) {
    super(options);
    this.pauseCheckInterval = options.pauseCheckInterval ?? 10;
    this.executionState = {
      type: 'completed',
      callStack: [],
    };
  }

  // Request a pause at the next safe checkpoint
  public pause(): void {
    if (this.executionState.type === 'running') {
      this.executionState.pauseRequested = true;
    }
  }

  // Resume execution from where it was paused
  public async resume(): Promise<any> {
    if (this.executionState.type !== 'paused') {
      throw new Error('Interpreter is not paused');
    }

    this.executionState.type = 'running';
    this.executionState.pauseRequested = false;

    try {
      // Resume from the last call frame
      const result = await this.resumeFromCallStack();
      this.executionState.type = 'completed';
      this.executionState.result = result;
      return result;
    } catch (error) {
      this.executionState.type = 'error';
      this.executionState.error = error;
      throw error;
    }
  }

  // Check if we should pause execution
  private async checkPause(): Promise<void> {
    this.operationCounter++;
    if (this.operationCounter % this.pauseCheckInterval === 0) {
      // Allow other async operations to run
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (this.executionState.pauseRequested) {
      this.executionState.type = 'paused';
      this.executionState.pauseRequested = false;
      throw { type: 'pause', state: this.executionState };
    }
  }

  // Override evaluateNode to add pause checking
  async evaluateNode(node: any): Promise<any> {
    await this.checkPause();

    // Track current node in execution state
    this.executionState.currentNode = node;

    // Add to call stack for certain node types
    const frameTypes = [
      'FunctionDeclaration',
      'FunctionExpression',
      'ArrowFunctionExpression',
      'BlockStatement',
      'ForStatement',
      'WhileStatement',
      'DoWhileStatement',
    ];

    let frame: CallFrame | undefined;
    if (frameTypes.includes(node.type)) {
      frame = {
        type: this.getFrameType(node.type),
        node: node,
        context: this.currentContext,
        name: node.id?.name,
      };
      this.executionState.callStack.push(frame);
    }

    try {
      const result = await super.evaluateNode(node);

      // Remove frame from stack if we added one
      if (frame) {
        this.executionState.callStack.pop();
      }

      return result;
    } catch (error) {
      // Check if this is a pause request
      if (error && typeof error === 'object' && (error as any).type === 'pause') {
        throw error;
      }

      // Remove frame from stack on error too
      if (frame) {
        this.executionState.callStack.pop();
      }

      throw error;
    }
  }

  // Execute with pause/resume support - override parent method completely
  async execute(code: string, context?: ExecutionContext): Promise<any> {
    this.executionState = {
      type: 'running',
      callStack: [],
    };

    // Import the generated parser (will be imported at runtime)
    // @ts-ignore - Generated file
    const { grammar, nearley } = await import('../generated/wang-grammar.js');

    // Create parser using bundled nearley runtime
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    try {
      // Parse the code
      parser.feed(code);

      if (parser.results.length === 0) {
        throw new Error('No parse found');
      }

      if (parser.results.length > 1) {
        console.warn('Ambiguous grammar detected, using first parse');
      }

      const ast = parser.results[0];

      // Execute the AST
      const executionContext = context || this.globalContext;
      const previousContext = this.currentContext;
      this.currentContext = executionContext;

      try {
        const result = await this.evaluateNode(ast);
        this.executionState.type = 'completed';
        this.executionState.result = result;
        return result;
      } finally {
        this.currentContext = previousContext;
      }
    } catch (error) {
      // Check if this is a pause request
      if (error && typeof error === 'object' && (error as any).type === 'pause') {
        // Execution was paused - don't throw, just return undefined
        return undefined;
      }

      // Handle return at top level
      if (error && typeof error === 'object' && (error as any).type === 'return') {
        this.executionState.type = 'completed';
        this.executionState.result = (error as any).value;
        return (error as any).value;
      }

      this.executionState.type = 'error';
      this.executionState.error = error;
      throw error;
    }
  }

  // Get the current execution state
  public getExecutionState(): ExecutionState {
    return { ...this.executionState };
  }

  // Serialize the entire interpreter state
  public serialize(): SerializedState {
    // Assign IDs to contexts
    this.assignContextIds(this.globalContext);

    return {
      version: '1.0.0',
      globalContext: this.serializeContext(this.globalContext),
      currentContext: this.serializeContext(this.currentContext),
      executionState: this.serializeExecutionState(),
      moduleCache: Array.from(this.globalModuleCache.entries()),
      lastPipelineValue: this.lastPipelineValue,
      customFunctions: Array.from(this.globalContext.functions.keys()),
    };
  }

  // Deserialize and restore interpreter state
  public static async deserialize(
    state: SerializedState,
    options: {
      moduleResolver?: ModuleResolver;
      functions?: Record<string, Function>;
    } = {},
  ): Promise<PausableWangInterpreter> {
    const interpreter = new PausableWangInterpreter({
      moduleResolver: options.moduleResolver || new InMemoryModuleResolver(),
      functions: options.functions,
    });

    // Restore contexts
    interpreter.deserializeContexts(state);

    // Restore module cache
    state.moduleCache.forEach(([key, value]) => {
      interpreter.globalModuleCache.set(key, value);
    });

    // Restore execution state
    interpreter.executionState = interpreter.deserializeExecutionState(state.executionState);
    interpreter.lastPipelineValue = state.lastPipelineValue;

    return interpreter;
  }

  // Helper methods for serialization

  private assignContextIds(context: ExecutionContext, visited = new Set<ExecutionContext>()): void {
    if (visited.has(context)) return;
    visited.add(context);

    const id = `ctx_${this.nextContextId++}`;
    this.contextIdMap.set(context, id);
    this.idContextMap.set(id, context);

    if (context.parent) {
      this.assignContextIds(context.parent, visited);
    }
  }

  private serializeContext(context: ExecutionContext): SerializedContext {
    const parentId = context.parent ? this.contextIdMap.get(context.parent) : undefined;

    return {
      variables: Array.from(context.variables.entries()).map(([k, v]) => [
        k,
        this.serializeValue(v),
      ]),
      variableKinds: Array.from(context.variableKinds.entries()),
      functionNames: Array.from(context.functions.keys()),
      classNames: Array.from(context.classes.keys()),
      exports: Array.from(context.exports.entries()).map(([k, v]) => [k, this.serializeValue(v)]),
      parentId,
      moduleCache: Array.from(context.moduleCache.entries()),
    };
  }

  private serializeValue(value: any): any {
    // Handle circular references and non-serializable values
    if (value === undefined) return { __type: 'undefined' };
    if (value === null) return null;
    if (typeof value === 'function') return { __type: 'function', name: value.name || 'anonymous' };
    if (value instanceof Date) return { __type: 'Date', value: value.toISOString() };
    if (value instanceof RegExp)
      return { __type: 'RegExp', source: value.source, flags: value.flags };
    if (value instanceof Map) return { __type: 'Map', entries: Array.from(value.entries()) };
    if (value instanceof Set) return { __type: 'Set', values: Array.from(value.values()) };

    // For objects and arrays, we need to handle circular references
    if (typeof value === 'object') {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return { __type: 'circular_reference' };
      }
    }

    return value;
  }

  private deserializeValue(value: any): any {
    if (value && typeof value === 'object' && '__type' in value) {
      switch (value.__type) {
        case 'undefined':
          return undefined;
        case 'function':
          return () => {
            throw new Error(`Function ${value.name} needs to be re-bound`);
          };
        case 'Date':
          return new Date(value.value);
        case 'RegExp':
          return new RegExp(value.source, value.flags);
        case 'Map':
          return new Map(value.entries);
        case 'Set':
          return new Set(value.values);
        case 'circular_reference':
          return null;
      }
    }
    return value;
  }

  private serializeExecutionState(): ExecutionState {
    return {
      ...this.executionState,
      callStack: this.executionState.callStack.map((frame) => ({
        ...frame,
        context: this.serializeContext(frame.context) as any, // We'll restore this properly
      })),
    };
  }

  private deserializeExecutionState(state: ExecutionState): ExecutionState {
    return {
      ...state,
      callStack: state.callStack.map((frame) => ({
        ...frame,
        context: this.idContextMap.get((frame.context as any).parentId) || this.currentContext,
      })),
    };
  }

  private deserializeContexts(state: SerializedState): void {
    // First, create all contexts
    const contexts = new Map<string, ExecutionContext>();

    // Create global context
    const globalContext = this.createContext();
    this.restoreContextData(globalContext, state.globalContext);
    contexts.set('global', globalContext);
    this.globalContext = globalContext;

    // Set current context
    if (state.currentContext === state.globalContext) {
      this.currentContext = globalContext;
    } else {
      const currentContext = this.createContext();
      this.restoreContextData(currentContext, state.currentContext);
      contexts.set('current', currentContext);
      this.currentContext = currentContext;
    }

    // Restore parent relationships
    if (state.currentContext.parentId) {
      this.currentContext.parent = contexts.get(state.currentContext.parentId);
    }
  }

  private restoreContextData(context: ExecutionContext, data: SerializedContext): void {
    // Restore variables - deserialize values properly
    data.variables.forEach(([key, value]) => {
      const deserializedValue = this.deserializeValue(value);
      context.variables.set(key, deserializedValue);
    });

    // Restore variable kinds
    data.variableKinds.forEach(([key, kind]) => {
      context.variableKinds.set(key, kind);
    });

    // Function names are stored, but actual functions need to be re-bound
    // Restore basic built-in constructors
    if (data.variables.some(([key]) => key === 'Date')) {
      context.variables.set('Date', Date);
    }
    if (data.variables.some(([key]) => key === 'Error')) {
      context.variables.set('Error', Error);
    }

    // Restore exports
    data.exports.forEach(([key, value]) => {
      context.exports.set(key, this.deserializeValue(value));
    });

    // Restore module cache
    data.moduleCache.forEach(([key, value]) => {
      context.moduleCache.set(key, value);
    });
  }

  private getFrameType(nodeType: string): CallFrame['type'] {
    switch (nodeType) {
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        return 'function';
      case 'BlockStatement':
        return 'block';
      case 'ForStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
        return 'loop';
      case 'Program':
        return 'program';
      default:
        return 'block';
    }
  }

  private async resumeFromCallStack(): Promise<any> {
    // This is a simplified version - in a real implementation,
    // we'd need to restore the exact execution point within each frame
    const topFrame = this.executionState.callStack[this.executionState.callStack.length - 1];

    if (!topFrame) {
      throw new Error('No frame to resume from');
    }

    // Restore context
    this.currentContext = topFrame.context;

    // Continue execution from the node
    return this.evaluateNode(topFrame.node);
  }

  // Utility methods for debugging and inspection

  public getCallStackTrace(): string[] {
    return this.executionState.callStack.map((frame) => {
      const name = frame.name || '<anonymous>';
      return `${frame.type}: ${name}`;
    });
  }

  public getCurrentVariables(): Record<string, any> {
    const vars: Record<string, any> = {};
    let ctx: ExecutionContext | undefined = this.currentContext;

    while (ctx) {
      ctx.variables.forEach((value, key) => {
        if (!(key in vars)) {
          vars[key] = value;
        }
      });
      ctx = ctx.parent;
    }

    return vars;
  }

  public isPaused(): boolean {
    return this.executionState.type === 'paused';
  }

  public isRunning(): boolean {
    return this.executionState.type === 'running';
  }

  public isCompleted(): boolean {
    return this.executionState.type === 'completed';
  }

  public hasError(): boolean {
    return this.executionState.type === 'error';
  }
}
