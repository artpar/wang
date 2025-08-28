"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleResolver = void 0;
exports.normalizePath = normalizePath;
exports.resolveRelativePath = resolveRelativePath;
exports.addExtension = addExtension;
/**
 * Base interface for module resolvers
 * Implement this interface to provide custom module resolution
 */
class ModuleResolver {
}
exports.ModuleResolver = ModuleResolver;
/**
 * Helper to normalize module paths
 */
function normalizePath(path) {
    const parts = path.split('/');
    const normalized = [];
    for (const part of parts) {
        if (part === '..') {
            normalized.pop();
        }
        else if (part && part !== '.') {
            normalized.push(part);
        }
    }
    return normalized.join('/');
}
/**
 * Helper to resolve relative paths
 */
function resolveRelativePath(modulePath, fromPath) {
    if (!fromPath || !modulePath.startsWith('.')) {
        return modulePath;
    }
    const basePath = fromPath.split('/').slice(0, -1).join('/');
    return normalizePath(basePath + '/' + modulePath);
}
/**
 * Helper to add file extension if missing
 */
function addExtension(path, extension = '.wang') {
    if (path.endsWith(extension) || path.includes('.')) {
        return path;
    }
    return path + extension;
}
//# sourceMappingURL=base.js.map