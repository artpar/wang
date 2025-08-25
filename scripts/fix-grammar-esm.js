#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const grammarPath = path.join(__dirname, '../dist/esm/generated/wang-grammar.js');

if (fs.existsSync(grammarPath)) {
  let content = fs.readFileSync(grammarPath, 'utf8');

  // First convert require to import
  content = content.replace("const moo = require('moo');", "import moo from 'moo';");

  // Extract everything inside the IIFE (between function() { and })()
  const iifeMatch = content.match(/^\(function \(\) \{([\s\S]*?)\}\)\(\);?$/m);
  if (iifeMatch) {
    content = iifeMatch[1];
  }

  // Find and extract import statements
  const imports = [];
  content = content.replace(/^import .+$/gm, (match) => {
    imports.push(match);
    return '';
  });

  // Convert module.exports to export default
  content = content.replace(
    /if \(typeof module !== 'undefined'.*?module\.exports = grammar;.*?} else \{.*?window\.grammar = grammar;.*?\}/s,
    'export default grammar;',
  );

  // Clean up function id at the beginning if it exists
  content = content.replace(
    /^function id\(x\) \{ return x\[0\]; \}/,
    'function id(x) { return x[0]; }',
  );

  // Combine imports and content
  content = imports.join('\n') + '\n' + content;

  // Trim any extra whitespace
  content = content.trim();

  fs.writeFileSync(grammarPath, content);
  console.log('Fixed ESM grammar file');
}
