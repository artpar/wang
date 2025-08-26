import nearley from 'nearley';
import moo from 'moo';
import { readFileSync } from 'fs';

const grammarContent = readFileSync('./src/grammar/wang.ne', 'utf8');

// Extract just the lexer definition
const lexerMatch = grammarContent.match(/@{%[\s\S]*?%}/);
const lexerCode = lexerMatch[0].slice(3, -2);
const lexer = eval(lexerCode);

const tokens = lexer.reset('`Hello ${world}`');
let tok;
while (tok = tokens.next()) {
  if (tok.type !== 'NL' && tok.type !== 'WS') {
    console.log(tok);
  }
  if (!tok.value) break;
}
