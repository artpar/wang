"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryModuleResolver = void 0;
const base_1 = require("./base.cjs");
const errors_1 = require("../utils/errors.cjs");
/**
 * In-memory module resolver for testing and temporary modules
 */
class InMemoryModuleResolver extends base_1.ModuleResolver {
    constructor() {
        super();
        this.modules = new Map();
        this.metadata = new Map();
    }
    /**
     * Add a module to the resolver
     */
    addModule(path, code, metadata) {
        const normalizedPath = (0, base_1.addExtension)(path);
        this.modules.set(normalizedPath, code);
        if (metadata) {
            this.metadata.set(normalizedPath, metadata);
        }
        return this;
    }
    /**
     * Add multiple modules at once
     */
    addModules(modules) {
        Object.entries(modules).forEach(([path, code]) => {
            this.addModule(path, code);
        });
        return this;
    }
    /**
     * Remove a module
     */
    removeModule(path) {
        const normalizedPath = (0, base_1.addExtension)(path);
        this.metadata.delete(normalizedPath);
        return this.modules.delete(normalizedPath);
    }
    async resolve(modulePath, fromPath) {
        // Resolve relative paths
        const resolvedPath = (0, base_1.resolveRelativePath)(modulePath, fromPath);
        const normalizedPath = (0, base_1.addExtension)(resolvedPath);
        // Try exact match first
        if (this.modules.has(normalizedPath)) {
            return {
                code: this.modules.get(normalizedPath),
                path: normalizedPath,
                metadata: this.metadata.get(normalizedPath),
            };
        }
        // Try without extension
        if (this.modules.has(resolvedPath)) {
            return {
                code: this.modules.get(resolvedPath),
                path: resolvedPath,
                metadata: this.metadata.get(resolvedPath),
            };
        }
        // Try index file
        const indexPath = (0, base_1.addExtension)(resolvedPath + '/index');
        if (this.modules.has(indexPath)) {
            return {
                code: this.modules.get(indexPath),
                path: indexPath,
                metadata: this.metadata.get(indexPath),
            };
        }
        // Module not found
        const availableModules = await this.list();
        throw new errors_1.ModuleNotFoundError(modulePath, availableModules);
    }
    async exists(modulePath, fromPath) {
        try {
            await this.resolve(modulePath, fromPath);
            return true;
        }
        catch {
            return false;
        }
    }
    async list(prefix) {
        const modules = Array.from(this.modules.keys());
        if (prefix) {
            return modules.filter((path) => path.startsWith(prefix));
        }
        return modules;
    }
    clearCache() {
        // No cache in memory resolver, but we can clear all modules
        this.modules.clear();
        this.metadata.clear();
    }
    async getMetadata(modulePath) {
        const normalizedPath = (0, base_1.addExtension)(modulePath);
        return this.metadata.get(normalizedPath) || null;
    }
    /**
     * Get the number of modules
     */
    get size() {
        return this.modules.size;
    }
    /**
     * Check if resolver has any modules
     */
    get isEmpty() {
        return this.modules.size === 0;
    }
    /**
     * Export all modules (useful for serialization)
     */
    exportModules() {
        const result = {};
        this.modules.forEach((code, path) => {
            result[path] = {
                code,
                metadata: this.metadata.get(path),
            };
        });
        return result;
    }
    /**
     * Import modules (useful for deserialization)
     */
    importModules(modules) {
        Object.entries(modules).forEach(([path, { code, metadata }]) => {
            this.modules.set(path, code);
            if (metadata) {
                this.metadata.set(path, metadata);
            }
        });
        return this;
    }
}
exports.InMemoryModuleResolver = InMemoryModuleResolver;
//# sourceMappingURL=memory.js.map