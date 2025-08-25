import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';
import nearley from 'nearley';
import grammar from './dist/esm/generated/wang-grammar.js';

async function test() {
  const code = `
    import { functionB } from "moduleB";
    
    export function functionA() {
      return "A calls " + functionB()
    };
    
    export function helperA() {
      return "Helper A"
    }
  `;

  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(code);
  
  if (parser.results.length > 0) {
    console.log('AST:', JSON.stringify(parser.results[0], null, 2));
  }
}

test().catch(console.error);