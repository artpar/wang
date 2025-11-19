import { readFileSync } from 'fs';
import { WangValidator } from './dist/esm/parser/wang-validator.js';

// Old syntax without blocks
const code = `switch (x) {
  case 1:
    console.log("one");
    break;
}`;

console.log('Code (old syntax without blocks):', code);
console.log('\nParsing...\n');

const validator = new WangValidator();
const result = validator.validate(code, { includeAST: false });

if (!result.valid) {
  console.error('❌ Parse failed:');
  console.error('Message:', result.error.message);
  console.error('Line:', result.error.line, 'Column:', result.error.column);
  if (result.error.suggestion) {
    console.error('Suggestion:', result.error.suggestion);
  }
  process.exit(1);
}

console.log('✅ Parse succeeded (unexpected!)');
