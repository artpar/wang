import { readFileSync } from 'fs';
import { WangValidator } from './dist/esm/parser/wang-validator.js';

const code = `switch (x) {
  case 1: {
    console.log("one");
    break;
  }
}`;

console.log('Code:', code);
console.log('\nParsing...\n');

const validator = new WangValidator();
const result = validator.validate(code, { includeAST: true });

if (!result.valid) {
  console.error('Parse failed:', result.error);
  process.exit(1);
}

console.log('AST:', JSON.stringify(result.ast, null, 2));
