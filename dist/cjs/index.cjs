"use strict";
/**
 * Wang Language - A CSP-safe workflow programming language
 * Uses Nearley to generate a standalone parser with no runtime dependencies
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.validator = exports.WangValidator = exports.FunctionNotFoundError = exports.UndefinedVariableError = exports.TypeMismatchError = exports.CircularDependencyError = exports.ModuleNotFoundError = exports.WangError = exports.InMemoryModuleResolver = exports.ModuleResolver = exports.PausableWangInterpreter = exports.WangInterpreter = void 0;
exports.createInterpreter = createInterpreter;
// Core exports
var interpreter_1 = require("./interpreter/index.cjs");
Object.defineProperty(exports, "WangInterpreter", { enumerable: true, get: function () { return interpreter_1.WangInterpreter; } });
// Pausable interpreter exports
var pausable_interpreter_1 = require("./interpreter/pausable-interpreter.cjs");
Object.defineProperty(exports, "PausableWangInterpreter", { enumerable: true, get: function () { return pausable_interpreter_1.PausableWangInterpreter; } });
// Resolver exports
var base_1 = require("./resolvers/base.cjs");
Object.defineProperty(exports, "ModuleResolver", { enumerable: true, get: function () { return base_1.ModuleResolver; } });
var memory_1 = require("./resolvers/memory.cjs");
Object.defineProperty(exports, "InMemoryModuleResolver", { enumerable: true, get: function () { return memory_1.InMemoryModuleResolver; } });
// Error exports
var errors_1 = require("./utils/errors.cjs");
Object.defineProperty(exports, "WangError", { enumerable: true, get: function () { return errors_1.WangError; } });
Object.defineProperty(exports, "ModuleNotFoundError", { enumerable: true, get: function () { return errors_1.ModuleNotFoundError; } });
Object.defineProperty(exports, "CircularDependencyError", { enumerable: true, get: function () { return errors_1.CircularDependencyError; } });
Object.defineProperty(exports, "TypeMismatchError", { enumerable: true, get: function () { return errors_1.TypeMismatchError; } });
Object.defineProperty(exports, "UndefinedVariableError", { enumerable: true, get: function () { return errors_1.UndefinedVariableError; } });
Object.defineProperty(exports, "FunctionNotFoundError", { enumerable: true, get: function () { return errors_1.FunctionNotFoundError; } });
// Validator exports
var wang_validator_1 = require("./parser/wang-validator.cjs");
Object.defineProperty(exports, "WangValidator", { enumerable: true, get: function () { return wang_validator_1.WangValidator; } });
Object.defineProperty(exports, "validator", { enumerable: true, get: function () { return wang_validator_1.validator; } });
// Import for createInterpreter
const interpreter_2 = require("./interpreter/index.cjs");
// Version - will be replaced during build with actual package.json version
exports.VERSION = '0.25.0';
/**
 * Quick start helper to create an interpreter
 */
function createInterpreter(options) {
    return new interpreter_2.WangInterpreter(options);
}
//# sourceMappingURL=index.js.map