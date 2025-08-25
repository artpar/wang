/**
 * Test utilities for Wang language tests
 */

import { WangInterpreter, InMemoryModuleResolver } from '../dist/esm/index.js';
import nearley from 'nearley';
import grammar from '../dist/esm/generated/wang-grammar.js';

export class TestContext {
  constructor() {
    this.resolver = new InMemoryModuleResolver();
    this.interpreter = null;
    this.customFunctions = {};
  }

  addModule(name, code) {
    this.resolver.addModule(name, code);
  }

  addFunction(name, fn) {
    this.customFunctions[name] = fn;
  }

  createInterpreter() {
    this.interpreter = new WangInterpreter({
      moduleResolver: this.resolver,
      functions: this.customFunctions,
    });
    return this.interpreter;
  }

  async execute(code) {
    if (!this.interpreter) {
      this.createInterpreter();
    }
    return await this.interpreter.execute(code);
  }

  parse(code) {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(code);
    return parser.results;
  }
}

export function assertParseCount(results, expectedCount, testName) {
  if (results.length !== expectedCount) {
    throw new Error(`${testName}: Expected ${expectedCount} parse(s), got ${results.length}`);
  }
}

export function assertEqual(actual, expected, testName) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${testName}: Expected ${expectedStr}, got ${actualStr}`);
  }
}

export function assertThrows(fn, errorType, testName) {
  let thrown = false;
  let error = null;
  try {
    fn();
  } catch (e) {
    thrown = true;
    error = e;
  }
  if (!thrown) {
    throw new Error(`${testName}: Expected error to be thrown`);
  }
  if (errorType && !(error instanceof errorType)) {
    throw new Error(
      `${testName}: Expected error type ${errorType.name}, got ${error.constructor.name}`,
    );
  }
}

export async function assertAsyncThrows(fn, errorType, testName) {
  let thrown = false;
  let error = null;
  try {
    await fn();
  } catch (e) {
    thrown = true;
    error = e;
  }
  if (!thrown) {
    throw new Error(`${testName}: Expected error to be thrown`);
  }
  if (errorType && !(error instanceof errorType)) {
    throw new Error(
      `${testName}: Expected error type ${errorType.name}, got ${error.constructor.name}`,
    );
  }
}

export function runTest(name, fn) {
  return {
    name,
    run: async () => {
      try {
        await fn();
        return { name, passed: true };
      } catch (error) {
        return { name, passed: false, error: error.message };
      }
    },
  };
}

export async function runTests(tests) {
  console.log('🧪 Running tests...\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.run();
    if (result.passed) {
      console.log(`  ✅ ${result.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${result.name}`);
      console.log(`     ${result.error}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}
