/**
 * Wang Language - A CSP-safe workflow programming language
 * Uses Nearley to generate a standalone parser with no runtime dependencies
 * @packageDocumentation
 */

// Core exports
export { WangInterpreter } from './interpreter';
export type { ExecutionContext, InterpreterOptions } from './interpreter';

// Pausable interpreter exports
export { PausableWangInterpreter } from './interpreter/pausable-interpreter';
export type {
  ExecutionState,
  CallFrame,
  SerializedState,
  SerializedContext,
} from './interpreter/pausable-interpreter';

// Resolver exports
export { ModuleResolver, type ModuleResolution } from './resolvers/base';
export { InMemoryModuleResolver } from './resolvers/memory';

// Error exports
export {
  WangError,
  ModuleNotFoundError,
  CircularDependencyError,
  TypeMismatchError,
  UndefinedVariableError,
  FunctionNotFoundError,
  type ErrorContext,
} from './utils/errors';

// Validator exports
export {
  WangValidator,
  validator,
  type ValidationResult,
  type ParserOptions,
} from './parser/wang-validator';

// Import for createInterpreter
import { WangInterpreter } from './interpreter';
import type { InterpreterOptions } from './interpreter';

// Version
export const VERSION = '0.1.0';

/**
 * Quick start helper to create an interpreter
 */
export function createInterpreter(options?: InterpreterOptions) {
  return new WangInterpreter(options);
}
