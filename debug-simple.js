import { WangValidator } from './dist/esm/parser/wang-validator.js';

const code = `let result = getTruthy() || shouldNotBeCalled();
result;`;

console.log('Code:', code);

const validator = new WangValidator();
const result = validator.validate(code, { includeAST: true });

if (!result.valid) {
  console.error('Parse failed:', result.error);
  process.exit(1);
}

console.log('✅ Parse succeeded');
console.log('AST:', JSON.stringify(result.ast, null, 2));
