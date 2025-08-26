import nearley from 'nearley';
import grammar from './src/generated/wang-grammar.js';

const code = `const obj = {
  name: "test",
  value: 42,
  nested: { x: 1 }
}`;

console.log('Testing code:');
console.log(code);
console.log('\nParsing...');

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
try {
  parser.feed(code);
  console.log('Parse results:', parser.results.length);
  if (parser.results.length > 0) {
    console.log('Success! First AST:', JSON.stringify(parser.results[0], null, 2));
  }
} catch (e) {
  console.error('Parse error:', e.message);
}