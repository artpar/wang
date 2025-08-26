#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const grammarCjsPath = path.join(__dirname, '..', 'dist', 'cjs', 'generated', 'wang-grammar.cjs');

if (!fs.existsSync(grammarCjsPath)) {
  console.log('Grammar CJS file not found:', grammarCjsPath);
  process.exit(1);
}

let content = fs.readFileSync(grammarCjsPath, 'utf8');

// Replace ES module exports with CommonJS exports
content = content
  .replace('export { nearley };', '')
  .replace('export { grammar };', '')
  .replace('export default grammar;', '');

// Add proper CommonJS exports at the end
content += `
module.exports.nearley = nearley;
module.exports.grammar = grammar;
module.exports = { nearley, grammar };
`;

fs.writeFileSync(grammarCjsPath, content, 'utf8');
console.log('✅ Fixed grammar file for CommonJS');