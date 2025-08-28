import { ModuleResolver, ModuleResolution } from './base';
/**
 * In-memory module resolver for testing and temporary modules
 */
export declare class InMemoryModuleResolver extends ModuleResolver {
    private modules;
    private metadata;
    constructor();
    /**
     * Add a module to the resolver
     */
    addModule(path: string, code: string, metadata?: Record<string, any>): this;
    /**
     * Add multiple modules at once
     */
    addModules(modules: Record<string, string>): this;
    /**
     * Remove a module
     */
    removeModule(path: string): boolean;
    resolve(modulePath: string, fromPath?: string): Promise<ModuleResolution>;
    exists(modulePath: string, fromPath?: string): Promise<boolean>;
    list(prefix?: string): Promise<string[]>;
    clearCache(): void;
    getMetadata(modulePath: string): Promise<Record<string, any> | null>;
    /**
     * Get the number of modules
     */
    get size(): number;
    /**
     * Check if resolver has any modules
     */
    get isEmpty(): boolean;
    /**
     * Export all modules (useful for serialization)
     */
    exportModules(): Record<string, {
        code: string;
        metadata?: Record<string, any>;
    }>;
    /**
     * Import modules (useful for deserialization)
     */
    importModules(modules: Record<string, {
        code: string;
        metadata?: Record<string, any>;
    }>): this;
}
//# sourceMappingURL=memory.d.ts.map