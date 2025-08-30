/**
 * Module resolution result
 */
export interface ModuleResolution {
    code: string;
    path: string;
    metadata?: Record<string, any>;
}
/**
 * Base interface for module resolvers
 * Implement this interface to provide custom module resolution
 */
export declare abstract class ModuleResolver {
    /**
     * Resolve a module path to its source code
     * @param modulePath - The module path to resolve (e.g., "./utils", "@wang/core", "https://...")
     * @param fromPath - The path of the importing module (for relative resolution)
     * @returns Promise resolving to module code and resolved path
     */
    abstract resolve(modulePath: string, fromPath?: string): Promise<ModuleResolution>;
    /**
     * Check if a module exists
     * @param modulePath - The module path to check
     * @param fromPath - The path of the importing module (for relative resolution)
     * @returns Promise resolving to true if module exists
     */
    abstract exists(modulePath: string, fromPath?: string): Promise<boolean>;
    /**
     * List available modules (for autocomplete/suggestions)
     * @param prefix - Optional prefix to filter modules
     * @returns Promise resolving to array of available module paths
     */
    abstract list(prefix?: string): Promise<string[]>;
    /**
     * Clear any caches (optional)
     */
    clearCache?(): void;
    /**
     * Get module metadata (optional)
     * @param modulePath - The module path
     * @returns Promise resolving to module metadata
     */
    getMetadata?(modulePath: string): Promise<Record<string, any> | null>;
}
/**
 * Helper to normalize module paths
 */
export declare function normalizePath(path: string): string;
/**
 * Helper to resolve relative paths
 */
export declare function resolveRelativePath(modulePath: string, fromPath?: string): string;
/**
 * Helper to add file extension if missing
 */
export declare function addExtension(path: string, extension?: string): string;
//# sourceMappingURL=base.d.ts.map