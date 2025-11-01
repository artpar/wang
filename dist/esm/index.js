/**
 * Wang Language - A CSP-safe workflow programming language
 * Uses Nearley to generate a standalone parser with no runtime dependencies
 * @packageDocumentation
 */
// Core exports
export { WangInterpreter } from './interpreter/index.js';
// Pausable interpreter exports
export { PausableWangInterpreter } from './interpreter/pausable-interpreter.js';
// Resolver exports
export { ModuleResolver } from './resolvers/base.js';
export { InMemoryModuleResolver } from './resolvers/memory.js';
// Error exports
export { WangError, ModuleNotFoundError, CircularDependencyError, TypeMismatchError, UndefinedVariableError, FunctionNotFoundError, } from './utils/errors.js';
// Validator exports
export { WangValidator, validator, } from './parser/wang-validator.js';
// Import for createInterpreter
import { WangInterpreter } from './interpreter/index.js';
// Version - will be replaced during build with actual package.json version
export const VERSION = '0.24.0';
/**
 * Quick start helper to create an interpreter
 */
export function createInterpreter(options) {
    return new WangInterpreter(options);
}
//# sourceMappingURL=index.js.map