#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const grammarPath = path.join(__dirname, '../dist/esm/generated/wang-grammar.js');

if (fs.existsSync(grammarPath)) {
  let content = fs.readFileSync(grammarPath, 'utf8');
  
  // Remove IIFE wrapper
  content = content.replace(/^\(function \(\) \{/, '');
  content = content.replace(/\}\)\(\);?$/, '');
  
  // Convert require to import
  content = content.replace("const moo = require('moo');", "import moo from 'moo';");
  
  // Convert module.exports to export default
  content = content.replace(/if \(typeof module !== 'undefined'.*?module\.exports = grammar;.*?} else \{.*?window\.grammar = grammar;.*?\}/s, 
    'export default grammar;');
  
  // Trim any extra whitespace
  content = content.trim();
  
  fs.writeFileSync(grammarPath, content);
  console.log('Fixed ESM grammar file');
}