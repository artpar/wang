/**
 * Wang Language Metadata API
 *
 * P0: Core metadata capture and exposure during compilation/interpretation/execution
 * Focuses on collecting and exposing all available data without complex debugging features
 */

export class WangMetadata {
  constructor() {
    // === COMPILATION PHASE METADATA ===
    this.compilation = {
      // Raw source
      source: null,
      sourceLength: 0,

      // Tokenization
      tokens: [],
      tokenCount: 0,
      tokenTypes: new Map(), // type -> count

      // Parsing
      parseStartTime: null,
      parseEndTime: null,
      parseErrors: [],
      parseWarnings: [],

      // AST/CST Structure
      ast: null,
      cst: null,
      nodeCount: 0,
      nodeTypes: new Map(), // node type -> count
      maxDepth: 0,

      // Source mapping
      sourceMap: new Map(), // node -> {startLine, startColumn, endLine, endColumn}
      lineOffsets: [], // byte offset of each line start
    };

    // === INTERPRETATION PHASE METADATA ===
    this.interpretation = {
      // Module resolution
      moduleResolutions: [], // {from, requested, resolved, timestamp}
      moduleLoadTimes: new Map(), // module -> loadTime
      moduleDependencies: new Map(), // module -> Set of dependencies
      circularDependencies: [],

      // Symbol table construction
      symbols: {
        variables: new Map(), // name -> {type, scope, line, column}
        functions: new Map(), // name -> {params, body, scope, line}
        classes: new Map(), // name -> {methods, properties, extends, line}
        exports: new Map(), // name -> {value, module}
        imports: new Map(), // name -> {from, as, line}
      },

      // Scope chain
      scopes: [], // [{type, parent, variables, functions}]
      scopeTree: null, // hierarchical scope representation
    };

    // === EXECUTION PHASE METADATA ===
    this.execution = {
      // Execution state
      startTime: null,
      endTime: null,
      state: 'idle', // idle, running, completed, error

      // Call information
      callCount: 0,
      callHistory: [], // [{function, args, timestamp, duration}]
      callStack: [], // current stack
      maxCallDepth: 0,
      recursiveCalls: [],

      // Variable access
      variableReads: new Map(), // variable -> count
      variableWrites: new Map(), // variable -> count
      variableTypes: new Map(), // variable -> Set of types seen

      // Control flow
      branchesExecuted: [], // {type, condition, result, line}
      loopIterations: new Map(), // loop id -> iteration count
      returnValues: [], // {function, value, type}

      // Error tracking
      errors: [],
      errorHandlers: [], // try/catch blocks hit
      rejectedPromises: [],

      // Pipeline operations
      pipelineOperations: [], // {operator, input, output, line}
      pipelineChains: [], // complete pipeline sequences

      // Memory-like metrics
      createdObjects: 0,
      createdArrays: 0,
      createdFunctions: 0,
      stringConcatenations: 0,
    };

    // === LIVE RUNTIME DATA ===
    this.runtime = {
      // Current execution point
      currentLine: null,
      currentColumn: null,
      currentNode: null,
      currentFunction: null,

      // Live variable values
      liveVariables: new Map(), // name -> current value
      liveModules: new Map(), // path -> module exports

      // Execution path
      executionPath: [], // sequence of line numbers executed
      nodeVisitOrder: [], // sequence of AST nodes visited

      // Event stream
      events: [], // all events in chronological order
    };
  }

  // === DATA COLLECTION METHODS ===

  // Compilation phase
  recordToken(token) {
    this.compilation.tokens.push({
      type: token.type,
      value: token.value,
      text: token.text,
      line: token.line,
      column: token.column,
      offset: token.offset,
      length: token.text?.length,
    });

    this.compilation.tokenCount++;
    this.compilation.tokenTypes.set(
      token.type,
      (this.compilation.tokenTypes.get(token.type) || 0) + 1,
    );
  }

  recordNode(node, depth = 0) {
    this.compilation.nodeCount++;
    this.compilation.nodeTypes.set(node.type, (this.compilation.nodeTypes.get(node.type) || 0) + 1);
    this.compilation.maxDepth = Math.max(this.compilation.maxDepth, depth);

    // Store source mapping
    if (node.location) {
      this.compilation.sourceMap.set(node, {
        startLine: node.location.startLine,
        startColumn: node.location.startColumn,
        endLine: node.location.endLine,
        endColumn: node.location.endColumn,
      });
    }
  }

  // Interpretation phase
  recordModuleResolution(from, requested, resolved) {
    const resolution = {
      from,
      requested,
      resolved,
      timestamp: Date.now(),
      success: resolved !== null,
    };

    this.interpretation.moduleResolutions.push(resolution);

    if (resolved) {
      if (!this.interpretation.moduleDependencies.has(from)) {
        this.interpretation.moduleDependencies.set(from, new Set());
      }
      this.interpretation.moduleDependencies.get(from).add(resolved);
    }
  }

  recordSymbol(type, name, info) {
    const symbols = this.interpretation.symbols[type];
    if (symbols) {
      symbols.set(name, {
        ...info,
        definedAt: Date.now(),
      });
    }
  }

  recordScope(scope) {
    this.interpretation.scopes.push({
      id: `scope_${this.interpretation.scopes.length}`,
      type: scope.type, // global, function, block, class
      parent: scope.parent?.id,
      variables: Array.from(scope.variables?.keys() || []),
      functions: Array.from(scope.functions?.keys() || []),
      depth: scope.depth || 0,
    });
  }

  // Execution phase
  recordCall(functionName, args, node) {
    const call = {
      id: `call_${this.execution.callCount++}`,
      function: functionName,
      args: this._serializeArgs(args),
      timestamp: performance.now(),
      line: node?.location?.startLine,
      column: node?.location?.startColumn,
      stackDepth: this.execution.callStack.length,
    };

    this.execution.callHistory.push(call);
    this.execution.callStack.push(call);
    this.execution.maxCallDepth = Math.max(
      this.execution.maxCallDepth,
      this.execution.callStack.length,
    );

    return call.id;
  }

  recordReturn(callId, value) {
    const call = this.execution.callHistory.find((c) => c.id === callId);
    if (call) {
      call.returnValue = this._serializeValue(value);
      call.duration = performance.now() - call.timestamp;
      call.returnType = typeof value;
    }

    // Pop from call stack
    const stackIndex = this.execution.callStack.findIndex((c) => c.id === callId);
    if (stackIndex !== -1) {
      this.execution.callStack.splice(stackIndex, 1);
    }
  }

  recordVariableAccess(name, type, value = undefined) {
    if (type === 'read') {
      this.execution.variableReads.set(name, (this.execution.variableReads.get(name) || 0) + 1);
    } else if (type === 'write') {
      this.execution.variableWrites.set(name, (this.execution.variableWrites.get(name) || 0) + 1);

      // Track types
      if (!this.execution.variableTypes.has(name)) {
        this.execution.variableTypes.set(name, new Set());
      }
      this.execution.variableTypes.get(name).add(typeof value);

      // Update live variables
      this.runtime.liveVariables.set(name, value);
    }
  }

  recordBranch(type, condition, result, node) {
    this.execution.branchesExecuted.push({
      type, // if, switch, ternary
      condition: this._serializeValue(condition),
      result,
      line: node?.location?.startLine,
      timestamp: performance.now(),
    });
  }

  recordPipeline(operator, input, output, node) {
    const operation = {
      operator, // method name
      input: this._serializeValue(input),
      output: this._serializeValue(output),
      inputType: typeof input,
      outputType: typeof output,
      line: node?.location?.startLine,
      timestamp: performance.now(),
    };

    this.execution.pipelineOperations.push(operation);
  }

  recordEvent(type, data) {
    this.runtime.events.push({
      type,
      data,
      timestamp: performance.now(),
      callStack: this.execution.callStack.map((c) => c.function),
      currentLine: this.runtime.currentLine,
    });
  }

  // === QUERY METHODS ===

  getCompilationSummary() {
    return {
      sourceSize: this.compilation.sourceLength,
      tokenCount: this.compilation.tokenCount,
      uniqueTokenTypes: this.compilation.tokenTypes.size,
      nodeCount: this.compilation.nodeCount,
      uniqueNodeTypes: this.compilation.nodeTypes.size,
      maxDepth: this.compilation.maxDepth,
      parseTime: this.compilation.parseEndTime - this.compilation.parseStartTime,
      errors: this.compilation.parseErrors.length,
      warnings: this.compilation.parseWarnings.length,
    };
  }

  getInterpretationSummary() {
    return {
      modulesLoaded: this.interpretation.moduleResolutions.filter((r) => r.success).length,
      modulesFailed: this.interpretation.moduleResolutions.filter((r) => !r.success).length,
      totalDependencies: Array.from(this.interpretation.moduleDependencies.values()).reduce(
        (sum, deps) => sum + deps.size,
        0,
      ),
      circularDependencies: this.interpretation.circularDependencies.length,
      definedVariables: this.interpretation.symbols.variables.size,
      definedFunctions: this.interpretation.symbols.functions.size,
      definedClasses: this.interpretation.symbols.classes.size,
      totalExports: this.interpretation.symbols.exports.size,
      totalImports: this.interpretation.symbols.imports.size,
      scopeCount: this.interpretation.scopes.length,
    };
  }

  getExecutionSummary() {
    const duration = this.execution.endTime - this.execution.startTime;

    return {
      duration,
      state: this.execution.state,
      totalCalls: this.execution.callCount,
      maxCallDepth: this.execution.maxCallDepth,
      recursiveCalls: this.execution.recursiveCalls.length,
      uniqueFunctionsCalled: new Set(this.execution.callHistory.map((c) => c.function)).size,
      variableReads: Array.from(this.execution.variableReads.values()).reduce((a, b) => a + b, 0),
      variableWrites: Array.from(this.execution.variableWrites.values()).reduce((a, b) => a + b, 0),
      branchesExecuted: this.execution.branchesExecuted.length,
      pipelineOperations: this.execution.pipelineOperations.length,
      errors: this.execution.errors.length,
      objectsCreated: this.execution.createdObjects,
      arraysCreated: this.execution.createdArrays,
    };
  }

  // Get hottest functions by call count
  getHotFunctions(limit = 10) {
    const counts = new Map();

    for (const call of this.execution.callHistory) {
      counts.set(call.function, (counts.get(call.function) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  // Get most accessed variables
  getHotVariables(limit = 10) {
    const totalAccess = new Map();

    for (const [name, reads] of this.execution.variableReads) {
      totalAccess.set(name, reads);
    }

    for (const [name, writes] of this.execution.variableWrites) {
      totalAccess.set(name, (totalAccess.get(name) || 0) + writes);
    }

    return Array.from(totalAccess.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({
        name,
        count,
        reads: this.execution.variableReads.get(name) || 0,
        writes: this.execution.variableWrites.get(name) || 0,
      }));
  }

  // Get execution path through code
  getExecutionPath(limit = 100) {
    return this.runtime.executionPath.slice(-limit);
  }

  // Get current state snapshot
  getCurrentState() {
    return {
      line: this.runtime.currentLine,
      column: this.runtime.currentColumn,
      function: this.runtime.currentFunction,
      callStackDepth: this.execution.callStack.length,
      liveVariableCount: this.runtime.liveVariables.size,
      lastEvent: this.runtime.events[this.runtime.events.length - 1],
    };
  }

  // Get module dependency graph
  getDependencyGraph() {
    const nodes = [];
    const edges = [];

    for (const [module, deps] of this.interpretation.moduleDependencies) {
      nodes.push({ id: module, type: 'module' });
      for (const dep of deps) {
        edges.push({ from: module, to: dep });
      }
    }

    return { nodes, edges, circular: this.interpretation.circularDependencies };
  }

  // === UTILITIES ===

  _serializeValue(value, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return '...';

    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length <= 3
          ? `[${value.map((v) => this._serializeValue(v, depth + 1)).join(', ')}]`
          : `[Array(${value.length})]`;
      }
      const keys = Object.keys(value);
      if (keys.length <= 3) {
        const props = keys.map((k) => `${k}: ${this._serializeValue(value[k], depth + 1)}`);
        return `{${props.join(', ')}}`;
      }
      return `{Object(${keys.length} keys)}`;
    }

    if (typeof value === 'string' && value.length > 50) {
      return `"${value.slice(0, 47)}..."`;
    }

    return JSON.stringify(value);
  }

  _serializeArgs(args) {
    return args.map((arg) => ({
      type: typeof arg,
      value: this._serializeValue(arg),
    }));
  }

  // Export all metadata as JSON
  toJSON() {
    return {
      compilation: {
        ...this.compilation,
        ast: null, // Exclude AST from JSON (too large)
        cst: null, // Exclude CST from JSON
        sourceMap: Array.from(this.compilation.sourceMap.entries()).map(([node, loc]) => ({
          nodeType: node.type,
          location: loc,
        })),
      },
      interpretation: {
        ...this.interpretation,
        symbols: {
          variables: Array.from(this.interpretation.symbols.variables.entries()),
          functions: Array.from(this.interpretation.symbols.functions.entries()),
          classes: Array.from(this.interpretation.symbols.classes.entries()),
          exports: Array.from(this.interpretation.symbols.exports.entries()),
          imports: Array.from(this.interpretation.symbols.imports.entries()),
        },
        moduleDependencies: Array.from(this.interpretation.moduleDependencies.entries()).map(
          ([module, deps]) => ({ module, dependencies: Array.from(deps) }),
        ),
      },
      execution: {
        ...this.execution,
        variableReads: Array.from(this.execution.variableReads.entries()),
        variableWrites: Array.from(this.execution.variableWrites.entries()),
        variableTypes: Array.from(this.execution.variableTypes.entries()).map(([name, types]) => ({
          name,
          types: Array.from(types),
        })),
      },
      runtime: {
        ...this.runtime,
        liveVariables: Array.from(this.runtime.liveVariables.entries()).map(([name, value]) => ({
          name,
          type: typeof value,
          value: this._serializeValue(value),
        })),
        liveModules: Array.from(this.runtime.liveModules.keys()),
      },
      summary: {
        compilation: this.getCompilationSummary(),
        interpretation: this.getInterpretationSummary(),
        execution: this.getExecutionSummary(),
      },
    };
  }
}

// === INTEGRATION HOOKS ===

export class MetadataCollector {
  constructor(metadata = new WangMetadata()) {
    this.metadata = metadata;
    this.enabled = true;
  }

  // Parser hooks
  onTokenize(token) {
    if (this.enabled) {
      this.metadata.recordToken(token);
    }
  }

  onParseStart(source) {
    if (this.enabled) {
      this.metadata.compilation.source = source;
      this.metadata.compilation.sourceLength = source.length;
      this.metadata.compilation.parseStartTime = performance.now();
    }
  }

  onParseEnd(ast) {
    if (this.enabled) {
      this.metadata.compilation.parseEndTime = performance.now();
      this.metadata.compilation.ast = ast;
    }
  }

  onParseError(error) {
    if (this.enabled) {
      this.metadata.compilation.parseErrors.push({
        message: error.message,
        line: error.line,
        column: error.column,
        timestamp: Date.now(),
      });
    }
  }

  // Interpreter hooks
  onNodeVisit(node, depth) {
    if (this.enabled) {
      this.metadata.recordNode(node, depth);
      this.metadata.runtime.nodeVisitOrder.push(node.type);

      if (node.location) {
        this.metadata.runtime.currentLine = node.location.startLine;
        this.metadata.runtime.currentColumn = node.location.startColumn;
        this.metadata.runtime.currentNode = node;
        this.metadata.runtime.executionPath.push(node.location.startLine);
      }
    }
  }

  onFunctionCall(name, args, node) {
    if (this.enabled) {
      const callId = this.metadata.recordCall(name, args, node);
      return callId; // Return for matching with onFunctionReturn
    }
  }

  onFunctionReturn(callId, value) {
    if (this.enabled) {
      this.metadata.recordReturn(callId, value);
    }
  }

  onVariableAccess(name, type, value) {
    if (this.enabled) {
      this.metadata.recordVariableAccess(name, type, value);
    }
  }

  onModuleResolve(from, requested, resolved) {
    if (this.enabled) {
      this.metadata.recordModuleResolution(from, requested, resolved);
    }
  }

  onBranch(type, condition, result, node) {
    if (this.enabled) {
      this.metadata.recordBranch(type, condition, result, node);
    }
  }

  onPipeline(operator, input, output, node) {
    if (this.enabled) {
      this.metadata.recordPipeline(operator, input, output, node);
    }
  }

  onError(error, node) {
    if (this.enabled) {
      this.metadata.execution.errors.push({
        message: error.message,
        type: error.constructor.name,
        line: node?.location?.startLine,
        column: node?.location?.startColumn,
        stack: error.stack,
        timestamp: Date.now(),
      });
    }
  }

  onExecutionStart() {
    if (this.enabled) {
      this.metadata.execution.startTime = performance.now();
      this.metadata.execution.state = 'running';
    }
  }

  onExecutionEnd() {
    if (this.enabled) {
      this.metadata.execution.endTime = performance.now();
      this.metadata.execution.state = 'completed';
    }
  }

  // Get metadata snapshot
  getMetadata() {
    return this.metadata;
  }

  // Get specific summaries
  getSummary() {
    return {
      compilation: this.metadata.getCompilationSummary(),
      interpretation: this.metadata.getInterpretationSummary(),
      execution: this.metadata.getExecutionSummary(),
      current: this.metadata.getCurrentState(),
    };
  }

  // Export as JSON
  export() {
    return this.metadata.toJSON();
  }
}

// === USAGE EXAMPLE ===

/*
import { WangInterpreter } from './wang-interpreter.js'
import { MetadataCollector, WangMetadata } from './wang-metadata-api.js'

// Create metadata collector
const collector = new MetadataCollector()

// Create interpreter with metadata hooks
const interpreter = new WangInterpreter({
  onNodeVisit: (node, depth) => collector.onNodeVisit(node, depth),
  onFunctionCall: (name, args, node) => collector.onFunctionCall(name, args, node),
  onFunctionReturn: (id, value) => collector.onFunctionReturn(id, value),
  onVariableAccess: (name, type, value) => collector.onVariableAccess(name, type, value),
  // ... other hooks
})

// Execute code
collector.onExecutionStart()
await interpreter.execute(code)
collector.onExecutionEnd()

// Get metadata
const metadata = collector.getMetadata()

// Query specific data
console.log('Hot functions:', metadata.getHotFunctions())
console.log('Hot variables:', metadata.getHotVariables())
console.log('Execution path:', metadata.getExecutionPath())
console.log('Dependency graph:', metadata.getDependencyGraph())

// Get summaries
console.log('Summary:', collector.getSummary())

// Export as JSON
const json = collector.export()
fs.writeFileSync('execution-metadata.json', JSON.stringify(json, null, 2))
*/
