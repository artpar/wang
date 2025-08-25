#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const grammarPath = path.join(__dirname, '../src/generated/wang-grammar.js');
const esmPath = path.join(__dirname, '../dist/esm/generated/wang-grammar.js');

// Read the CommonJS grammar
let content = fs.readFileSync(grammarPath, 'utf8');

// Move moo import outside the IIFE and convert to ESM
content = content.replace(
  /\(function\s*\(\)\s*{\s*function id\(x\) { return x\[0\]; }\s*const moo = require\('moo'\);/,
  "import moo from 'moo';\n\nfunction id(x) { return x[0]; }"
);

// Remove the IIFE wrapper end and module.exports
content = content.replace(/if\s*\(typeof module !== 'undefined'.*?\n.*?module\.exports = grammar;.*?\n.*?} else {.*?\n.*?window\.grammar = grammar;.*?\n.*?}\n.*?\}\)\(\);?/, 'export default grammar;');

// Ensure the directory exists
fs.mkdirSync(path.dirname(esmPath), { recursive: true });

// Write the ESM version
fs.writeFileSync(esmPath, content);

console.log('Converted grammar to ESM format');