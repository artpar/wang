/**
 * Base interface for module resolvers
 * Implement this interface to provide custom module resolution
 */
export class ModuleResolver {
}
/**
 * Helper to normalize module paths
 */
export function normalizePath(path) {
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
export function resolveRelativePath(modulePath, fromPath) {
    if (!fromPath || !modulePath.startsWith('.')) {
        return modulePath;
    }
    const basePath = fromPath.split('/').slice(0, -1).join('/');
    return normalizePath(basePath + '/' + modulePath);
}
/**
 * Helper to add file extension if missing
 */
export function addExtension(path, extension = '.wang') {
    if (path.endsWith(extension) || path.includes('.')) {
        return path;
    }
    return path + extension;
}
//# sourceMappingURL=base.js.map