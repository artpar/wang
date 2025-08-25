import { ModuleResolver, ModuleResolution, resolveRelativePath, addExtension } from "./base";
import { ModuleNotFoundError } from "../utils/errors";

/**
 * In-memory module resolver for testing and temporary modules
 */
export class InMemoryModuleResolver extends ModuleResolver {
  private modules: Map<string, string>;
  private metadata: Map<string, Record<string, any>>;

  constructor() {
    super();
    this.modules = new Map();
    this.metadata = new Map();
  }

  /**
   * Add a module to the resolver
   */
  addModule(path: string, code: string, metadata?: Record<string, any>): this {
    const normalizedPath = addExtension(path);
    this.modules.set(normalizedPath, code);
    
    if (metadata) {
      this.metadata.set(normalizedPath, metadata);
    }
    
    return this;
  }

  /**
   * Add multiple modules at once
   */
  addModules(modules: Record<string, string>): this {
    Object.entries(modules).forEach(([path, code]) => {
      this.addModule(path, code);
    });
    return this;
  }

  /**
   * Remove a module
   */
  removeModule(path: string): boolean {
    const normalizedPath = addExtension(path);
    this.metadata.delete(normalizedPath);
    return this.modules.delete(normalizedPath);
  }

  async resolve(modulePath: string, fromPath?: string): Promise<ModuleResolution> {
    // Resolve relative paths
    const resolvedPath = resolveRelativePath(modulePath, fromPath);
    const normalizedPath = addExtension(resolvedPath);
    
    // Try exact match first
    if (this.modules.has(normalizedPath)) {
      return {
        code: this.modules.get(normalizedPath)!,
        path: normalizedPath,
        metadata: this.metadata.get(normalizedPath)
      };
    }
    
    // Try without extension
    if (this.modules.has(resolvedPath)) {
      return {
        code: this.modules.get(resolvedPath)!,
        path: resolvedPath,
        metadata: this.metadata.get(resolvedPath)
      };
    }
    
    // Try index file
    const indexPath = addExtension(resolvedPath + "/index");
    if (this.modules.has(indexPath)) {
      return {
        code: this.modules.get(indexPath)!,
        path: indexPath,
        metadata: this.metadata.get(indexPath)
      };
    }
    
    // Module not found
    const availableModules = await this.list();
    throw new ModuleNotFoundError(modulePath, availableModules);
  }

  async exists(modulePath: string, fromPath?: string): Promise<boolean> {
    try {
      await this.resolve(modulePath, fromPath);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    const modules = Array.from(this.modules.keys());
    
    if (prefix) {
      return modules.filter(path => path.startsWith(prefix));
    }
    
    return modules;
  }

  clearCache(): void {
    // No cache in memory resolver, but we can clear all modules
    this.modules.clear();
    this.metadata.clear();
  }

  async getMetadata(modulePath: string): Promise<Record<string, any> | null> {
    const normalizedPath = addExtension(modulePath);
    return this.metadata.get(normalizedPath) || null;
  }

  /**
   * Get the number of modules
   */
  get size(): number {
    return this.modules.size;
  }

  /**
   * Check if resolver has any modules
   */
  get isEmpty(): boolean {
    return this.modules.size === 0;
  }

  /**
   * Export all modules (useful for serialization)
   */
  exportModules(): Record<string, { code: string; metadata?: Record<string, any> }> {
    const result: Record<string, { code: string; metadata?: Record<string, any> }> = {};
    
    this.modules.forEach((code, path) => {
      result[path] = {
        code,
        metadata: this.metadata.get(path)
      };
    });
    
    return result;
  }

  /**
   * Import modules (useful for deserialization)
   */
  importModules(modules: Record<string, { code: string; metadata?: Record<string, any> }>): this {
    Object.entries(modules).forEach(([path, { code, metadata }]) => {
      this.modules.set(path, code);
      if (metadata) {
        this.metadata.set(path, metadata);
      }
    });
    
    return this;
  }
}