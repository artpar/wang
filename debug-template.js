import { WangLexer } from './dist/esm/index.js';

const lexer = new WangLexer();
const input = '`Hello ${world}`';
console.log('Input:', input);

const tokens = lexer.tokenize(input);
console.log('Tokens:', JSON.stringify(tokens, null, 2));
