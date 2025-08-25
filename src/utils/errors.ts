export interface ErrorContext {
  type: "LexError" | "ParseError" | "RuntimeError" | "ModuleError";
  line?: number;
  column?: number;
  length?: number;
  token?: string;
  expected?: string[];
  stackTrace?: string[];
  suggestions?: string[];
  variables?: Record<string, any>;
}

export class WangError extends Error {
  public context: ErrorContext;
  public originalError?: Error;

  constructor(message: string, context: ErrorContext = { type: "RuntimeError" }, originalError?: Error) {
    super(message);
    this.name = "WangError";
    this.context = context;
    this.originalError = originalError;
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WangError);
    }
  }

  toString(): string {
    return this.message;
  }

  /**
   * Get a formatted error message with suggestions
   */
  getFormattedMessage(sourceCode?: string): string {
    let formatted = this.message;
    
    if (this.context.suggestions && this.context.suggestions.length > 0) {
      formatted += "\n\n💡 Suggestions:\n";
      this.context.suggestions.forEach((suggestion, i) => {
        formatted += `   ${i + 1}. ${suggestion}\n`;
      });
    }
    
    if (this.context.variables && Object.keys(this.context.variables).length > 0) {
      formatted += "\n\n📊 Variables in scope:\n";
      Object.entries(this.context.variables).forEach(([name, value]) => {
        const valueStr = this.formatValue(value);
        formatted += `   • ${name}: ${valueStr}\n`;
      });
    }
    
    if (this.context.stackTrace && this.context.stackTrace.length > 0) {
      formatted += "\n\n📍 Stack trace:\n";
      this.context.stackTrace.forEach(frame => {
        formatted += `   ${frame}\n`;
      });
    }
    
    return formatted;
  }

  private formatValue(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return `[array of ${value.length} items]`;
    if (typeof value === "object") return `{${Object.keys(value).join(", ")}}`;
    return typeof value;
  }
}

export class ModuleNotFoundError extends WangError {
  constructor(modulePath: string, availableModules: string[] = []) {
    const suggestions: string[] = [];
    
    // Try to find similar module names
    if (availableModules.length > 0) {
      const similar = availableModules
        .filter(m => m.includes(modulePath.split("/").pop() || ""))
        .slice(0, 3);
      
      if (similar.length > 0) {
        suggestions.push(`Did you mean one of these? ${similar.join(", ")}`);
      }
    }
    
    // Add general suggestions
    suggestions.push("Check that the module path is correct");
    suggestions.push("Ensure the module has been added to the resolver");
    
    super(
      `Module not found: "${modulePath}"`,
      {
        type: "ModuleError",
        suggestions
      }
    );
  }
}

export class CircularDependencyError extends WangError {
  constructor(cycle: string[]) {
    const cycleStr = cycle.join(" → ");
    
    super(
      `Circular dependency detected:\n   ${cycleStr} → ${cycle[0]}`,
      {
        type: "ModuleError",
        suggestions: [
          "Move shared code to a separate module",
          "Use dynamic imports for one direction",
          "Refactor to remove the circular dependency"
        ]
      }
    );
  }
}

export class TypeMismatchError extends WangError {
  constructor(expected: string, received: any, context: string) {
    const receivedType = typeof received;
    let receivedValue = 'undefined';
    try {
      receivedValue = received === undefined ? 'undefined' : 
                      received === null ? 'null' :
                      JSON.stringify(received).substring(0, 50);
    } catch (e) {
      receivedValue = String(received).substring(0, 50);
    }
    
    super(
      `Type mismatch in ${context}:\n   Expected: ${expected}\n   Received: ${receivedType} (${receivedValue})`,
      {
        type: "RuntimeError",
        suggestions: [
          `Check that the value is of type ${expected}`,
          "Use type conversion if necessary",
          "Verify the data source"
        ]
      }
    );
  }
}

export class UndefinedVariableError extends WangError {
  constructor(varName: string, availableVars: string[]) {
    const suggestions: string[] = [];
    
    // Find similar variable names
    const similar = availableVars
      .filter(v => v.includes(varName) || varName.includes(v))
      .slice(0, 3);
    
    if (similar.length > 0) {
      suggestions.push(`Did you mean: ${similar.join(", ")}?`);
    }
    
    suggestions.push("Check for typos in the variable name");
    suggestions.push("Ensure the variable is declared before use");
    
    super(
      `Variable "${varName}" is not defined`,
      {
        type: "RuntimeError",
        suggestions,
        variables: Object.fromEntries(availableVars.slice(0, 10).map(v => [v, "..."]))
      }
    );
  }
}

export class FunctionNotFoundError extends WangError {
  constructor(funcName: string, availableFuncs: string[]) {
    const suggestions: string[] = [];
    
    // Find similar function names
    const similar = availableFuncs
      .filter(f => f.includes(funcName) || funcName.includes(f))
      .slice(0, 5);
    
    if (similar.length > 0) {
      suggestions.push(`Available similar functions: ${similar.join(", ")}`);
    }
    
    suggestions.push("Check the function name spelling");
    suggestions.push("Ensure the function is imported or defined");
    suggestions.push(`Available functions: ${availableFuncs.slice(0, 10).join(", ")}...`);
    
    super(
      `Function "${funcName}" is not defined`,
      {
        type: "RuntimeError",
        suggestions
      }
    );
  }
}