/**
 * Wang Interpreter - CSP-safe interpreter for the Wang language
 * Works with Nearley-generated AST
 */

import { ModuleResolver } from '../resolvers/base';
import { InMemoryModuleResolver } from '../resolvers/memory';
import { 
  WangError, 
  UndefinedVariableError, 
  FunctionNotFoundError,
  TypeMismatchError,
  ModuleNotFoundError
} from '../utils/errors';

// Import the generated parser (will be generated at build time)
// @ts-ignore - Generated file
import grammar from '../generated/wang-grammar.js';
import nearley from 'nearley';

export interface ExecutionContext {
  variables: Map<string, any>;
  functions: Map<string, Function>;
  classes: Map<string, any>;
  exports: Map<string, any>;
  parent?: ExecutionContext;
  moduleCache: Map<string, any>;
}

export interface InterpreterOptions {
  moduleResolver?: ModuleResolver;
  functions?: Record<string, Function>;
  globalContext?: ExecutionContext;
}

export class WangInterpreter {
  private moduleResolver: ModuleResolver;
  private globalContext: ExecutionContext;
  private currentContext: ExecutionContext;
  private lastPipelineValue: any = undefined;

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

  private createContext(parent?: ExecutionContext): ExecutionContext {
    return {
      variables: new Map(),
      functions: new Map(),
      classes: new Map(),
      exports: new Map(),
      parent,
      moduleCache: new Map()
    };
  }

  private bindBuiltins() {
    // Console functions
    this.bindFunction('log', (...args: any[]) => console.log(...args));
    this.bindFunction('error', (...args: any[]) => console.error(...args));
    this.bindFunction('warn', (...args: any[]) => console.warn(...args));
    
    // Array functions - handle async callbacks
    this.bindFunction('filter', async (arr: any[], predicate: (value: any, index: number, array: any[]) => unknown) => {
      const results = [];
      for (let i = 0; i < arr.length; i++) {
        if (await predicate(arr[i], i, arr)) {
          results.push(arr[i]);
        }
      }
      return results;
    });
    this.bindFunction('map', async (arr: any[], mapper: (value: any, index: number, array: any[]) => unknown) => {
      const results = [];
      for (let i = 0; i < arr.length; i++) {
        results.push(await mapper(arr[i], i, arr));
      }
      return results;
    });
    this.bindFunction('reduce', async (arr: any[], reducer: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initial?: any) => {
      let accumulator = initial !== undefined ? initial : arr[0];
      const startIndex = initial !== undefined ? 0 : 1;
      for (let i = startIndex; i < arr.length; i++) {
        accumulator = await reducer(accumulator, arr[i], i, arr);
      }
      return accumulator;
    });
    this.bindFunction('forEach', async (arr: any[], fn: (value: any, index: number, array: any[]) => void) => {
      for (let i = 0; i < arr.length; i++) {
        await fn(arr[i], i, arr);
      }
    });
    this.bindFunction('find', async (arr: any[], predicate: (value: any, index: number, obj: any[]) => unknown) => {
      for (let i = 0; i < arr.length; i++) {
        if (await predicate(arr[i], i, arr)) {
          return arr[i];
        }
      }
      return undefined;
    });
    this.bindFunction('some', async (arr: any[], predicate: (value: any, index: number, array: any[]) => unknown) => {
      for (let i = 0; i < arr.length; i++) {
        if (await predicate(arr[i], i, arr)) {
          return true;
        }
      }
      return false;
    });
    this.bindFunction('every', async (arr: any[], predicate: (value: any, index: number, array: any[]) => unknown) => {
      for (let i = 0; i < arr.length; i++) {
        if (!(await predicate(arr[i], i, arr))) {
          return false;
        }
      }
      return true;
    });
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
    this.bindFunction('reverse', (arr: any[]) => [...arr].reverse());
    this.bindFunction('slice', (arr: any[], start?: number, end?: number) => arr.slice(start, end));
    this.bindFunction('concat', (...arrays: any[]) => [].concat(...arrays));
    this.bindFunction('join', (arr: any[], separator?: string) => arr.join(separator));
    this.bindFunction('includes', (arr: any[], item: any) => arr.includes(item));
    this.bindFunction('indexOf', (arr: any[], item: any) => arr.indexOf(item));
    this.bindFunction('push', (arr: any[], ...items: any[]) => { arr.push(...items); return arr; });
    this.bindFunction('pop', (arr: any[]) => arr.pop());
    this.bindFunction('shift', (arr: any[]) => arr.shift());
    this.bindFunction('unshift', (arr: any[], ...items: any[]) => { arr.unshift(...items); return arr; });
    
    // Object functions
    this.bindFunction('keys', (obj: any) => Object.keys(obj));
    this.bindFunction('values', (obj: any) => Object.values(obj));
    this.bindFunction('entries', (obj: any) => Object.entries(obj));
    this.bindFunction('assign', Object.assign);
    this.bindFunction('freeze', Object.freeze);
    this.bindFunction('seal', Object.seal);
    
    // String functions
    this.bindFunction('toUpperCase', (str: string) => str.toUpperCase());
    this.bindFunction('toLowerCase', (str: string) => str.toLowerCase());
    this.bindFunction('trim', (str: string) => str.trim());
    this.bindFunction('split', (str: string, separator?: string | RegExp) => separator !== undefined ? str.split(separator) : str.split(''));
    this.bindFunction('replace', (str: string, search: string | RegExp, replacement: string) => str.replace(search, replacement));
    this.bindFunction('substring', (str: string, start: number, end?: number) => str.substring(start, end));
    this.bindFunction('charAt', (str: string, index: number) => str.charAt(index));
    this.bindFunction('charCodeAt', (str: string, index: number) => str.charCodeAt(index));
    this.bindFunction('startsWith', (str: string, search: string) => str.startsWith(search));
    this.bindFunction('endsWith', (str: string, search: string) => str.endsWith(search));
    this.bindFunction('repeat', (str: string, count: number) => str.repeat(count));
    this.bindFunction('padStart', (str: string, length: number, fill?: string) => str.padStart(length, fill));
    this.bindFunction('padEnd', (str: string, length: number, fill?: string) => str.padEnd(length, fill));
    
    // Math functions
    this.bindFunction('abs', Math.abs);
    this.bindFunction('ceil', Math.ceil);
    this.bindFunction('floor', Math.floor);
    this.bindFunction('round', Math.round);
    this.bindFunction('min', Math.min);
    this.bindFunction('max', Math.max);
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
    this.bindFunction('wait', (ms: number) => new Promise(resolve => setTimeout(resolve, ms)));
    this.bindFunction('Promise', Promise);
  }

  bindFunction(name: string, fn: Function) {
    this.globalContext.functions.set(name, fn);
  }

  async execute(code: string, context?: ExecutionContext): Promise<any> {
    // Create parser
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
        return result;
      } finally {
        this.currentContext = previousContext;
      }
      
    } catch (error) {
      if (error instanceof WangError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new WangError(
        `Parse error: ${errorMessage}`,
        { type: 'ParseError' },
        error instanceof Error ? error : undefined
      );
    }
  }

  private async evaluateNode(node: any): Promise<any> {
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
      
      case 'ReturnStatement':
        throw { type: 'return', value: node.argument ? await this.evaluateNode(node.argument) : undefined };
      
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
      
      case 'PipelineExpression':
        return this.evaluatePipelineExpression(node);
      
      case 'ThisExpression':
        return this.currentContext.variables.get('this');
      
      case 'SpreadElement':
        const arr = await this.evaluateNode(node.argument);
        if (!Array.isArray(arr)) {
          throw new TypeMismatchError('array', arr, 'spread operator');
        }
        return arr;
      
      default:
        throw new WangError(`Unknown node type: ${node.type}`, { type: 'RuntimeError' });
    }
  }

  private async evaluateProgram(node: any): Promise<any> {
    let lastValue;
    for (const statement of node.body) {
      lastValue = await this.evaluateNode(statement);
    }
    return lastValue;
  }

  private async evaluateVariableDeclaration(node: any): Promise<void> {
    for (const declarator of node.declarations) {
      const value = declarator.init ? await this.evaluateNode(declarator.init) : undefined;
      this.assignPattern(declarator.id, value);
    }
  }

  private assignPattern(pattern: any, value: any): void {
    if (pattern.type === 'Identifier') {
      this.currentContext.variables.set(pattern.name, value);
    } else if (pattern.type === 'ObjectPattern') {
      for (const prop of pattern.properties) {
        if (prop.type === 'Property') {
          // Handle shorthand properties
          if (prop.shorthand && typeof prop.value === 'string') {
            this.currentContext.variables.set(prop.value, value?.[prop.key]);
          } else {
            // Handle regular properties with nested patterns
            const bindingPattern = typeof prop.value === 'string' 
              ? { type: 'Identifier', name: prop.value }
              : prop.value;
            this.assignPattern(bindingPattern, value?.[prop.key]);
          }
        } else if (prop.type === 'RestElement') {
          const rest = { ...value };
          for (const p of pattern.properties) {
            if (p.type === 'Property') delete rest[p.key];
          }
          this.currentContext.variables.set(prop.argument, rest);
        }
      }
    } else if (pattern.type === 'ArrayPattern') {
      const arr = Array.isArray(value) ? value : [];
      let index = 0;
      for (const element of pattern.elements) {
        if (element) {
          if (element.type === 'RestElement') {
            this.currentContext.variables.set(element.argument.name || element.argument, arr.slice(index));
          } else {
            this.assignPattern(element, arr[index]);
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
    const capturedContext = this.currentContext;
    
    const fn = async (...args: any[]) => {
      // Create new context for function with captured parent context
      const fnContext = this.createContext(capturedContext);
      
      // Execute function body
      const previousContext = this.currentContext;
      this.currentContext = fnContext;
      
      // Bind parameters in the new context
      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        if (param.type === 'RestElement') {
          fnContext.variables.set(param.argument.name || param.argument, args.slice(i));
          break;
        } else {
          this.assignPattern(param, args[i]);
        }
      }
      
      try {
        if (body.type === 'BlockStatement') {
          await this.evaluateBlock(body);
          return undefined;
        } else {
          // Arrow function with expression body
          return await this.evaluateNode(body);
        }
      } catch (e: any) {
        if (e?.type === 'return') {
          return e.value;
        }
        throw e;
      } finally {
        this.currentContext = previousContext;
      }
    };
    
    return isAsync ? fn : (...args: any[]) => {
      const result = fn(...args);
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
    const classConstructor = function(this: any, ...args: any[]) {
      // Return a promise that creates and initializes the instance
      return (async () => {
        // Create instance
        const instance = Object.create(classConstructor.prototype);
        
        // Execute constructor if exists
        if (constructorMethod) {
          // Create a new context for constructor execution
          const constructorContext = interpreter.createContext(interpreter.currentContext);
          constructorContext.variables.set('this', instance);
          
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
    
    // Add methods to prototype
    for (const method of node.body.body) {
      if (method.type === 'MethodDefinition' && method.kind !== 'constructor') {
        const methodName = method.key.name;
        classConstructor.prototype[methodName] = async function(this: any, ...args: any[]) {
          // Create context for method execution
          const methodContext = interpreter.createContext(interpreter.currentContext);
          methodContext.variables.set('this', this);
          
          // Bind method parameters
          for (let i = 0; i < method.params.length; i++) {
            const param = method.params[i];
            if (param.type === 'Identifier') {
              methodContext.variables.set(param.name, args[i]);
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
      }
    }
    
    // Set up inheritance if needed
    if (superClass) {
      classConstructor.prototype = Object.create(superClass.prototype);
      classConstructor.prototype.constructor = classConstructor;
    }
    
    // Store the class
    this.currentContext.classes.set(className, classConstructor);
    this.currentContext.variables.set(className, classConstructor);
  }

  private async evaluateBlock(node: any): Promise<any> {
    let lastValue;
    for (const statement of node.body) {
      lastValue = await this.evaluateNode(statement);
    }
    return lastValue;
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
      for (const item of iterable) {
        if (node.left.type === 'VariableDeclaration') {
          this.assignPattern(node.left.declarations[0].id, item);
        }
        await this.evaluateNode(node.body);
      }
    } else if (node.type === 'ForInStatement') {
      const obj = await this.evaluateNode(node.right);
      for (const key in obj) {
        if (node.left.type === 'VariableDeclaration') {
          this.assignPattern(node.left.declarations[0].id, key);
        }
        await this.evaluateNode(node.body);
      }
    } else {
      // Regular for loop
      if (node.init) await this.evaluateNode(node.init);
      while (node.test ? await this.evaluateNode(node.test) : true) {
        await this.evaluateNode(node.body);
        if (node.update) await this.evaluateNode(node.update);
      }
    }
  }

  private async evaluateWhileStatement(node: any): Promise<any> {
    while (await this.evaluateNode(node.test)) {
      await this.evaluateNode(node.body);
    }
  }

  private async evaluateTryStatement(node: any): Promise<any> {
    try {
      return await this.evaluateNode(node.block);
    } catch (error) {
      if (node.handler) {
        if (node.handler.param) {
          this.assignPattern(node.handler.param, error);
        }
        return await this.evaluateNode(node.handler.body);
      }
      throw error;
    } finally {
      if (node.finalizer) {
        await this.evaluateNode(node.finalizer);
      }
    }
  }

  private evaluateIdentifier(node: any): any {
    const name = node.name;
    
    // Special underscore handling for pipelines
    if (name === '_') {
      return this.lastPipelineValue;
    }
    
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
    
    throw new UndefinedVariableError(
      name,
      [...this.currentContext.variables.keys()]
    );
  }

  private async evaluateCallExpression(node: any): Promise<any> {
    // If the callee is a member expression, we need to preserve the object as 'this'
    let thisContext = null;
    let callee;
    
    if (node.callee.type === 'MemberExpression') {
      const object = await this.evaluateNode(node.callee.object);
      const property = node.callee.computed 
        ? await this.evaluateNode(node.callee.property)
        : node.callee.property.name;
      callee = object?.[property];
      thisContext = object; // Preserve the object as 'this'
    } else {
      callee = await this.evaluateNode(node.callee);
    }
    
    if (typeof callee !== 'function') {
      throw new TypeMismatchError('function', callee, 'call expression');
    }
    
    const args = [];
    for (const arg of node.arguments) {
      if (arg.type === 'SpreadElement') {
        const spread = await this.evaluateNode(arg.argument);
        args.push(...spread);
      } else {
        args.push(await this.evaluateNode(arg));
      }
    }
    
    // Replace underscore with pipeline value
    const processedArgs = args.map(arg => arg === undefined && this.lastPipelineValue !== undefined ? this.lastPipelineValue : arg);
    
    return callee.apply(thisContext, processedArgs);
  }

  private async evaluatePipelineExpression(node: any): Promise<any> {
    let result = await this.evaluateNode(node.left);
    this.lastPipelineValue = result;
    
    const right = await this.evaluateNode(node.right);
    
    // If right is a function call, the underscore will be replaced
    if (typeof right === 'function') {
      result = await right(result);
    } else {
      result = right;
    }
    
    this.lastPipelineValue = result;
    return result;
  }

  private async evaluateBinaryExpression(node: any): Promise<any> {
    const left = await this.evaluateNode(node.left);
    const right = await this.evaluateNode(node.right);
    
    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '**': return left ** right;
      case '==': return left == right;
      case '!=': return left != right;
      case '===': return left === right;
      case '!==': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '&&': return left && right;
      case '||': return left || right;
      case '??': return left ?? right;
      default:
        throw new WangError(`Unknown binary operator: ${node.operator}`, { type: 'RuntimeError' });
    }
  }

  private async evaluateUnaryExpression(node: any): Promise<any> {
    // Handle prefix increment/decrement specially
    if (node.operator === '++' || node.operator === '--') {
      if (node.argument.type !== 'Identifier') {
        throw new WangError('Prefix increment/decrement only supports identifiers', { type: 'RuntimeError' });
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
    
    const argument = await this.evaluateNode(node.argument);
    
    switch (node.operator) {
      case '!': return !argument;
      case '+': return +argument;
      case '-': return -argument;
      case 'typeof': return typeof argument;
      case 'await': return await argument;
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
          ctx = this.currentContext;
          while (ctx) {
            if (ctx.variables.has(name)) {
              ctx.variables.set(name, newValue);
              break;
            }
            ctx = ctx.parent;
          }
          if (!ctx) {
            this.currentContext.variables.set(name, newValue);
          }
          return newValue;
        case '-=':
          const oldVal = this.evaluateIdentifier(node.left) || 0;
          const newVal = oldVal - value;
          ctx = this.currentContext;
          while (ctx) {
            if (ctx.variables.has(name)) {
              ctx.variables.set(name, newVal);
              break;
            }
            ctx = ctx.parent;
          }
          if (!ctx) {
            this.currentContext.variables.set(name, newVal);
          }
          return newVal;
        default:
          throw new WangError(`Assignment operator ${node.operator} not implemented`, { type: 'RuntimeError' });
      }
    } else if (node.left.type === 'MemberExpression') {
      // Handle property assignment (e.g., obj.prop = value)
      const object = await this.evaluateNode(node.left.object);
      const property = node.left.computed 
        ? await this.evaluateNode(node.left.property)
        : node.left.property.name;
      
      if (object == null) {
        throw new WangError(`Cannot set property '${property}' on null or undefined`, { type: 'RuntimeError' });
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
        default:
          throw new WangError(`Assignment operator ${node.operator} not implemented for member expressions`, { type: 'RuntimeError' });
      }
    }
    
    throw new WangError('Complex assignment patterns not yet implemented', { type: 'RuntimeError' });
  }

  private async evaluateUpdateExpression(node: any): Promise<any> {
    if (node.argument.type !== 'Identifier') {
      throw new WangError('Update expression only supports identifiers', { type: 'RuntimeError' });
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
    
    return node.prefix ? newValue : oldValue;
  }

  private async evaluateConditionalExpression(node: any): Promise<any> {
    const test = await this.evaluateNode(node.test);
    return test 
      ? await this.evaluateNode(node.consequent)
      : await this.evaluateNode(node.alternate);
  }

  private async evaluateMemberExpression(node: any): Promise<any> {
    const object = await this.evaluateNode(node.object);
    
    if (node.optional && (object == null)) {
      return undefined;
    }
    
    const property = node.computed 
      ? await this.evaluateNode(node.property)
      : node.property.name;
    
    return object?.[property];
  }

  private async evaluateNewExpression(node: any): Promise<any> {
    const constructor = await this.evaluateNode(node.callee);
    
    if (typeof constructor !== 'function') {
      throw new TypeMismatchError('constructor', constructor, 'new expression');
    }
    
    const args = [];
    for (const arg of node.arguments) {
      args.push(await this.evaluateNode(arg));
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
    // For now, return the raw value
    // TODO: Implement template literal interpolation
    return node.value;
  }

  private async evaluateImport(node: any): Promise<any> {
    const modulePath = node.source;
    const module = await this.importModule(modulePath);
    
    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        this.currentContext.variables.set(specifier.local, module);
      } else if (specifier.type === 'ImportSpecifier') {
        const value = module[specifier.imported];
        this.currentContext.variables.set(specifier.local, value);
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
          }
        }
      } else if (node.declaration.type === 'FunctionDeclaration') {
        const fn = this.currentContext.functions.get(node.declaration.id.name);
        this.currentContext.exports.set(node.declaration.id.name, fn);
      } else if (node.declaration.type === 'ClassDeclaration') {
        const cls = this.currentContext.classes.get(node.declaration.id.name);
        this.currentContext.exports.set(node.declaration.id.name, cls);
      }
    }
    
    // Handle named exports
    for (const specifier of node.specifiers || []) {
      const value = this.currentContext.variables.get(specifier.local) ||
                   this.currentContext.functions.get(specifier.local) ||
                   this.currentContext.classes.get(specifier.local);
      this.currentContext.exports.set(specifier.exported, value);
    }
  }

  private async importModule(modulePath: string): Promise<any> {
    // Check cache
    if (this.currentContext.moduleCache.has(modulePath)) {
      return this.currentContext.moduleCache.get(modulePath);
    }
    
    // Resolve and load module
    const { code } = await this.moduleResolver.resolve(modulePath);
    
    // Create new context for module
    const moduleContext = this.createContext(this.globalContext);
    
    // Execute module
    await this.execute(code, moduleContext);
    
    // Get exports
    const exports: any = {};
    moduleContext.exports.forEach((value, key) => {
      exports[key] = value;
    });
    
    // Cache
    this.currentContext.moduleCache.set(modulePath, exports);
    
    return exports;
  }
}

// Export for use
export default WangInterpreter;