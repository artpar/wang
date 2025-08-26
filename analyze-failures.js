import { execSync } from 'child_process';

console.log('Analyzing test failures...\n');

// Run tests and capture output
const output = execSync('npm test 2>&1', { encoding: 'utf8' }).toString();

// Extract error patterns
const errors = [];
const lines = output.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Parse errors
  if (line.includes('Syntax error at line')) {
    const match = line.match(/Syntax error at line (\d+) col (\d+)/);
    if (match) {
      const context = lines.slice(Math.max(0, i-2), Math.min(lines.length, i+5)).join('\n');
      const unexpectedToken = context.match(/Unexpected (\S+) token: "([^"]*)"/);
      errors.push({
        type: 'parse',
        line: match[1],
        col: match[2],
        token: unexpectedToken ? unexpectedToken[2] : 'unknown',
        tokenType: unexpectedToken ? unexpectedToken[1] : 'unknown'
      });
    }
  }
  
  // Ambiguity errors
  if (line.includes('expected') && line.includes('to have a length of 1 but got')) {
    const match = line.match(/but got (\d+)/);
    if (match) {
      errors.push({
        type: 'ambiguity',
        count: match[1]
      });
    }
  }
}

// Group errors by type
const parseErrors = errors.filter(e => e.type === 'parse');
const ambiguityErrors = errors.filter(e => e.type === 'ambiguity');

console.log('=== Parse Errors ===');
const tokenGroups = {};
parseErrors.forEach(e => {
  const key = `${e.tokenType}:${e.token}`;
  tokenGroups[key] = (tokenGroups[key] || 0) + 1;
});
Object.entries(tokenGroups).forEach(([key, count]) => {
  console.log(`  ${key}: ${count} occurrences`);
});

console.log('\n=== Ambiguity Errors ===');
const ambiguityCounts = {};
ambiguityErrors.forEach(e => {
  ambiguityCounts[e.count] = (ambiguityCounts[e.count] || 0) + 1;
});
Object.entries(ambiguityCounts).forEach(([count, occurrences]) => {
  console.log(`  ${count} parse results: ${occurrences} tests`);
});

console.log('\n=== Summary ===');
console.log(`Total parse errors: ${parseErrors.length}`);
console.log(`Total ambiguity errors: ${ambiguityErrors.length}`);