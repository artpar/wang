#!/usr/bin/env node

/**
 * Wang Language Runtime CLI
 * Usage: wang-run <file.wang> [options]
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { WangInterpreter } from '../interpreter/index.js';
import { InMemoryModuleResolver } from '../resolvers/memory.js';

// Parse command line arguments
const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Wang Language Runtime

Usage: wang-run <file> [options]

Options:
  --verbose     Show detailed execution information
  --quiet       Only show output, suppress execution info
  --help        Show this help message

Examples:
  wang-run script.wang
  wang-run script.wang --verbose
  echo 'console.log("Hello Wang!")' | wang-run -
`);
}

async function main() {
  // Handle help flag
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const options = {
    verbose: args.includes('--verbose'),
    quiet: args.includes('--quiet'),
  };

  // Get the file path (first non-flag argument)
  const filePath = args.find((arg) => !arg.startsWith('--'));

  if (!filePath) {
    console.error('Error: No file specified');
    showHelp();
    process.exit(1);
  }

  try {
    // Read code from file or stdin
    let code: string;
    if (filePath === '-') {
      // Read from stdin
      code = await readStdin();
    } else {
      // Read from file
      const fullPath = resolve(process.cwd(), filePath);
      code = readFileSync(fullPath, 'utf-8');
    }

    if (options.verbose) {
      console.log(`🚀 Executing Wang code from: ${filePath === '-' ? 'stdin' : filePath}`);
      console.log('---');
    }

    // Create module resolver
    const moduleResolver = new InMemoryModuleResolver();

    // Create interpreter with built-in functions
    const interpreter = new WangInterpreter({
      moduleResolver,
      functions: {
        // Console functions
        log: (...args: any[]) => console.log(...args),
        print: (...args: any[]) => console.log(...args),
        error: (...args: any[]) => console.error(...args),
        warn: (...args: any[]) => console.warn(...args),
        info: (...args: any[]) => console.info(...args),
        
        // Array utilities for pipeline operations
        filter: (arr: any[], predicate: any) => {
          if (typeof predicate === 'function') {
            return arr.filter(predicate);
          }
          // Handle property-based filtering
          return arr.filter(item => item[predicate]);
        },
        
        map: (arr: any[], mapper: any) => {
          if (typeof mapper === 'function') {
            return arr.map(mapper);
          }
          // Handle property access
          return arr.map(item => item[mapper]);
        },
        
        // Basic utilities
        setTimeout: (fn: Function, ms: number) => setTimeout(fn, ms),
        setInterval: (fn: Function, ms: number) => setInterval(fn, ms),
        clearTimeout: (id: NodeJS.Timeout) => clearTimeout(id),
        clearInterval: (id: NodeJS.Timeout) => clearInterval(id),
      },
    });

    // Set global objects
    interpreter.setVariable('Math', Math);
    interpreter.setVariable('JSON', JSON);
    interpreter.setVariable('Date', Date);
    interpreter.setVariable('process', process);
    interpreter.setVariable('console', {
      log: (...args: any[]) => console.log(...args),
      error: (...args: any[]) => console.error(...args),
      warn: (...args: any[]) => console.warn(...args),
      info: (...args: any[]) => console.info(...args),
    });

    // Execute the code
    const result = await interpreter.execute(code);

    if (options.verbose) {
      console.log('---');
      if (result !== undefined) {
        console.log(`✅ Execution completed. Result:`, result);
      } else {
        console.log('✅ Execution completed successfully');
      }
    }

    process.exit(0);
  } catch (error: any) {
    if (!options.quiet) {
      console.error('❌ Execution failed');
      console.error(`Error: ${error.message}`);
      
      if (error.line && error.column) {
        console.error(`At line ${error.line}, column ${error.column}`);
      }
      
      if (error.stack && options.verbose) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }
    
    process.exit(1);
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', reject);

    // Start reading
    process.stdin.resume();
  });
}

// Run the CLI
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});