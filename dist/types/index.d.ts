/**
 * Wang Language - A CSP-safe workflow programming language
 * Uses Nearley to generate a standalone parser with no runtime dependencies
 * @packageDocumentation
 */
export { WangInterpreter } from './interpreter';
export type { ExecutionContext, InterpreterOptions } from './interpreter';
export { PausableWangInterpreter } from './interpreter/pausable-interpreter';
export type { ExecutionState, CallFrame, SerializedState, SerializedContext, PausableInterpreterOptions, } from './interpreter/pausable-interpreter';
export { ModuleResolver, type ModuleResolution } from './resolvers/base';
export { InMemoryModuleResolver } from './resolvers/memory';
export { WangError, ModuleNotFoundError, CircularDependencyError, TypeMismatchError, UndefinedVariableError, FunctionNotFoundError, type ErrorContext, } from './utils/errors';
export { WangValidator, validator, type ValidationResult, type ParserOptions, } from './parser/wang-validator';
import { WangInterpreter } from './interpreter';
import type { InterpreterOptions } from './interpreter';
export declare const VERSION = "0.1.0";
/**
 * Quick start helper to create an interpreter
 */
export declare function createInterpreter(options?: InterpreterOptions): WangInterpreter;
//# sourceMappingURL=index.d.ts.map