"use strict";
/**
 * Pausable Wang Interpreter - Extends WangInterpreter with pause/resume and state serialization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PausableWangInterpreter = void 0;
const index_1 = require("./index.cjs");
const memory_1 = require("../resolvers/memory.cjs");
// Import the generated parser (will be generated at build time)
// @ts-ignore - Generated file
const wang_grammar_js_1 = require("../generated/wang-grammar.cjs");
class PausableWangInterpreter extends index_1.WangInterpreter {
    constructor(options = {}) {
        super(options);
        this.operationCounter = 0;
        this.contextIdMap = new Map();
        this.idContextMap = new Map();
        this.nextContextId = 0;
        this.pauseCheckInterval = options.pauseCheckInterval ?? 10;
        this.executionState = {
            type: 'completed',
            callStack: [],
        };
    }
    // Request a pause at the next safe checkpoint
    pause() {
        if (this.executionState.type === 'running') {
            this.executionState.pauseRequested = true;
        }
    }
    // Resume execution from where it was paused
    async resume() {
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
        }
        catch (error) {
            this.executionState.type = 'error';
            this.executionState.error = error;
            throw error;
        }
    }
    // Check if we should pause execution
    async checkPause() {
        // Check abort first (higher priority than pause)
        this.checkAbort();
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
    async evaluateNode(node) {
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
        let frame;
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
        }
        catch (error) {
            // Check if this is a pause request
            if (error && typeof error === 'object' && error.type === 'pause') {
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
    async execute(code, context) {
        this.executionState = {
            type: 'running',
            callStack: [],
        };
        // Create parser using statically imported grammar and nearley
        const parser = new wang_grammar_js_1.nearley.Parser(wang_grammar_js_1.nearley.Grammar.fromCompiled(wang_grammar_js_1.grammar));
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
            }
            finally {
                this.currentContext = previousContext;
            }
        }
        catch (error) {
            // Check if this is a pause request
            if (error && typeof error === 'object' && error.type === 'pause') {
                // Execution was paused - don't throw, just return undefined
                return undefined;
            }
            // Handle return at top level
            if (error && typeof error === 'object' && error.type === 'return') {
                this.executionState.type = 'completed';
                this.executionState.result = error.value;
                return error.value;
            }
            this.executionState.type = 'error';
            this.executionState.error = error;
            throw error;
        }
    }
    // Get the current execution state
    getExecutionState() {
        return { ...this.executionState };
    }
    // Serialize the entire interpreter state
    serialize() {
        // Assign IDs to contexts
        this.assignContextIds(this.globalContext);
        return {
            version: '1.0.0',
            globalContext: this.serializeContext(this.globalContext),
            currentContext: this.serializeContext(this.currentContext),
            executionState: this.serializeExecutionState(),
            moduleCache: Array.from(this.globalModuleCache.entries()),
            // Pipeline value removed
            customFunctions: Array.from(this.globalContext.functions.keys()),
        };
    }
    // Deserialize and restore interpreter state
    static async deserialize(state, options = {}) {
        const interpreter = new PausableWangInterpreter({
            moduleResolver: options.moduleResolver || new memory_1.InMemoryModuleResolver(),
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
        // Pipeline value removed
        return interpreter;
    }
    // Helper methods for serialization
    assignContextIds(context, visited = new Set()) {
        if (visited.has(context))
            return;
        visited.add(context);
        const id = `ctx_${this.nextContextId++}`;
        this.contextIdMap.set(context, id);
        this.idContextMap.set(id, context);
        if (context.parent) {
            this.assignContextIds(context.parent, visited);
        }
    }
    serializeContext(context) {
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
    serializeValue(value) {
        // Handle circular references and non-serializable values
        if (value === undefined)
            return { __type: 'undefined' };
        if (value === null)
            return null;
        if (typeof value === 'function')
            return { __type: 'function', name: value.name || 'anonymous' };
        if (value instanceof Date)
            return { __type: 'Date', value: value.toISOString() };
        if (value instanceof RegExp)
            return { __type: 'RegExp', source: value.source, flags: value.flags };
        if (value instanceof Map)
            return { __type: 'Map', entries: Array.from(value.entries()) };
        if (value instanceof Set)
            return { __type: 'Set', values: Array.from(value.values()) };
        // For objects and arrays, we need to handle circular references
        if (typeof value === 'object') {
            try {
                return JSON.parse(JSON.stringify(value));
            }
            catch {
                return { __type: 'circular_reference' };
            }
        }
        return value;
    }
    deserializeValue(value) {
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
    serializeExecutionState() {
        return {
            ...this.executionState,
            callStack: this.executionState.callStack.map((frame) => ({
                ...frame,
                context: this.serializeContext(frame.context), // We'll restore this properly
            })),
        };
    }
    deserializeExecutionState(state) {
        return {
            ...state,
            callStack: state.callStack.map((frame) => ({
                ...frame,
                context: this.idContextMap.get(frame.context.parentId) || this.currentContext,
            })),
        };
    }
    deserializeContexts(state) {
        // First, create all contexts
        const contexts = new Map();
        // Create global context
        const globalContext = this.createContext();
        this.restoreContextData(globalContext, state.globalContext);
        contexts.set('global', globalContext);
        this.globalContext = globalContext;
        // Set current context
        if (state.currentContext === state.globalContext) {
            this.currentContext = globalContext;
        }
        else {
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
    restoreContextData(context, data) {
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
    getFrameType(nodeType) {
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
    async resumeFromCallStack() {
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
    getCallStackTrace() {
        return this.executionState.callStack.map((frame) => {
            const name = frame.name || '<anonymous>';
            return `${frame.type}: ${name}`;
        });
    }
    getCurrentVariables() {
        const vars = {};
        let ctx = this.currentContext;
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
    isPaused() {
        return this.executionState.type === 'paused';
    }
    isRunning() {
        return this.executionState.type === 'running';
    }
    isCompleted() {
        return this.executionState.type === 'completed';
    }
    hasError() {
        return this.executionState.type === 'error';
    }
}
exports.PausableWangInterpreter = PausableWangInterpreter;
//# sourceMappingURL=pausable-interpreter.js.map