/**
 * Wang Interpreter - CSP-safe interpreter for the Wang language
 * Works with Nearley-generated AST
 */

import { ModuleResolver } from '../resolvers/base';
import { InMemoryModuleResolver } from '../resolvers/memory';
import { WangError, UndefinedVariableError, TypeMismatchError } from '../utils/errors';
import { stdlib } from '../stdlib/index';

// Version will be replaced during build
const VERSION = '0.21.0';

// Import the generated parser (will be generated at build time)
// @ts-ignore - Generated file
import { grammar, nearley } from '../generated/wang-grammar.js';

export interface ExecutionContext {
  variables: Map<string, any>;
  variableKinds: Map<string, 'const' | 'let' | 'var'>; // Track variable kinds
  functions: Map<string, Function>;
  classes: Map<string, any>;
  exports: Map<string, any>;
  parent?: ExecutionContext;
  moduleCache: Map<string, any>;
  moduleExports?: any; // For circular dependency handling
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

export class WangInterpreter {
  protected moduleResolver: ModuleResolver;
  protected globalContext: ExecutionContext;
  protected currentContext: ExecutionContext;
  // Pipeline value removed - not JavaScript compatible
  protected globalModuleCache: Map<string, any> = new Map();
  protected consoleLogs: Array<{ type: 'log' | 'error' | 'warn'; args: any[]; timestamp: number }> =
    [];
  protected callStack: CallStackFrame[] = [];
  protected currentModulePath: string = '<main>';
  protected nodeStack: any[] = [];

  // Track if version has been logged for this session
  private static versionLogged: boolean = false;

  constructor(options: InterpreterOptions = {}) {
    this.moduleResolver = options.moduleResolver || new InMemoryModuleResolver();
    this.globalContext = options.globalContext || this.createContext();
    this.currentContext = this.globalContext;

    // Bind built-in functions
    this.bindBuiltins();

    // Bind custom functions
    if (options.functions) {
      Object.entries(options.functions).forEach(([name, fn]) => {
        this.bindFunction(name, fn);
      });
    }
  }
  protected createContext(parent?: ExecutionContext): ExecutionContext {
    return {
      variables: new Map(),
      variableKinds: new Map(),
      functions: new Map(),
      classes: new Map(),
      exports: new Map(),
      parent,
      moduleCache: new Map(),
      modulePath: this.currentModulePath,
    };
  }

  private getStackTrace(): string[] {
    return this.callStack.map((frame) => {
      let trace = frame.functionName;
      if (frame.modulePath && frame.modulePath !== '<main>') {
        trace += ` (${frame.modulePath}`;
        if (frame.line) {
          trace += `:${frame.line}`;
          if (frame.column) {
            trace += `:${frame.column}`;
          }
        }
        trace += ')';
      } else if (frame.line) {
        trace += ` (line ${frame.line})`;
      }
      return trace;
    });
  }

  private getNodeLocation(node: any): { line?: number; column?: number } {
    // Check for location info from the parser
    if (node?.loc) {
      return { line: node.loc.start.line, column: node.loc.start.column };
    }
    if (node?.line !== undefined) {
      return { line: node.line, column: node.column || 0 };
    }
    if (node?.start) {
      return { line: node.start.line, column: node.start.column };
    }
    // Try to get from lexer token if available
    if (node?.token) {
      return { line: node.token.line, column: node.token.col };
    }
    return {};
  }

  private enhanceErrorWithContext(error: WangError, node?: any): void {
    // Add location information
    if (node) {
      const loc = this.getNodeLocation(node);
      if (loc.line) {
        error.context.line = loc.line;
        error.context.column = loc.column;
      }
    }

    // Add stack trace
    error.context.stackTrace = this.getStackTrace();

    // Add module information
    if (this.currentModulePath && this.currentModulePath !== '<main>') {
      if (!error.message.includes(this.currentModulePath)) {
        error.message = `[${this.currentModulePath}] ${error.message}`;
      }
    }

    // Add current variables in scope (limit to avoid huge dumps)
    const variables: Record<string, any> = {};
    let count = 0;
    for (const [key, value] of this.currentContext.variables) {
      if (count++ >= 10) break;
      try {
        variables[key] =
          value === undefined
            ? 'undefined'
            : value === null
              ? 'null'
              : typeof value === 'function'
                ? '[Function]'
                : typeof value === 'object'
                  ? '[Object]'
                  : String(value).substring(0, 50);
      } catch {
        variables[key] = '[Error getting value]';
      }
    }
    error.context.variables = variables;
  }

  private bindBuiltins() {
    // Console functions with capture
    this.bindFunction('log', (...args: any[]) => {
      this.consoleLogs.push({ type: 'log', args, timestamp: Date.now() });
      console.log(...args);
    });
    this.bindFunction('error', (...args: any[]) => {
      this.consoleLogs.push({ type: 'error', args, timestamp: Date.now() });
      console.error(...args);
    });
    this.bindFunction('warn', (...args: any[]) => {
      this.consoleLogs.push({ type: 'warn', args, timestamp: Date.now() });
      console.warn(...args);
    });

    // Type conversion functions
    this.bindFunction('Number', (val: any) => Number(val));
    this.bindFunction('String', (val: any) => String(val));
    this.bindFunction('Boolean', (val: any) => Boolean(val));

    // Type checking functions
    this.bindFunction('isNaN', (val: any) => isNaN(val));
    this.bindFunction('isFinite', (val: any) => isFinite(val));
    this.bindFunction('isInteger', (val: any) => Number.isInteger(val));

    // Register all stdlib functions
    Object.entries(stdlib).forEach(([name, fn]) => {
      this.bindFunction(name, fn);
    });

    // Error constructor - needs to work as both function and constructor
    // We need to set it as a variable so it can be used with 'new'
    const ErrorConstructor = function (this: any, message?: string): any {
      // When called with new, 'this' is bound to the new instance
      // When called as a function, we create a new Error
      if (!(this instanceof ErrorConstructor)) {
        return new Error(message);
      }
      // Called with new - set up the instance
      const error = new Error(message);
      Object.setPrototypeOf(this, error);
      (this as any).message = message || '';
      (this as any).name = 'Error';
      return this;
    };
    // Set as both function and variable so it can be used with 'new'
    this.bindFunction('Error', ErrorConstructor);
    this.currentContext.variables.set('Error', ErrorConstructor);

    // Special values
    this.currentContext.variables.set('Infinity', Infinity);
    this.currentContext.variables.set('NaN', NaN);
    this.currentContext.variables.set('undefined', undefined);

    // Date support
    this.currentContext.variables.set('Date', Date);

    // RegExp constructor support
    this.currentContext.variables.set('RegExp', RegExp);

    // Promise support
    this.currentContext.variables.set('Promise', {
      all: (promises: Promise<any>[]) => Promise.all(promises),
      race: (promises: Promise<any>[]) => Promise.race(promises),
      resolve: (value: any) => Promise.resolve(value),
      reject: (reason: any) => Promise.reject(reason),
    });

    // Array functions - handle async callbacks
    this.bindFunction(
      'filter',
      async (arr: any[], predicate: (value: any, index: number, array: any[]) => unknown) => {
        const results = [];
        for (let i = 0; i < arr.length; i++) {
          const shouldInclude = predicate(arr[i], i, arr);
          // Only await if it's a promise
          if (shouldInclude instanceof Promise ? await shouldInclude : shouldInclude) {
            results.push(arr[i]);
          }
        }
        return results;
      },
    );
    this.bindFunction(
      'map',
      async (arr: any[], mapper: (value: any, index: number, array: any[]) => unknown) => {
        const results = [];
        for (let i = 0; i < arr.length; i++) {
          const result = mapper(arr[i], i, arr);
          // Only await if it's a promise
          results.push(result instanceof Promise ? await result : result);
        }
        return results;
      },
    );
    this.bindFunction(
      'reduce',
      async (
        arr: any[],
        reducer: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any,
        initial?: any,
      ) => {
        let accumulator = initial !== undefined ? initial : arr[0];
        const startIndex = initial !== undefined ? 0 : 1;
        for (let i = startIndex; i < arr.length; i++) {
          const result = reducer(accumulator, arr[i], i, arr);
          // Only await if it's a promise
          accumulator = result instanceof Promise ? await result : result;
        }
        return accumulator;
      },
    );
    this.bindFunction(
      'forEach',
      async (arr: any[], fn: (value: any, index: number, array: any[]) => void) => {
        for (let i = 0; i < arr.length; i++) {
          await fn(arr[i], i, arr);
        }
      },
    );
    this.bindFunction(
      'find',
      async (arr: any[], predicate: (value: any, index: number, obj: any[]) => unknown) => {
        for (let i = 0; i < arr.length; i++) {
          if (await predicate(arr[i], i, arr)) {
            return arr[i];
          }
        }
        return undefined;
      },
    );
    this.bindFunction(
      'some',
      async (arr: any[], predicate: (value: any, index: number, array: any[]) => unknown) => {
        for (let i = 0; i < arr.length; i++) {
          if (await predicate(arr[i], i, arr)) {
            return true;
          }
        }
        return false;
      },
    );
    this.bindFunction(
      'every',
      async (arr: any[], predicate: (value: any, index: number, array: any[]) => unknown) => {
        for (let i = 0; i < arr.length; i++) {
          if (!(await predicate(arr[i], i, arr))) {
            return false;
          }
        }
        return true;
      },
    );
    this.bindFunction('sort', async (arr: any[], compareFn?: (a: any, b: any) => number) => {
      if (!compareFn) return [...arr].sort();
      // Custom async-aware sort
      const sorted = [...arr];
      for (let i = 0; i < sorted.length - 1; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const compareResult = await compareFn(sorted[i], sorted[j]);
          if (compareResult > 0) {
            [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
          }
        }
      }
      return sorted;
    });
    // Commented as stdlib provides this
    // this.bindFunction('reverse', (arr: any[]) => [...arr].reverse());

    // The functional programming test needs a reverse function that works in the pipeline
    // Now provided by stdlib
    // this.currentContext.functions.set('reverse', (arr: any[]) => [...arr].reverse());
    this.bindFunction('slice', (arr: any[], start?: number, end?: number) => arr.slice(start, end));
    this.bindFunction('concat', (...arrays: any[]) => [].concat(...arrays));
    this.bindFunction('join', (arr: any[], separator?: string) => arr.join(separator));
    this.bindFunction('includes', (arr: any[], item: any) => arr.includes(item));
    this.bindFunction('indexOf', (arr: any[], item: any) => {
      if (!Array.isArray(arr)) return -1;
      return arr.indexOf(item);
    });
    this.bindFunction('push', (arr: any[], ...items: any[]) => {
      // JavaScript behavior: push mutates array and returns new length
      return arr.push(...items);
    });
    this.bindFunction(
      'forEach',
      (arr: any[], fn: (value: any, index: number, array: any[]) => void) => {
        if (!Array.isArray(arr)) return;
        arr.forEach(fn);
      },
    );
    this.bindFunction('pop', (arr: any[]) => arr.pop());
    this.bindFunction('shift', (arr: any[]) => arr.shift());
    this.bindFunction('unshift', (arr: any[], ...items: any[]) => {
      // JavaScript behavior: unshift mutates array and returns new length
      return arr.unshift(...items);
    });

    // Object functions - some commented as stdlib provides better versions
    // this.bindFunction('keys', (obj: any) => Object.keys(obj));
    // this.bindFunction('values', (obj: any) => Object.values(obj));
    // this.bindFunction('entries', (obj: any) => Object.entries(obj));
    this.bindFunction('assign', Object.assign);
    this.bindFunction('freeze', Object.freeze);
    this.bindFunction('seal', Object.seal);

    // String functions
    this.bindFunction('toUpperCase', (str: string) => str.toUpperCase());
    this.bindFunction('toLowerCase', (str: string) => str.toLowerCase());
    this.bindFunction('trim', (str: string) => str.trim());
    this.bindFunction('split', (str: string, separator?: string | RegExp) =>
      separator !== undefined ? str.split(separator) : str.split(''),
    );
    this.bindFunction('replace', (str: string, search: string | RegExp, replacement: string) =>
      str.replace(search, replacement),
    );
    this.bindFunction('substring', (str: string, start: number, end?: number) =>
      str.substring(start, end),
    );
    this.bindFunction('charAt', (str: string, index: number) => str.charAt(index));
    this.bindFunction('charCodeAt', (str: string, index: number) => str.charCodeAt(index));
    this.bindFunction('startsWith', (str: string, search: string) => str.startsWith(search));
    this.bindFunction('endsWith', (str: string, search: string) => str.endsWith(search));
    this.bindFunction('repeat', (str: string, count: number) => str.repeat(count));
    this.bindFunction('padStart', (str: string, length: number, fill?: string) =>
      str.padStart(length, fill),
    );
    this.bindFunction('padEnd', (str: string, length: number, fill?: string) =>
      str.padEnd(length, fill),
    );

    // Math functions - commented out as stdlib provides better versions
    // this.bindFunction('abs', Math.abs);
    // this.bindFunction('ceil', Math.ceil);
    // this.bindFunction('floor', Math.floor);
    // this.bindFunction('round', Math.round);
    // this.bindFunction('min', Math.min);
    // this.bindFunction('max', Math.max);
    this.bindFunction('pow', Math.pow);
    this.bindFunction('sqrt', Math.sqrt);
    this.bindFunction('random', Math.random);

    // Type checking
    this.bindFunction('typeof', (val: any) => typeof val);
    this.bindFunction('isArray', Array.isArray);
    this.bindFunction('isNaN', isNaN);
    this.bindFunction('isFinite', isFinite);

    // Parsing
    this.bindFunction('parseInt', parseInt);
    this.bindFunction('parseFloat', parseFloat);
    this.bindFunction('parseJSON', JSON.parse);
    this.bindFunction('stringify', JSON.stringify);

    // Async
    this.bindFunction('wait', (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.bindFunction('Promise', Promise);
  }

  bindFunction(name: string, fn: Function) {
    this.globalContext.functions.set(name, fn);
  }

  setVariable(name: string, value: any) {
    this.globalContext.variables.set(name, value);
  }

  async execute(code: string, context?: ExecutionContext): Promise<any>;
  async execute(
    code: string,
    context: ExecutionContext | undefined,
    options: { withMetadata: true },
  ): Promise<{
    result: any;
    metadata: { logs: Array<{ type: 'log' | 'error' | 'warn'; args: any[]; timestamp: number }> };
  }>;
  async execute(
    code: string,
    context?: ExecutionContext,
    options?: { withMetadata?: boolean },
  ): Promise<any> {
    // Log Wang runtime version on first execution
    if (!WangInterpreter.versionLogged) {
      console.log(`Wang Language Runtime v${VERSION}`);
      WangInterpreter.versionLogged = true;
    }

    // Clear console logs for this execution
    this.consoleLogs = [];

    // Create parser using bundled nearley runtime
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    try {
      // Parse the code
      parser.feed(code);

      if (parser.results.length === 0) {
        throw new WangError('No parse found', { type: 'ParseError' });
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

        // Return with metadata if requested
        if (options?.withMetadata) {
          return {
            result,
            metadata: {
              logs: [...this.consoleLogs],
            },
          };
        }

        // Default: return just the result for backward compatibility
        return result;
      } finally {
        this.currentContext = previousContext;
      }
    } catch (error: any) {
      // Handle return at top level
      if (error && typeof error === 'object' && error.type === 'return') {
        // Return with metadata if requested
        if (options?.withMetadata) {
          return {
            result: error.value,
            metadata: {
              logs: [...this.consoleLogs],
            },
          };
        }
        // Default: return just the value for backward compatibility
        return error.value;
      }

      // For errors, we still throw them but attach metadata
      if (error instanceof WangError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      throw new WangError(
        `Parse error: ${errorMessage}`,
        { type: 'ParseError' },
        error instanceof Error ? error : undefined,
      );
    }
  }

  private createSyncFunction(node: any): Function {
    const capturedContext = this.currentContext;
    const capturedThis = this.currentContext.variables.get('this');
    const interpreter = this;

    const fn = function (this: any, ...args: any[]) {
      // Create new context for function with captured parent context
      const fnContext = interpreter.createContext(capturedContext);

      // For named function expressions, add the function name to scope
      if (node.id && node.id.name) {
        fnContext.variables.set(node.id.name, fn);
      }

      // For arrow functions, preserve captured 'this'
      if (node.type === 'ArrowFunctionExpression') {
        fnContext.variables.set('this', capturedThis);
      } else {
        // Regular functions get 'this' from call context
        fnContext.variables.set('this', this);
      }

      // Bind parameters
      node.params.forEach((param: any, i: number) => {
        if (param.type === 'Identifier') {
          fnContext.variables.set(param.name, args[i]);
        } else if (param.type === 'RestElement') {
          fnContext.variables.set(param.argument.name, args.slice(i));
        } else if (param.type === 'AssignmentPattern') {
          const value = args[i] !== undefined ? args[i] : interpreter.evaluateNodeSync(param.right);
          if (param.left.type === 'Identifier') {
            fnContext.variables.set(param.left.name, value);
          }
        }
      });

      const previousContext = interpreter.currentContext;
      interpreter.currentContext = fnContext;

      try {
        const body = node.body;

        // Arrow functions with expression body
        if (node.type === 'ArrowFunctionExpression' && body.type !== 'BlockStatement') {
          return interpreter.evaluateNodeSync(body);
        }

        // Functions with block body
        let lastValue;
        for (const stmt of body.body) {
          try {
            lastValue = interpreter.evaluateNodeSync(stmt);
          } catch (e: any) {
            if (e.type === 'return') {
              return e.value;
            }
            throw e;
          }
        }
        return lastValue;
      } finally {
        interpreter.currentContext = previousContext;
      }
    };

    return fn;
  }

  private evaluateNodeSync(node: any): any {
    if (!node) return undefined;

    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'RegexLiteral':
        return new RegExp(node.pattern, node.flags);

      case 'Identifier':
        return this.evaluateIdentifier(node);

      case 'MemberExpression':
        const obj = this.evaluateNodeSync(node.object);

        // Handle optional chaining
        if (node.optional && obj == null) {
          return undefined;
        }

        // Throw error when accessing property on null/undefined (non-optional)
        if (!node.optional && obj == null) {
          const objName = node.object.type === 'Identifier' ? node.object.name : 'expression';
          const propName = node.computed ? '<computed>' : node.property.name || '<unknown>';
          const error = new TypeMismatchError(
            'object',
            obj,
            `accessing property '${propName}' of '${objName}'`,
          );
          this.enhanceErrorWithContext(error, node);
          throw error;
        }

        const prop = node.computed ? this.evaluateNodeSync(node.property) : node.property.name;

        // Handle native string methods
        if (typeof obj === 'string') {
          const method = this.getStringMethod(obj, prop);
          if (method) {
            return method;
          }
        }

        // Handle native array methods
        if (Array.isArray(obj)) {
          const method = this.getArrayMethod(obj, prop);
          if (method) {
            return method;
          }
        }

        return obj[prop];

      case 'BinaryExpression':
        const left = this.evaluateNodeSync(node.left);
        const right = this.evaluateNodeSync(node.right);
        switch (node.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          case '%':
            return left % right;
          case '==':
            return left == right;
          case '!=':
            return left != right;
          case '===':
            return left === right;
          case '!==':
            return left !== right;
          case '<':
            return left < right;
          case '<=':
            return left <= right;
          case '>':
            return left > right;
          case '>=':
            return left >= right;
          case '&&':
            return left && right;
          case '||':
            return left || right;
          default:
            throw new WangError(`Unknown binary operator: ${node.operator}`, {
              type: 'RuntimeError',
              suggestions: [
                'Valid operators: +, -, *, /, %, ==, !=, ===, !==, <, <=, >, >=, &&, ||, ??, in, instanceof',
                'Check for typos in the operator',
              ],
            });
        }

      case 'UnaryExpression':
        const arg = this.evaluateNodeSync(node.argument);
        switch (node.operator) {
          case '!':
            return !arg;
          case '-':
            return -arg;
          case '+':
            return +arg;
          case 'typeof':
            return typeof arg;
          default:
            throw new WangError(`Unknown unary operator: ${node.operator}`, {
              type: 'RuntimeError',
              suggestions: [
                'Valid unary operators: !, -, +, ~, typeof, void, delete',
                'Check for typos in the operator',
              ],
            });
        }

      case 'AssignmentExpression':
        const value = this.evaluateNodeSync(node.right);
        if (node.left.type === 'MemberExpression') {
          const obj = this.evaluateNodeSync(node.left.object);
          const prop = node.left.computed
            ? this.evaluateNodeSync(node.left.property)
            : node.left.property.name;
          obj[prop] = value;
        } else if (node.left.type === 'Identifier') {
          this.currentContext.variables.set(node.left.name, value);
        }
        return value;

      case 'ConditionalExpression':
        const test = this.evaluateNodeSync(node.test);
        return test
          ? this.evaluateNodeSync(node.consequent)
          : this.evaluateNodeSync(node.alternate);

      case 'BlockStatement':
        let lastValue;
        for (const stmt of node.body) {
          lastValue = this.evaluateNodeSync(stmt);
        }
        return lastValue;

      case 'ExpressionStatement':
        return this.evaluateNodeSync(node.expression);

      case 'ReturnStatement':
        throw {
          type: 'return',
          value: node.argument ? this.evaluateNodeSync(node.argument) : undefined,
        };

      case 'IfStatement':
        const condition = this.evaluateNodeSync(node.test);
        if (condition) {
          return this.evaluateNodeSync(node.consequent);
        } else if (node.alternate) {
          return this.evaluateNodeSync(node.alternate);
        }
        return undefined;

      case 'CallExpression':
        // Handle synchronous function calls for arrow functions
        let callee;
        let thisContext = null;

        if (node.callee.type === 'MemberExpression') {
          const object = this.evaluateNodeSync(node.callee.object);
          const property = node.callee.computed
            ? this.evaluateNodeSync(node.callee.property)
            : node.callee.property.name;
          callee = object?.[property];
          thisContext = object;
        } else {
          callee = this.evaluateNodeSync(node.callee);
        }

        if (typeof callee !== 'function') {
          const calleeName =
            node.callee.name ||
            (node.callee.type === 'MemberExpression' ? 'member expression' : 'expression');
          const error = new TypeMismatchError('function', callee, `calling '${calleeName}'`);
          this.enhanceErrorWithContext(error, node);
          throw error;
        }

        const args = node.arguments.map((arg: any) => {
          if (arg.type === 'SpreadElement') {
            const spread = this.evaluateNodeSync(arg.argument);
            return spread;
          }
          return this.evaluateNodeSync(arg);
        });

        // Process arguments directly
        const processedArgs = args;

        // Handle spread arguments
        const finalArgs = [];
        for (let i = 0; i < processedArgs.length; i++) {
          if (node.arguments[i].type === 'SpreadElement') {
            finalArgs.push(...processedArgs[i]);
          } else {
            finalArgs.push(processedArgs[i]);
          }
        }

        return callee.apply(thisContext, finalArgs);

      case 'ThrowStatement':
        throw this.evaluateNodeSync(node.argument);

      case 'ThisExpression':
        // Look up 'this' in the current context or parent contexts
        return this.evaluateIdentifier({ name: 'this' });

      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        // Create a synchronous function for arrow/function expressions
        return this.createSyncFunction(node);

      case 'ObjectExpression':
        const objResult: any = {};
        for (const prop of node.properties) {
          if (prop.type === 'SpreadElement') {
            const spread = this.evaluateNodeSync(prop.argument);
            Object.assign(objResult, spread);
          } else {
            const key = prop.computed
              ? this.evaluateNodeSync(prop.key)
              : prop.key.type === 'Identifier'
                ? prop.key.name
                : this.evaluateNodeSync(prop.key);

            if (prop.shorthand) {
              objResult[key] = this.evaluateIdentifier(prop.key);
            } else {
              objResult[key] = this.evaluateNodeSync(prop.value);
            }
          }
        }
        return objResult;

      case 'ArrayExpression':
        const arrResult: any[] = [];
        for (const elem of node.elements) {
          if (elem === null) {
            arrResult.push(undefined);
          } else if (elem.type === 'SpreadElement') {
            const spread = this.evaluateNodeSync(elem.argument);
            if (typeof spread[Symbol.iterator] !== 'function' && !Array.isArray(spread)) {
              throw new Error(
                'Parse error: Spread syntax requires ...iterable[Symbol.iterator] to be a function',
              );
            }
            arrResult.push(...spread);
          } else {
            arrResult.push(this.evaluateNodeSync(elem));
          }
        }
        return arrResult;

      // PipelineExpression removed - not JavaScript compatible

      default:
        throw new WangError(`Cannot evaluate node type synchronously: ${node.type}`, {
          type: 'RuntimeError',
          suggestions: [
            'This node type may require async evaluation',
            'Use await or the async version of this method',
            `Node type '${node.type}' is not supported in synchronous context`,
          ],
        });
    }
  }

  protected async evaluateNode(node: any): Promise<any> {
    if (!node) return undefined;

    switch (node.type) {
      case 'Program':
        return this.evaluateProgram(node);

      case 'VariableDeclaration':
        return this.evaluateVariableDeclaration(node);

      case 'FunctionDeclaration':
        return this.evaluateFunctionDeclaration(node);

      case 'ClassDeclaration':
        return this.evaluateClassDeclaration(node);

      case 'ExpressionStatement':
        return this.evaluateNode(node.expression);

      case 'BlockStatement':
        return this.evaluateBlock(node);

      case 'IfStatement':
        return this.evaluateIfStatement(node);

      case 'ForStatement':
      case 'ForOfStatement':
      case 'ForInStatement':
        return this.evaluateForStatement(node);

      case 'WhileStatement':
        return this.evaluateWhileStatement(node);

      case 'DoWhileStatement':
        return this.evaluateDoWhileStatement(node);

      case 'SwitchStatement':
        return this.evaluateSwitchStatement(node);

      case 'BreakStatement':
        throw {
          type: 'break',
          label: node.label,
        };

      case 'ContinueStatement':
        throw {
          type: 'continue',
          label: node.label,
        };

      case 'LabeledStatement':
        return this.evaluateLabeledStatement(node);

      case 'ReturnStatement':
        throw {
          type: 'return',
          value: node.argument ? await this.evaluateNode(node.argument) : undefined,
        };

      case 'ThrowStatement':
        throw await this.evaluateNode(node.argument);

      case 'TryStatement':
        return this.evaluateTryStatement(node);

      case 'ImportDeclaration':
        return this.evaluateImport(node);

      case 'ExportNamedDeclaration':
        return this.evaluateExport(node);

      // Expressions
      case 'Identifier':
        return this.evaluateIdentifier(node);

      case 'Literal':
        return node.value;

      case 'RegexLiteral':
        return new RegExp(node.pattern, node.flags);

      case 'TemplateLiteral':
        return this.evaluateTemplateLiteral(node);

      case 'ArrayExpression':
        return this.evaluateArrayExpression(node);

      case 'ObjectExpression':
        return this.evaluateObjectExpression(node);

      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        return this.createFunction(node);

      case 'CallExpression':
        return this.evaluateCallExpression(node);

      case 'NewExpression':
        return this.evaluateNewExpression(node);

      case 'MemberExpression':
        return this.evaluateMemberExpression(node);

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node);

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node);

      case 'AssignmentExpression':
        return this.evaluateAssignmentExpression(node);

      case 'UpdateExpression':
        return this.evaluateUpdateExpression(node);

      case 'ConditionalExpression':
        return this.evaluateConditionalExpression(node);

      // PipelineExpression removed - not JavaScript compatible

      case 'ThisExpression':
        // Look up 'this' in the current context or parent contexts
        return this.evaluateIdentifier({ name: 'this' });

      case 'Super':
        return this.currentContext.variables.get('__super__');

      case 'SpreadElement':
        const arr = await this.evaluateNode(node.argument);
        if (!Array.isArray(arr)) {
          const error = new TypeMismatchError('array', arr, 'spread operator');
          this.enhanceErrorWithContext(error, node);
          throw error;
        }
        return arr;

      default:
        throw new WangError(`Unknown node type: ${node.type}`, { type: 'RuntimeError' });
    }
  }

  private async evaluateProgram(node: any): Promise<any> {
    // Process continuations to merge multiline expressions
    const processedBody = this.processContinuations(node.body);

    // Hoist var declarations
    this.hoistVarDeclarations(processedBody);

    let lastValue;
    for (const statement of processedBody) {
      lastValue = await this.evaluateNode(statement);
    }
    return lastValue;
  }

  private processContinuations(statements: any[]): any[] {
    const result = [];

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // PipelineContinuation removed - not JavaScript compatible
      result.push(stmt);
    }

    return result;
  }

  private hoistVarDeclarations(statements: any[]): void {
    for (const statement of statements) {
      if (statement.type === 'VariableDeclaration' && statement.kind === 'var') {
        for (const declarator of statement.declarations) {
          this.hoistVarPattern(declarator.id);
        }
      } else if (statement.type === 'FunctionDeclaration') {
        // Function declarations are also hoisted
        this.currentContext.functions.set(statement.id.name, this.createFunction(statement));
      }
    }
  }

  private hoistVarPattern(pattern: any): void {
    if (pattern.type === 'Identifier') {
      // Pre-declare var with undefined
      if (!this.currentContext.variables.has(pattern.name)) {
        this.currentContext.variables.set(pattern.name, undefined);
        this.currentContext.variableKinds.set(pattern.name, 'var');
      }
    } else if (pattern.type === 'ObjectPattern') {
      for (const prop of pattern.properties) {
        if (prop.type === 'Property') {
          if (prop.shorthand && typeof prop.value === 'string') {
            if (!this.currentContext.variables.has(prop.value)) {
              this.currentContext.variables.set(prop.value, undefined);
              this.currentContext.variableKinds.set(prop.value, 'var');
            }
          } else {
            const bindingPattern =
              typeof prop.value === 'string'
                ? { type: 'Identifier', name: prop.value }
                : prop.value;
            this.hoistVarPattern(bindingPattern);
          }
        } else if (prop.type === 'RestElement') {
          if (!this.currentContext.variables.has(prop.argument)) {
            this.currentContext.variables.set(prop.argument, undefined);
            this.currentContext.variableKinds.set(prop.argument, 'var');
          }
        }
      }
    } else if (pattern.type === 'ArrayPattern') {
      for (const element of pattern.elements) {
        if (element) {
          if (element.type === 'RestElement') {
            const name = element.argument.name || element.argument;
            if (!this.currentContext.variables.has(name)) {
              this.currentContext.variables.set(name, undefined);
              this.currentContext.variableKinds.set(name, 'var');
            }
          } else {
            this.hoistVarPattern(element);
          }
        }
      }
    }
  }

  private async evaluateVariableDeclaration(node: any): Promise<void> {
    for (const declarator of node.declarations) {
      const value = declarator.init ? await this.evaluateNode(declarator.init) : undefined;
      this.assignPattern(declarator.id, value, node.kind);
    }
  }

  private assignPattern(pattern: any, value: any, kind?: 'const' | 'let' | 'var'): void {
    if (pattern.type === 'Identifier') {
      if (kind === 'var') {
        // For var, update in the hoisted scope
        let ctx: ExecutionContext | undefined = this.currentContext;
        while (ctx) {
          if (ctx.variables.has(pattern.name)) {
            ctx.variables.set(pattern.name, value);
            break;
          }
          ctx = ctx.parent;
        }
        if (!ctx) {
          // Not hoisted yet, set in current context
          this.currentContext.variables.set(pattern.name, value);
          this.currentContext.variableKinds.set(pattern.name, 'var');
        }
      } else {
        // For let/const, always create in current scope
        this.currentContext.variables.set(pattern.name, value);
        if (kind) {
          this.currentContext.variableKinds.set(pattern.name, kind);
        }
      }
    } else if (pattern.type === 'ObjectPattern') {
      // Throw error if trying to destructure null or undefined
      if (value == null) {
        const patternType = pattern.type === 'ObjectPattern' ? 'object' : 'array';
        const error = new TypeMismatchError(patternType, value, `destructuring assignment`);
        this.enhanceErrorWithContext(error, pattern);
        throw error;
      }

      for (const prop of pattern.properties) {
        if (prop.type === 'Property') {
          // Get the property key name
          const keyName = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;

          // Handle shorthand properties
          if (prop.shorthand && typeof prop.value === 'string') {
            this.currentContext.variables.set(prop.value, value[keyName]);
            if (kind) {
              this.currentContext.variableKinds.set(prop.value, kind);
            }
          } else {
            // Handle regular properties with nested patterns
            const bindingPattern =
              typeof prop.value === 'string'
                ? { type: 'Identifier', name: prop.value }
                : prop.value;
            this.assignPattern(bindingPattern, value[keyName], kind);
          }
        } else if (prop.type === 'RestElement') {
          const rest = { ...value };
          for (const p of pattern.properties) {
            if (p.type === 'Property') {
              const keyName = p.key.type === 'Identifier' ? p.key.name : p.key.value;
              delete rest[keyName];
            }
          }
          this.currentContext.variables.set(prop.argument, rest);
          if (kind) {
            this.currentContext.variableKinds.set(prop.argument, kind);
          }
        }
      }
    } else if (pattern.type === 'ArrayPattern') {
      // Throw error if trying to destructure null or undefined
      if (value == null) {
        const patternType = pattern.type === 'ObjectPattern' ? 'object' : 'array';
        const error = new TypeMismatchError(patternType, value, `destructuring assignment`);
        this.enhanceErrorWithContext(error, pattern);
        throw error;
      }

      const arr = Array.isArray(value) ? value : [];
      let index = 0;
      for (const element of pattern.elements) {
        if (element) {
          if (element.type === 'RestElement') {
            this.currentContext.variables.set(
              element.argument.name || element.argument,
              arr.slice(index),
            );
            if (kind) {
              this.currentContext.variableKinds.set(
                element.argument.name || element.argument,
                kind,
              );
            }
          } else {
            this.assignPattern(element, arr[index], kind);
          }
        }
        index++;
      }
    }
  }

  private async evaluateFunctionDeclaration(node: any): Promise<void> {
    const fn = this.createFunction(node);
    this.currentContext.functions.set(node.id.name, fn);
  }

  private createFunction(node: any): Function {
    const params = node.params || [];
    const body = node.body;
    const isAsync = node.async;

    // Capture the context at function creation time (for closures)
    // This captures the entire execution context including local variables
    const capturedContext = this.currentContext;

    // For arrow functions, capture 'this' from the current context
    const capturedThis =
      node.type === 'ArrowFunctionExpression'
        ? this.currentContext.variables.get('this')
        : undefined;

    // For non-async arrow functions with expression bodies, create synchronous functions
    if (!isAsync && node.type === 'ArrowFunctionExpression' && body.type !== 'BlockStatement') {
      const fn = (...args: any[]) => {
        // Create new context for function with captured parent context
        const fnContext = this.createContext(capturedContext);

        // Arrow functions always use the captured 'this'
        fnContext.variables.set('this', capturedThis);

        // Execute function body
        const previousContext = this.currentContext;
        this.currentContext = fnContext;

        // Bind parameters in the new context
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          if (param.type === 'RestElement') {
            fnContext.variables.set(param.argument.name || param.argument, args.slice(i));
          } else if (param.type === 'Identifier') {
            fnContext.variables.set(param.name, args[i]);
          } else if (param.type === 'AssignmentPattern') {
            // Handle default parameters
            const value = args[i] !== undefined ? args[i] : this.evaluateNodeSync(param.right);
            if (param.left.type === 'Identifier') {
              fnContext.variables.set(param.left.name, value);
            }
          }
        }

        try {
          // For arrow functions with expression body, evaluate and return the expression synchronously
          const result = this.evaluateNodeSync(body);
          return result;
        } finally {
          this.currentContext = previousContext;
        }
      };

      return fn;
    }

    // For async functions or functions with block statements, keep the async behavior
    // We need to use a regular function (not arrow) to receive 'this' from apply()
    const interpreter = this;
    const fn = async function (this: any, ...args: any[]) {
      // Create new context for function with captured parent context
      const fnContext = interpreter.createContext(capturedContext);

      // For named function expressions, add the function name to scope
      if (node.id && node.id.name) {
        fnContext.variables.set(node.id.name, fn);
      }

      // For arrow functions, use captured 'this'; for regular functions, use the passed 'this'
      if (node.type === 'ArrowFunctionExpression') {
        // Arrow functions always use the captured 'this', ignoring the passed 'this'
        fnContext.variables.set('this', capturedThis);
      } else {
        // Regular function - use the 'this' passed via apply()
        fnContext.variables.set('this', this);
      }

      // Execute function body
      const previousContext = interpreter.currentContext;
      interpreter.currentContext = fnContext;

      // Bind parameters in the new context
      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        if (param.type === 'RestElement') {
          fnContext.variables.set(param.argument.name || param.argument, args.slice(i));
          break;
        } else if (param.type === 'AssignmentPattern') {
          // Handle default parameters
          const value =
            i < args.length && args[i] !== undefined
              ? args[i]
              : await interpreter.evaluateNode(param.right);
          interpreter.assignPattern(param.left, value);
        } else {
          interpreter.assignPattern(param, args[i]);
        }
      }

      try {
        if (body.type === 'BlockStatement') {
          // Hoist var declarations in function body
          interpreter.hoistVarDeclarations(body.body);
          await interpreter.evaluateBlock(body);
          return undefined;
        } else {
          // Arrow function with expression body
          return await interpreter.evaluateNode(body);
        }
      } catch (e: any) {
        if (e?.type === 'return') {
          return e.value;
        }
        throw e;
      } finally {
        interpreter.currentContext = previousContext;
      }
    };

    return isAsync
      ? fn
      : function (this: any, ...args: any[]) {
          // Use regular function to preserve 'this'
          const result = fn.apply(this, args); // Pass 'this' through
          return result instanceof Promise ? result : Promise.resolve(result);
        };
  }

  private async evaluateClassDeclaration(node: any): Promise<void> {
    const className = node.id.name;
    const superClass = node.superClass ? this.evaluateIdentifier(node.superClass) : null;

    // Find constructor method
    const constructorMethod = node.body.body.find((m: any) => m.kind === 'constructor');

    // Create the class constructor function
    const interpreter = this;

    // Create a regular constructor function (not async) that returns a promise
    const classConstructor = function (this: any, ...args: any[]) {
      // Return a promise that creates and initializes the instance
      return (async () => {
        // Create instance
        const instance = Object.create(classConstructor.prototype);

        // Execute constructor if exists
        if (constructorMethod) {
          // Create a new context for constructor execution
          const constructorContext = interpreter.createContext(interpreter.currentContext);
          constructorContext.variables.set('this', instance);

          // Set up super constructor if there's inheritance
          if (superClass) {
            constructorContext.variables.set('__super__', async (...superArgs: any[]) => {
              // Call parent constructor and copy properties to instance
              const parentInstance = await superClass(...superArgs);

              // Standard Object.assign for enumerable properties
              Object.assign(instance, parentInstance);

              // Special handling for Error class - copy non-enumerable properties
              if (parentInstance instanceof Error) {
                if (parentInstance.message !== undefined) {
                  instance.message = parentInstance.message;
                }
                if (parentInstance.name !== undefined) {
                  instance.name = parentInstance.name;
                }
                if (parentInstance.stack !== undefined) {
                  instance.stack = parentInstance.stack;
                }
              }
            });
          }

          // Bind constructor parameters
          for (let i = 0; i < constructorMethod.params.length; i++) {
            const param = constructorMethod.params[i];
            if (param.type === 'Identifier') {
              constructorContext.variables.set(param.name, args[i]);
            }
          }

          // Execute constructor body
          const prevContext = interpreter.currentContext;
          interpreter.currentContext = constructorContext;
          try {
            // Run constructor body
            for (const stmt of constructorMethod.body.body) {
              await interpreter.evaluateNode(stmt);
            }
          } finally {
            interpreter.currentContext = prevContext;
          }
        }

        return instance;
      })();
    };

    // Set up inheritance FIRST if needed
    if (superClass) {
      classConstructor.prototype = Object.create(superClass.prototype);
      classConstructor.prototype.constructor = classConstructor;
    }

    // THEN add methods to prototype or class (after inheritance is set up)
    for (const method of node.body.body) {
      if (method.type === 'MethodDefinition' && method.kind !== 'constructor') {
        const methodName = method.key.name;

        // Handle getters and setters differently
        if (method.kind === 'get' || method.kind === 'set') {
          // For getters and setters, we need synchronous execution
          // We'll compile the body to a simple synchronous function
          const target = method.static ? classConstructor : classConstructor.prototype;
          const descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(
            target,
            methodName,
          ) || {
            configurable: true,
            enumerable: true,
          };

          if (method.kind === 'get') {
            descriptor.get = function (this: any) {
              // Create context for getter execution
              const getterContext = interpreter.createContext(interpreter.currentContext);
              getterContext.variables.set('this', this);

              // Execute getter body synchronously
              const prevContext = interpreter.currentContext;
              interpreter.currentContext = getterContext;
              try {
                // For simple getters, we can evaluate synchronously
                // This assumes the getter body doesn't use async operations
                let lastValue;
                for (const stmt of method.body.body) {
                  try {
                    lastValue = interpreter.evaluateNodeSync(stmt);
                  } catch (e: any) {
                    if (e.type === 'return') {
                      return e.value;
                    }
                    throw e;
                  }
                }
                return lastValue;
              } finally {
                interpreter.currentContext = prevContext;
              }
            };
          } else {
            descriptor.set = function (this: any, value: any) {
              // Create context for setter execution
              const setterContext = interpreter.createContext(interpreter.currentContext);
              setterContext.variables.set('this', this);

              // Bind setter parameter
              if (method.params.length > 0) {
                const param = method.params[0];
                if (param.type === 'Identifier') {
                  setterContext.variables.set(param.name, value);
                }
              }

              // Execute setter body synchronously
              const prevContext = interpreter.currentContext;
              interpreter.currentContext = setterContext;
              try {
                for (const stmt of method.body.body) {
                  // Synchronously evaluate statements
                  if (stmt.type === 'ExpressionStatement') {
                    interpreter.evaluateNodeSync(stmt.expression);
                  } else if (stmt.type === 'IfStatement') {
                    const condition = interpreter.evaluateNodeSync(stmt.test);
                    if (condition) {
                      interpreter.evaluateNodeSync(stmt.consequent);
                    } else if (stmt.alternate) {
                      interpreter.evaluateNodeSync(stmt.alternate);
                    }
                  } else if (stmt.type === 'ThrowStatement') {
                    throw interpreter.evaluateNodeSync(stmt.argument);
                  }
                }
              } finally {
                interpreter.currentContext = prevContext;
              }
            };
          }

          Object.defineProperty(target, methodName, descriptor);
        } else {
          // Regular method
          const methodFunction = async function (this: any, ...args: any[]) {
            // Create context for method execution
            const methodContext = interpreter.createContext(interpreter.currentContext);

            // For static methods, 'this' is the class itself
            // For instance methods, 'this' is the instance
            methodContext.variables.set('this', method.static ? classConstructor : this);

            // Bind method parameters
            for (let i = 0; i < method.params.length; i++) {
              const param = method.params[i];
              if (param.type === 'Identifier') {
                methodContext.variables.set(param.name, args[i]);
              } else if (param.type === 'AssignmentPattern') {
                // Handle default parameters
                const value =
                  i < args.length && args[i] !== undefined
                    ? args[i]
                    : await interpreter.evaluateNode(param.right);
                if (param.left.type === 'Identifier') {
                  methodContext.variables.set(param.left.name, value);
                }
              }
            }

            // Execute method body
            const prevContext = interpreter.currentContext;
            interpreter.currentContext = methodContext;
            try {
              // Execute statements
              let lastValue;
              for (const stmt of method.body.body) {
                try {
                  lastValue = await interpreter.evaluateNode(stmt);
                } catch (e: any) {
                  if (e.type === 'return') {
                    return e.value;
                  }
                  throw e;
                }
              }
              return lastValue;
            } finally {
              interpreter.currentContext = prevContext;
            }
          };

          // Add method to class (static) or prototype (instance)
          if (method.static) {
            (classConstructor as any)[methodName] = methodFunction;
          } else {
            classConstructor.prototype[methodName] = methodFunction;
          }
        }
      }
    }

    // Store the class
    this.currentContext.classes.set(className, classConstructor);
    this.currentContext.variables.set(className, classConstructor);
  }

  private async evaluateBlock(node: any): Promise<any> {
    // Create a new scope for block-scoped variables (let/const)
    const blockContext = this.createContext(this.currentContext);
    const previousContext = this.currentContext;
    this.currentContext = blockContext;

    try {
      // Process continuations to merge multiline expressions
      // Check if we've already processed this block
      if (!node._processedBody) {
        node._processedBody = this.processContinuations(node.body);
      }
      const processedBody = node._processedBody;

      let lastValue;
      for (const statement of processedBody) {
        lastValue = await this.evaluateNode(statement);
      }
      return lastValue;
    } finally {
      this.currentContext = previousContext;
    }
  }

  private async evaluateIfStatement(node: any): Promise<any> {
    const test = await this.evaluateNode(node.test);
    if (test) {
      return await this.evaluateNode(node.consequent);
    } else if (node.alternate) {
      return await this.evaluateNode(node.alternate);
    }
  }

  private async evaluateForStatement(node: any): Promise<any> {
    if (node.type === 'ForOfStatement') {
      const iterable = await this.evaluateNode(node.right);
      if (iterable == null) {
        const error = new TypeMismatchError('iterable', iterable, `for...of loop`);
        this.enhanceErrorWithContext(error, node);
        throw error;
      }
      if (typeof iterable[Symbol.iterator] !== 'function' && !Array.isArray(iterable)) {
        const error = new TypeMismatchError(
          'iterable (Array, Set, Map, String, etc.)',
          iterable,
          `for...of loop`,
        );
        this.enhanceErrorWithContext(error, node);
        throw error;
      }
      for (const item of iterable) {
        if (node.left.type === 'VariableDeclaration') {
          this.assignPattern(node.left.declarations[0].id, item);
        }
        try {
          await this.evaluateNode(node.body);
        } catch (e: any) {
          if (e.type === 'break' && !e.label) {
            break;
          } else if (e.type === 'continue' && !e.label) {
            continue;
          }
          throw e;
        }
      }
    } else if (node.type === 'ForInStatement') {
      const obj = await this.evaluateNode(node.right);
      if (obj == null) {
        const error = new TypeMismatchError('object', obj, `for...in loop`);
        this.enhanceErrorWithContext(error, node);
        throw error;
      }
      for (const key in obj) {
        if (node.left.type === 'VariableDeclaration') {
          this.assignPattern(node.left.declarations[0].id, key);
        }
        try {
          await this.evaluateNode(node.body);
        } catch (e: any) {
          if (e.type === 'break' && !e.label) {
            break;
          } else if (e.type === 'continue' && !e.label) {
            continue;
          }
          throw e;
        }
      }
    } else {
      // Regular for loop
      if (node.init) await this.evaluateNode(node.init);
      while (node.test ? await this.evaluateNode(node.test) : true) {
        try {
          await this.evaluateNode(node.body);
        } catch (e: any) {
          if (e.type === 'break' && !e.label) {
            break;
          } else if (e.type === 'continue' && !e.label) {
            if (node.update) await this.evaluateNode(node.update);
            continue;
          }
          throw e;
        }
        if (node.update) await this.evaluateNode(node.update);
      }
    }
  }

  private async evaluateWhileStatement(node: any): Promise<any> {
    while (await this.evaluateNode(node.test)) {
      try {
        await this.evaluateNode(node.body);
      } catch (e: any) {
        if (e.type === 'break' && !e.label) {
          break;
        } else if (e.type === 'continue' && !e.label) {
          continue;
        }
        throw e;
      }
    }
  }

  private async evaluateDoWhileStatement(node: any): Promise<any> {
    do {
      try {
        await this.evaluateNode(node.body);
      } catch (e: any) {
        if (e.type === 'break' && !e.label) {
          break;
        } else if (e.type === 'continue' && !e.label) {
          continue;
        }
        throw e;
      }
    } while (await this.evaluateNode(node.test));
  }

  private async evaluateLabeledStatement(node: any): Promise<any> {
    try {
      return await this.evaluateNode(node.body);
    } catch (e: any) {
      // Check if break/continue is for this label
      if ((e.type === 'break' || e.type === 'continue') && e.label === node.label) {
        if (e.type === 'break') {
          // Break out of the labeled statement
          return;
        } else {
          // For continue with label, re-throw to let the loop handle it
          throw e;
        }
      }
      throw e;
    }
  }

  private async evaluateSwitchStatement(node: any): Promise<any> {
    const discriminant = await this.evaluateNode(node.discriminant);
    let foundMatch = false;

    for (const switchCase of node.cases) {
      // Check if this case matches or we're in fall-through mode
      if (!foundMatch) {
        if (switchCase.test === null) {
          // default case
          foundMatch = true;
        } else {
          const caseValue = await this.evaluateNode(switchCase.test);
          if (discriminant === caseValue) {
            foundMatch = true;
          }
        }
      }

      // Execute the case if we've found a match
      if (foundMatch) {
        try {
          // Execute all statements in the case
          for (const stmt of switchCase.consequent) {
            await this.evaluateNode(stmt);
          }
        } catch (e: any) {
          if (e.type === 'break') {
            break; // Exit the switch
          }
          throw e;
        }
      }
    }
  }

  private async evaluateTryStatement(node: any): Promise<any> {
    let result: any;

    try {
      result = await this.evaluateNode(node.block);
    } catch (error: any) {
      // Re-throw control flow statements
      if (
        error &&
        typeof error === 'object' &&
        (error.type === 'break' || error.type === 'continue' || error.type === 'return')
      ) {
        throw error;
      }

      if (node.handler) {
        if (node.handler.param) {
          this.assignPattern(node.handler.param, error);
        }
        result = await this.evaluateNode(node.handler.body);
      } else {
        throw error;
      }
    } finally {
      if (node.finalizer) {
        const finallyResult = await this.evaluateNode(node.finalizer);
        // In JavaScript, finally block return value overrides try/catch return value
        // only if it's not undefined (unless finally explicitly returns undefined)
        result = finallyResult;
      }
    }

    return result;
  }

  private evaluateIdentifier(node: any): any {
    const name = node.name;

    // Underscore no longer has special meaning

    // Check variables
    if (this.currentContext.variables.has(name)) {
      return this.currentContext.variables.get(name);
    }

    // Check parent contexts
    let context = this.currentContext.parent;
    while (context) {
      if (context.variables.has(name)) {
        return context.variables.get(name);
      }
      context = context.parent;
    }

    // Check functions
    if (this.currentContext.functions.has(name)) {
      return this.currentContext.functions.get(name);
    }

    // Check global functions
    if (this.globalContext.functions.has(name)) {
      return this.globalContext.functions.get(name);
    }

    // Check classes
    if (this.currentContext.classes.has(name)) {
      return this.currentContext.classes.get(name);
    }

    const error = new UndefinedVariableError(name, [...this.currentContext.variables.keys()]);
    this.enhanceErrorWithContext(error, node);
    throw error;
  }

  private async evaluateCallExpression(node: any): Promise<any> {
    // Handle super() calls
    if (node.callee.type === 'Super') {
      const superConstructor = this.currentContext.variables.get('__super__');
      if (!superConstructor) {
        const error = new WangError('super() can only be called in a derived class constructor', {
          type: 'RuntimeError',
        });
        this.enhanceErrorWithContext(error, node);
        throw error;
      }
      const args = [];
      for (const arg of node.arguments) {
        if (arg.type === 'SpreadElement') {
          const spread = await this.evaluateNode(arg.argument);
          if (typeof spread[Symbol.iterator] !== 'function' && !Array.isArray(spread)) {
            throw new Error(
              'Parse error: Spread syntax requires ...iterable[Symbol.iterator] to be a function',
            );
          }
          args.push(...spread);
        } else {
          args.push(await this.evaluateNode(arg));
        }
      }
      return superConstructor(...args);
    }

    // If the callee is a member expression, we need to preserve the object as 'this'
    let thisContext = null;
    let callee;

    if (node.callee.type === 'MemberExpression') {
      const object = await this.evaluateNode(node.callee.object);
      thisContext = object; // Preserve the object as 'this'

      // Handle optional chaining
      if (node.callee.optional && object == null) {
        callee = undefined;
      } else if (!node.callee.optional && object == null) {
        // Throw error when accessing property on null/undefined (non-optional)
        const objName =
          node.callee.object.type === 'Identifier' ? node.callee.object.name : 'expression';
        const propName = node.callee.computed
          ? '<computed>'
          : node.callee.property.name || '<unknown>';
        const error = new TypeMismatchError(
          'object',
          object,
          `accessing property '${propName}' of '${objName}'`,
        );
        this.enhanceErrorWithContext(error, node.callee);
        throw error;
      } else {
        // Get the property name
        const property = node.callee.computed
          ? await this.evaluateNode(node.callee.property)
          : node.callee.property.name;

        // Check for native methods on the already-evaluated object
        if (typeof object === 'string') {
          const method = this.getStringMethod(object, property);
          if (method) {
            callee = method;
          } else {
            callee = object[property];
          }
        } else if (Array.isArray(object)) {
          const method = this.getArrayMethod(object, property);
          if (method) {
            callee = method;
          } else {
            callee = object[property];
          }
        } else {
          // Regular property access
          callee = object[property];
        }
      }
    } else {
      callee = await this.evaluateNode(node.callee);
    }

    if (typeof callee !== 'function') {
      const calleeName =
        node.callee.type === 'Identifier'
          ? node.callee.name
          : node.callee.type === 'MemberExpression'
            ? 'member expression'
            : 'expression';
      const error = new TypeMismatchError('function', callee, `calling '${calleeName}'`);
      this.enhanceErrorWithContext(error, node);
      throw error;
    }

    const args = [];
    for (const arg of node.arguments) {
      if (arg.type === 'SpreadElement') {
        const spread = await this.evaluateNode(arg.argument);
        if (typeof spread[Symbol.iterator] !== 'function' && !Array.isArray(spread)) {
          throw new Error(
            'Parse error: Spread syntax requires ...iterable[Symbol.iterator] to be a function',
          );
        }
        args.push(...spread);
      } else {
        args.push(await this.evaluateNode(arg));
      }
    }

    // Process arguments directly
    const processedArgs = args;

    // Add to call stack
    const calleeName =
      node.callee.type === 'Identifier'
        ? node.callee.name
        : node.callee.type === 'MemberExpression'
          ? node.callee.property.name || '<computed>'
          : '<anonymous>';
    const loc = this.getNodeLocation(node);
    const stackFrame: CallStackFrame = {
      functionName: calleeName,
      modulePath: this.currentModulePath,
      line: loc.line,
      column: loc.column,
      nodeType: 'CallExpression',
    };

    this.callStack.push(stackFrame);
    try {
      return await callee.apply(thisContext, processedArgs);
    } finally {
      this.callStack.pop();
    }
  }

  // evaluatePipelineExpression removed - not JavaScript compatible

  private async evaluateBinaryExpression(node: any): Promise<any> {
    const left = await this.evaluateNode(node.left);
    const right = await this.evaluateNode(node.right);

    switch (node.operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '%':
        return left % right;
      case '**':
        return left ** right;
      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '===':
        return left === right;
      case '!==':
        return left !== right;
      case '<':
        return left < right;
      case '>':
        return left > right;
      case '<=':
        return left <= right;
      case '>=':
        return left >= right;
      case '&&':
        return left && right;
      case '||':
        return left || right;
      case '??':
        return left ?? right;
      default:
        throw new WangError(`Unknown binary operator: ${node.operator}`, { type: 'RuntimeError' });
    }
  }

  private async evaluateUnaryExpression(node: any): Promise<any> {
    // Handle prefix increment/decrement specially
    if (node.operator === '++' || node.operator === '--') {
      if (node.argument.type !== 'Identifier') {
        throw new WangError('Prefix increment/decrement only supports identifiers', {
          type: 'RuntimeError',
        });
      }

      const name = node.argument.name;
      const oldValue = this.evaluateIdentifier(node.argument) || 0;
      const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;

      // Update in the correct context
      let ctx: ExecutionContext | undefined = this.currentContext;
      while (ctx) {
        if (ctx.variables.has(name)) {
          ctx.variables.set(name, newValue);
          break;
        }
        ctx = ctx.parent;
      }
      if (!ctx) {
        // Variable doesn't exist, create it in current context
        this.currentContext.variables.set(name, newValue);
      }

      return newValue; // Prefix returns new value
    }

    // Special handling for typeof - don't throw if variable doesn't exist
    if (node.operator === 'typeof') {
      if (node.argument.type === 'Identifier') {
        const name = node.argument.name;
        // Check if variable exists without evaluating
        let ctx: ExecutionContext | undefined = this.currentContext;
        while (ctx) {
          if (ctx.variables.has(name)) {
            const value = ctx.variables.get(name);
            return typeof value;
          }
          if (ctx.functions.has(name)) {
            return 'function';
          }
          ctx = ctx.parent;
        }
        // Check global functions
        if (this.currentContext.functions.has(name)) {
          return 'function';
        }
        // Variable doesn't exist, typeof returns 'undefined'
        return 'undefined';
      } else {
        // For non-identifiers, evaluate normally
        const argument = await this.evaluateNode(node.argument);
        return typeof argument;
      }
    }

    const argument = await this.evaluateNode(node.argument);

    switch (node.operator) {
      case '!':
        return !argument;
      case '+':
        return +argument;
      case '-':
        return -argument;
      case 'await':
        return await argument;
      default:
        throw new WangError(`Unknown unary operator: ${node.operator}`, { type: 'RuntimeError' });
    }
  }

  private async evaluateAssignmentExpression(node: any): Promise<any> {
    const value = await this.evaluateNode(node.right);

    if (node.left.type === 'Identifier') {
      const name = node.left.name;

      switch (node.operator) {
        case '=':
          // Find the right context to set the variable
          let ctx: ExecutionContext | undefined = this.currentContext;
          let found = false;
          while (ctx) {
            if (ctx.variables.has(name)) {
              // Check if it's a const variable
              if (ctx.variableKinds.get(name) === 'const') {
                throw new WangError(`Cannot reassign const variable "${name}"`);
              }
              ctx.variables.set(name, value);
              found = true;
              break;
            }
            ctx = ctx.parent;
          }
          if (!found) {
            // Variable doesn't exist, create in current context
            this.currentContext.variables.set(name, value);
          }
          return value;
        case '+=':
          const oldValue = this.evaluateIdentifier(node.left) || 0;
          const newValue = oldValue + value;
          // Update in the correct context
          let addCtx: ExecutionContext | undefined = this.currentContext;
          while (addCtx) {
            if (addCtx.variables.has(name)) {
              // Check if it's a const variable
              if (addCtx.variableKinds.get(name) === 'const') {
                throw new WangError(`Cannot reassign const variable "${name}"`);
              }
              addCtx.variables.set(name, newValue);
              break;
            }
            addCtx = addCtx.parent;
          }
          if (!addCtx) {
            this.currentContext.variables.set(name, newValue);
          }
          return newValue;
        case '-=':
          const oldVal = this.evaluateIdentifier(node.left) || 0;
          const newVal = oldVal - value;
          let subCtx: ExecutionContext | undefined = this.currentContext;
          while (subCtx) {
            if (subCtx.variables.has(name)) {
              // Check if it's a const variable
              if (subCtx.variableKinds.get(name) === 'const') {
                throw new WangError(`Cannot reassign const variable "${name}"`);
              }
              subCtx.variables.set(name, newVal);
              break;
            }
            subCtx = subCtx.parent;
          }
          if (!subCtx) {
            this.currentContext.variables.set(name, newVal);
          }
          return newVal;
        case '*=':
          const oldMulVal = this.evaluateIdentifier(node.left) || 0;
          const newMulVal = oldMulVal * value;
          let mulCtx: ExecutionContext | undefined = this.currentContext;
          while (mulCtx) {
            if (mulCtx.variables.has(name)) {
              // Check if it's a const variable
              if (mulCtx.variableKinds.get(name) === 'const') {
                throw new WangError(`Cannot reassign const variable "${name}"`);
              }
              mulCtx.variables.set(name, newMulVal);
              break;
            }
            mulCtx = mulCtx.parent;
          }
          if (!mulCtx) {
            this.currentContext.variables.set(name, newMulVal);
          }
          return newMulVal;
        case '/=':
          const oldDivVal = this.evaluateIdentifier(node.left) || 0;
          const newDivVal = oldDivVal / value;
          let divCtx: ExecutionContext | undefined = this.currentContext;
          while (divCtx) {
            if (divCtx.variables.has(name)) {
              // Check if it's a const variable
              if (divCtx.variableKinds.get(name) === 'const') {
                throw new WangError(`Cannot reassign const variable "${name}"`);
              }
              divCtx.variables.set(name, newDivVal);
              break;
            }
            divCtx = divCtx.parent;
          }
          if (!divCtx) {
            this.currentContext.variables.set(name, newDivVal);
          }
          return newDivVal;
        default:
          throw new WangError(`Assignment operator ${node.operator} not implemented`, {
            type: 'RuntimeError',
          });
      }
    } else if (node.left.type === 'MemberExpression') {
      // Handle property assignment (e.g., obj.prop = value)
      const object = await this.evaluateNode(node.left.object);
      const property = node.left.computed
        ? await this.evaluateNode(node.left.property)
        : node.left.property.name;

      if (object == null) {
        throw new WangError(`Cannot set property '${property}' on null or undefined`, {
          type: 'RuntimeError',
        });
      }

      switch (node.operator) {
        case '=':
          object[property] = value;
          return value;
        case '+=':
          object[property] = (object[property] || 0) + value;
          return object[property];
        case '-=':
          object[property] = (object[property] || 0) - value;
          return object[property];
        case '*=':
          object[property] = (object[property] || 0) * value;
          return object[property];
        case '/=':
          object[property] = (object[property] || 0) / value;
          return object[property];
        default:
          throw new WangError(
            `Assignment operator ${node.operator} not implemented for member expressions`,
            { type: 'RuntimeError' },
          );
      }
    }

    throw new WangError('Complex assignment patterns not yet implemented', {
      type: 'RuntimeError',
    });
  }

  private async evaluateUpdateExpression(node: any): Promise<any> {
    if (node.argument.type === 'Identifier') {
      // Handle identifier update (x++, --y)
      const name = node.argument.name;
      const oldValue = this.evaluateIdentifier(node.argument) || 0;
      const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;

      // Update in the correct context
      let ctx: ExecutionContext | undefined = this.currentContext;
      while (ctx) {
        if (ctx.variables.has(name)) {
          // Check if it's a const variable
          if (ctx.variableKinds.get(name) === 'const') {
            throw new WangError(`Cannot reassign const variable "${name}"`);
          }
          ctx.variables.set(name, newValue);
          break;
        }
        ctx = ctx.parent;
      }
      if (!ctx) {
        // Variable doesn't exist, create it in current context
        this.currentContext.variables.set(name, newValue);
      }

      return node.prefix ? newValue : oldValue;
    } else if (node.argument.type === 'MemberExpression') {
      // Handle member expression update (obj.prop++, this.count++)
      const object = await this.evaluateNode(node.argument.object);
      const property = node.argument.computed
        ? await this.evaluateNode(node.argument.property)
        : node.argument.property.name;

      if (object == null) {
        const objName =
          node.argument.object.type === 'Identifier' ? node.argument.object.name : 'expression';
        throw new TypeMismatchError(
          'object',
          object,
          `updating property '${property}' of '${objName}'`,
        );
      }

      const oldValue = object[property] || 0;
      const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;
      object[property] = newValue;

      return node.prefix ? newValue : oldValue;
    }

    throw new WangError('Update expression only supports identifiers and member expressions', {
      type: 'RuntimeError',
    });
  }

  private async evaluateConditionalExpression(node: any): Promise<any> {
    const test = await this.evaluateNode(node.test);
    return test
      ? await this.evaluateNode(node.consequent)
      : await this.evaluateNode(node.alternate);
  }

  private async evaluateMemberExpression(node: any): Promise<any> {
    const object = await this.evaluateNode(node.object);

    if (node.optional && object == null) {
      return undefined;
    }

    // Throw error when accessing property on null/undefined (non-optional)
    if (!node.optional && object == null) {
      const objName = node.object.type === 'Identifier' ? node.object.name : 'expression';
      const propName = node.computed ? '<computed>' : node.property.name || '<unknown>';
      const error = new TypeMismatchError(
        'object',
        object,
        `accessing property '${propName}' of '${objName}'`,
      );
      this.enhanceErrorWithContext(error, node);
      throw error;
    }

    const property = node.computed ? await this.evaluateNode(node.property) : node.property.name;

    // Handle native string methods
    if (typeof object === 'string') {
      const method = this.getStringMethod(object, property);
      if (method) {
        return method;
      }
    }

    // Handle native array methods
    if (Array.isArray(object)) {
      const method = this.getArrayMethod(object, property);
      if (method) {
        return method;
      }
    }

    return object[property];
  }

  private getStringMethod(str: string, methodName: string): Function | undefined {
    const interpreter = this;

    switch (methodName) {
      case 'split':
        return (separator?: string | RegExp) => {
          // Use the built-in function or native method
          const splitFn = interpreter.currentContext.functions.get('split');
          return splitFn ? splitFn(str, separator) : str.split(separator as any);
        };

      case 'includes':
        return (searchString: string, position?: number) => str.includes(searchString, position);

      case 'indexOf':
        return (searchString: string, position?: number) => str.indexOf(searchString, position);

      case 'lastIndexOf':
        return (searchString: string, position?: number) => str.lastIndexOf(searchString, position);

      case 'substring':
        return (start: number, end?: number) => {
          const substringFn = interpreter.currentContext.functions.get('substring');
          return substringFn ? substringFn(str, start, end) : str.substring(start, end);
        };

      case 'substr':
        return (start: number, length?: number) => str.substr(start, length);

      case 'slice':
        return (start?: number, end?: number) => str.slice(start, end);

      case 'trim':
        return () => {
          const trimFn = interpreter.currentContext.functions.get('trim');
          return trimFn ? trimFn(str) : str.trim();
        };

      case 'trimStart':
      case 'trimLeft':
        return () => str.trimStart();

      case 'trimEnd':
      case 'trimRight':
        return () => str.trimEnd();

      case 'replace':
        return (searchValue: string | RegExp, replaceValue: string) => {
          const replaceFn = interpreter.currentContext.functions.get('replace');
          return replaceFn
            ? replaceFn(str, searchValue, replaceValue)
            : str.replace(searchValue, replaceValue);
        };

      case 'replaceAll':
        return (searchValue: string | RegExp, replaceValue: string) => {
          // Use replaceAll if available (ES2021+), otherwise use replace with global flag
          if ('replaceAll' in String.prototype) {
            return (str as any).replaceAll(searchValue, replaceValue);
          }
          // Fallback for older environments
          if (typeof searchValue === 'string') {
            return str.replace(
              new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              replaceValue,
            );
          }
          return str.replace(searchValue, replaceValue);
        };

      case 'toLowerCase':
        return () => {
          const toLowerCaseFn = interpreter.currentContext.functions.get('toLowerCase');
          return toLowerCaseFn ? toLowerCaseFn(str) : str.toLowerCase();
        };

      case 'toUpperCase':
        return () => {
          const toUpperCaseFn = interpreter.currentContext.functions.get('toUpperCase');
          return toUpperCaseFn ? toUpperCaseFn(str) : str.toUpperCase();
        };

      case 'charAt':
        return (index: number) => {
          const charAtFn = interpreter.currentContext.functions.get('charAt');
          return charAtFn ? charAtFn(str, index) : str.charAt(index);
        };

      case 'charCodeAt':
        return (index: number) => {
          const charCodeAtFn = interpreter.currentContext.functions.get('charCodeAt');
          return charCodeAtFn ? charCodeAtFn(str, index) : str.charCodeAt(index);
        };

      case 'startsWith':
        return (searchString: string, position?: number) => {
          const startsWithFn = interpreter.currentContext.functions.get('startsWith');
          return startsWithFn
            ? startsWithFn(str, searchString)
            : str.startsWith(searchString, position);
        };

      case 'endsWith':
        return (searchString: string, length?: number) => {
          const endsWithFn = interpreter.currentContext.functions.get('endsWith');
          return endsWithFn ? endsWithFn(str, searchString) : str.endsWith(searchString, length);
        };

      case 'repeat':
        return (count: number) => {
          const repeatFn = interpreter.currentContext.functions.get('repeat');
          return repeatFn ? repeatFn(str, count) : str.repeat(count);
        };

      case 'padStart':
        return (targetLength: number, padString?: string) => {
          const padStartFn = interpreter.currentContext.functions.get('padStart');
          return padStartFn
            ? padStartFn(str, targetLength, padString)
            : str.padStart(targetLength, padString);
        };

      case 'padEnd':
        return (targetLength: number, padString?: string) => {
          const padEndFn = interpreter.currentContext.functions.get('padEnd');
          return padEndFn
            ? padEndFn(str, targetLength, padString)
            : str.padEnd(targetLength, padString);
        };

      case 'match':
        return (regexp: RegExp | string) => str.match(regexp);

      case 'search':
        return (regexp: RegExp | string) => str.search(regexp);

      case 'concat':
        return (...strings: string[]) => str.concat(...strings);

      case 'length':
        // For length property (not a method), return the value directly
        return undefined;

      default:
        return undefined;
    }
  }

  private getArrayMethod(arr: any[], methodName: string): Function | undefined {
    const interpreter = this;

    switch (methodName) {
      case 'filter':
        return async (predicate: (value: any, index: number, array: any[]) => unknown) => {
          const filterFn =
            interpreter.currentContext.functions.get('filter') ||
            interpreter.globalContext.functions.get('filter');
          return filterFn ? await filterFn(arr, predicate) : arr.filter(predicate);
        };

      case 'map':
        return async (mapper: (value: any, index: number, array: any[]) => unknown) => {
          const mapFn =
            interpreter.currentContext.functions.get('map') ||
            interpreter.globalContext.functions.get('map');
          return mapFn ? await mapFn(arr, mapper) : arr.map(mapper);
        };

      case 'reduce':
        return async (
          reducer: (
            previousValue: any,
            currentValue: any,
            currentIndex: number,
            array: any[],
          ) => any,
          initial?: any,
        ) => {
          const reduceFn =
            interpreter.currentContext.functions.get('reduce') ||
            interpreter.globalContext.functions.get('reduce');
          return reduceFn ? await reduceFn(arr, reducer, initial) : arr.reduce(reducer, initial);
        };

      case 'find':
        return async (predicate: (value: any, index: number, obj: any[]) => unknown) => {
          const findFn =
            interpreter.currentContext.functions.get('find') ||
            interpreter.globalContext.functions.get('find');
          return findFn ? await findFn(arr, predicate) : arr.find(predicate);
        };

      case 'findIndex':
        return (predicate: (value: any, index: number, obj: any[]) => unknown) =>
          arr.findIndex(predicate);

      case 'some':
        return async (predicate: (value: any, index: number, array: any[]) => unknown) => {
          const someFn =
            interpreter.currentContext.functions.get('some') ||
            interpreter.globalContext.functions.get('some');
          return someFn ? await someFn(arr, predicate) : arr.some(predicate);
        };

      case 'every':
        return async (predicate: (value: any, index: number, array: any[]) => unknown) => {
          const everyFn =
            interpreter.currentContext.functions.get('every') ||
            interpreter.globalContext.functions.get('every');
          return everyFn ? await everyFn(arr, predicate) : arr.every(predicate);
        };

      case 'forEach':
        return async (fn: (value: any, index: number, array: any[]) => void) => {
          // Execute the callback for each element
          if (typeof fn === 'function') {
            for (let i = 0; i < arr.length; i++) {
              // Call directly with values to avoid closure issues
              await fn(arr[i], i, arr);
            }
          }
          return undefined; // forEach returns undefined
        };

      case 'sort':
        return (compareFn?: (a: any, b: any) => number) => {
          const sortFn =
            interpreter.currentContext.functions.get('sort') ||
            interpreter.globalContext.functions.get('sort');
          // Sort mutates the array and returns it (JavaScript behavior)
          return sortFn ? sortFn(arr, compareFn) : arr.sort(compareFn);
        };

      case 'reverse':
        return () => {
          const reverseFn =
            interpreter.currentContext.functions.get('reverse') ||
            interpreter.globalContext.functions.get('reverse');
          // Reverse mutates the array and returns it (JavaScript behavior)
          return reverseFn ? reverseFn(arr) : arr.reverse();
        };

      case 'slice':
        return (start?: number, end?: number) => {
          const sliceFn = interpreter.currentContext.functions.get('slice');
          return sliceFn ? sliceFn(arr, start, end) : arr.slice(start, end);
        };

      case 'splice':
        return (start: number, deleteCount?: number, ...items: any[]) => {
          // Splice mutates the array and returns removed elements (JavaScript behavior)
          return arr.splice(start, deleteCount ?? arr.length - start, ...items);
        };

      case 'concat':
        return (...arrays: any[]) => {
          const concatFn = interpreter.currentContext.functions.get('concat');
          return concatFn ? concatFn(arr, ...arrays) : arr.concat(...arrays);
        };

      case 'join':
        return (separator?: string) => {
          const joinFn = interpreter.currentContext.functions.get('join');
          return joinFn ? joinFn(arr, separator) : arr.join(separator);
        };

      case 'includes':
        return (item: any, fromIndex?: number) => {
          const includesFn = interpreter.currentContext.functions.get('includes');
          return includesFn ? includesFn(arr, item) : arr.includes(item, fromIndex);
        };

      case 'indexOf':
        return (item: any, fromIndex?: number) => {
          const indexOfFn = interpreter.currentContext.functions.get('indexOf');
          return indexOfFn ? indexOfFn(arr, item) : arr.indexOf(item, fromIndex);
        };

      case 'lastIndexOf':
        return (item: any, fromIndex?: number) => {
          // There's a bizarre issue where native lastIndexOf isn't working
          // Implement it manually as a workaround
          const len = arr.length;
          const start =
            fromIndex !== undefined
              ? fromIndex < 0
                ? Math.max(0, len + fromIndex)
                : Math.min(fromIndex, len - 1)
              : len - 1;

          for (let i = start; i >= 0; i--) {
            if (arr[i] === item) {
              return i;
            }
          }
          return -1;
        };

      case 'push':
        return (...items: any[]) => {
          const pushFn = interpreter.currentContext.functions.get('push');
          if (pushFn) {
            return pushFn(arr, ...items);
          }
          // Push mutates the array and returns the new length (JavaScript behavior)
          arr.push(...items);
          return arr.length;
        };

      case 'pop':
        return () => {
          const popFn = interpreter.currentContext.functions.get('pop');
          if (popFn) {
            return popFn(arr);
          }
          // Pop mutates the array and returns the removed element (JavaScript behavior)
          return arr.pop();
        };

      case 'shift':
        return () => {
          const shiftFn = interpreter.currentContext.functions.get('shift');
          if (shiftFn) {
            return shiftFn(arr);
          }
          // Shift mutates the array and returns the removed element (JavaScript behavior)
          return arr.shift();
        };

      case 'unshift':
        return (...items: any[]) => {
          const unshiftFn = interpreter.currentContext.functions.get('unshift');
          if (unshiftFn) {
            return unshiftFn(arr, ...items);
          }
          // Unshift mutates the array and returns the new length (JavaScript behavior)
          return arr.unshift(...items);
        };

      case 'flat':
        return (depth?: number) => arr.flat(depth);

      case 'flatMap':
        return (mapper: (value: any, index: number, array: any[]) => any) => arr.flatMap(mapper);

      case 'length':
        // For length property (not a method), return undefined to use regular property access
        return undefined;

      default:
        return undefined;
    }
  }

  private async evaluateNewExpression(node: any): Promise<any> {
    const constructor = await this.evaluateNode(node.callee);

    if (typeof constructor !== 'function') {
      const error = new TypeMismatchError('constructor', constructor, 'new expression');
      this.enhanceErrorWithContext(error, node);
      throw error;
    }

    const args = [];
    for (const arg of node.arguments) {
      args.push(await this.evaluateNode(arg));
    }

    // Handle built-in constructors specially
    if (
      constructor === Date ||
      constructor === Error ||
      constructor === Array ||
      constructor === Object ||
      constructor === RegExp ||
      constructor === Map ||
      constructor === Set ||
      constructor === Promise
    ) {
      // Call with new for native constructors
      return new (constructor as any)(...args);
    }

    // Call the constructor function directly (it handles instance creation)
    // Since our class constructor returns a promise, we need to await it
    const instance = await constructor(...args);
    return instance;
  }

  private async evaluateArrayExpression(node: any): Promise<any[]> {
    const result = [];
    for (const element of node.elements) {
      if (element) {
        if (element.type === 'SpreadElement') {
          const spread = await this.evaluateNode(element.argument);
          if (typeof spread[Symbol.iterator] !== 'function' && !Array.isArray(spread)) {
            throw new Error(
              'Parse error: Spread syntax requires ...iterable[Symbol.iterator] to be a function',
            );
          }
          result.push(...spread);
        } else {
          result.push(await this.evaluateNode(element));
        }
      } else {
        result.push(undefined);
      }
    }
    return result;
  }

  private async evaluateObjectExpression(node: any): Promise<any> {
    const result: any = {};

    for (const prop of node.properties) {
      if (prop.type === 'SpreadElement') {
        const spread = await this.evaluateNode(prop.argument);
        Object.assign(result, spread);
      } else if (prop.type === 'Property') {
        const key = prop.computed
          ? await this.evaluateNode(prop.key)
          : prop.key.name || prop.key.value || prop.key;

        if (prop.shorthand) {
          result[key] = this.evaluateIdentifier({ name: key });
        } else {
          result[key] = await this.evaluateNode(prop.value);
        }
      }
    }

    return result;
  }

  private async evaluateTemplateLiteral(node: any): Promise<string> {
    // Get the raw template string
    const raw = node.raw || node.value || '';

    // If it contains ${...} expressions, interpolate them
    if (raw.includes('${')) {
      return await this.interpolateTemplate(raw);
    }

    // Otherwise return as-is
    return raw;
  }

  private async interpolateTemplate(template: string): Promise<string> {
    // Match ${...} expressions using regex just for finding positions
    // But not escaped ones (which would now be just $ after escape processing)
    const expressionRegex = /\$\{([^}]+)\}/g;
    let result = template;
    let match;

    const replacements: Array<{ start: number; end: number; value: string }> = [];

    while ((match = expressionRegex.exec(template)) !== null) {
      const expression = match[1];
      try {
        // Parse the expression using the Wang parser itself - CSP-safe!
        // Use statically imported grammar and nearley
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

        // Parse the expression as a complete Wang expression
        const parseResult = parser.feed(expression).results;

        if (parseResult && parseResult.length > 0) {
          // Evaluate the parsed AST
          const ast = parseResult[0];
          const value = await this.evaluateNode(ast);
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            value: String(value),
          });
        } else {
          // If parsing fails, try as simple identifier
          const value = this.currentContext.variables.get(expression.trim());
          if (value !== undefined) {
            replacements.push({
              start: match.index,
              end: match.index + match[0].length,
              value: String(value),
            });
          }
        }
      } catch (error) {
        // If evaluation fails, leave as is
        console.warn(`Failed to evaluate template expression: ${expression}`, error);
      }
    }

    // Apply replacements in reverse order to maintain indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      result = result.slice(0, r.start) + r.value + result.slice(r.end);
    }

    return result;
  }

  private async evaluateTemplateExpression(expression: string): Promise<any> {
    // Parse and evaluate using the Wang parser - this is now CSP-safe
    try {
      // Use statically imported grammar and nearley
      const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
      const parseResult = parser.feed(expression).results;

      if (parseResult && parseResult.length > 0) {
        return await this.evaluateNode(parseResult[0]);
      }
    } catch (error) {
      // Fallback to simple identifier lookup
      const trimmed = expression.trim();
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
        return this.evaluateIdentifier({ name: trimmed });
      }
    }

    return expression; // Return the original if we can't parse it
  }

  private async evaluateImport(node: any): Promise<any> {
    // node.source is a Literal node, we need its value
    const modulePath = node.source.value || node.source;
    const module = await this.importModule(modulePath);

    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        const localName = specifier.local.name || specifier.local;
        this.currentContext.variables.set(localName, module);
      } else if (specifier.type === 'ImportSpecifier') {
        const importedName = specifier.imported.name || specifier.imported;
        const localName = specifier.local.name || specifier.local;
        const value = module[importedName];
        this.currentContext.variables.set(localName, value);
      }
    }
  }

  private async evaluateExport(node: any): Promise<any> {
    if (node.declaration) {
      await this.evaluateNode(node.declaration);

      // Export the declared items
      if (node.declaration.type === 'VariableDeclaration') {
        for (const declarator of node.declaration.declarations) {
          if (declarator.id.type === 'Identifier') {
            const value = this.currentContext.variables.get(declarator.id.name);
            this.currentContext.exports.set(declarator.id.name, value);
            // Update module exports object immediately for circular dependencies
            if (this.currentContext.moduleExports) {
              this.currentContext.moduleExports[declarator.id.name] = value;
            }
          }
        }
      } else if (node.declaration.type === 'FunctionDeclaration') {
        const fn = this.currentContext.functions.get(node.declaration.id.name);
        this.currentContext.exports.set(node.declaration.id.name, fn);
        // Update module exports object immediately for circular dependencies
        if (this.currentContext.moduleExports) {
          this.currentContext.moduleExports[node.declaration.id.name] = fn;
        }
      } else if (node.declaration.type === 'ClassDeclaration') {
        const cls = this.currentContext.classes.get(node.declaration.id.name);
        this.currentContext.exports.set(node.declaration.id.name, cls);
        // Update module exports object immediately for circular dependencies
        if (this.currentContext.moduleExports) {
          this.currentContext.moduleExports[node.declaration.id.name] = cls;
        }
      }
    }

    // Handle named exports
    for (const specifier of node.specifiers || []) {
      const value =
        this.currentContext.variables.get(specifier.local) ||
        this.currentContext.functions.get(specifier.local) ||
        this.currentContext.classes.get(specifier.local);
      this.currentContext.exports.set(specifier.exported, value);
      // Update module exports object immediately for circular dependencies
      if (this.currentContext.moduleExports) {
        this.currentContext.moduleExports[specifier.exported] = value;
      }
    }
  }

  private async importModule(modulePath: string): Promise<any> {
    // Check global cache
    if (this.globalModuleCache.has(modulePath)) {
      return this.globalModuleCache.get(modulePath);
    }

    // Create placeholder to prevent infinite recursion in circular imports
    const exports: any = {};
    this.globalModuleCache.set(modulePath, exports);

    // Resolve and load module
    const { code } = await this.moduleResolver.resolve(modulePath);

    // Save current module path and set new one
    const previousModulePath = this.currentModulePath;
    this.currentModulePath = modulePath;

    // Create new context for module
    const moduleContext = this.createContext(this.globalContext);
    moduleContext.modulePath = modulePath;

    // Store reference to exports object so we can update it during evaluation
    moduleContext.moduleExports = exports;

    try {
      // Execute module (use default behavior - no metadata)
      await this.execute(code, moduleContext);

      // Get exports and copy to the cached object
      moduleContext.exports.forEach((value, key) => {
        exports[key] = value;
      });
    } finally {
      // Restore previous module path
      this.currentModulePath = previousModulePath;
    }

    return exports;
  }
}

// Export for use
export default WangInterpreter;
