#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const grammarPath = path.join(__dirname, '..', 'dist', 'esm', 'generated', 'wang-grammar.js');

if (fs.existsSync(grammarPath)) {
  let content = fs.readFileSync(grammarPath, 'utf8');
  
  // Check if already converted
  if (content.includes('import moo from')) {
    console.log('Grammar already in ESM format');
    process.exit(0);
  }
  
  // Remove the IIFE wrapper - search for it anywhere in the file
  const iifeStart = content.indexOf('(function () {');
  if (iifeStart >= 0) {
    // Remove starting wrapper
    content = content.substring(0, iifeStart) + content.substring(iifeStart + '(function () {'.length);
    
    // Remove ending wrapper - look for })(); at the end
    const iifeEnd = content.lastIndexOf('})();');
    if (iifeEnd >= 0) {
      content = content.substring(0, iifeEnd) + content.substring(iifeEnd + '})();'.length);
    }
  }
  
  // Replace module.exports with ES export
  content = content.replace(
    /if \(typeof module !== 'undefined'&& typeof module\.exports !== 'undefined'\) \{\s*module\.exports = grammar;\s*\} else \{\s*window\.grammar = grammar;\s*\}/,
    'export default grammar;'
  );
  
  // Convert require statements to imports - must be at the top
  content = content.replace(/const moo = require\('moo'\);/, "import moo from 'moo';");
  
  // Move import to the top if needed
  if (content.includes('import moo from') && !content.startsWith('//')) {
    const importLine = "import moo from 'moo';";
    content = content.replace(importLine, '');
    // Insert after the header comments
    const headerEnd = content.indexOf('\n\n');
    content = content.substring(0, headerEnd + 2) + importLine + '\n' + content.substring(headerEnd + 2);
  }
  
  fs.writeFileSync(grammarPath, content);
  console.log('Converted grammar to ESM format');
} else {
  console.log('Grammar file not found');
}