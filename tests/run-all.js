#!/usr/bin/env node

/**
 * Main test runner - runs all test suites
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTestFile(file, description) {
  console.log(`\n📋 ${description}`);
  console.log('─'.repeat(50));
  
  try {
    const { stdout, stderr } = await execAsync(`node ${file}`, {
      cwd: __dirname
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    return true;
  } catch (error) {
    console.error(`❌ Test suite failed: ${file}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function main() {
  console.log('🚀 Wang Language Test Suite');
  console.log('═'.repeat(50));
  
  const suites = [
    ['unit/parser.test.js', 'Parser Unit Tests'],
    ['unit/interpreter.test.js', 'Interpreter Unit Tests'],
    ['integration/wang-language.test.js', 'Integration Tests']
  ];
  
  let allPassed = true;
  
  for (const [file, description] of suites) {
    const passed = await runTestFile(file, description);
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  
  if (allPassed) {
    console.log('✅ All test suites passed!');
    process.exit(0);
  } else {
    console.log('❌ Some test suites failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});