import nearley from 'nearley';
import grammar from './src/generated/wang-grammar.js';

const code = `let x = 5
let y = 10`;

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
parser.feed(code);

console.log('Parse results:', parser.results.length);

// Analyze the parse trees
if (parser.results.length > 1) {
  console.log('\nAnalyzing differences between parse results:');
  
  // Helper to show parse tree structure
  function showStructure(node, depth = 0) {
    const indent = '  '.repeat(depth);
    if (!node) return indent + 'null';
    if (typeof node !== 'object') return indent + JSON.stringify(node);
    if (Array.isArray(node)) {
      if (node.length === 0) return indent + '[]';
      return node.map(n => showStructure(n, depth)).join('\n');
    }
    
    let result = indent + '{\n';
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc') continue; // Skip location info
      result += indent + '  ' + key + ':\n';
      result += showStructure(value, depth + 2) + '\n';
    }
    result += indent + '}';
    return result;
  }
  
  // Compare first two results
  console.log('\nResult 1 structure:');
  console.log(showStructure(parser.results[0]));
  
  console.log('\nResult 2 structure:');
  console.log(showStructure(parser.results[1]));
}