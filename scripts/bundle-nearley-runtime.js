#!/usr/bin/env node

/**
 * Bundle nearley runtime into the generated grammar file
 * This eliminates the runtime nearley dependency
 */

import fs from 'fs';
import path from 'path';

const grammarPath = path.join(process.cwd(), 'src', 'generated', 'wang-grammar.js');
const nearleyModulePath = path.join(process.cwd(), 'node_modules', 'nearley', 'lib', 'nearley.js');

if (!fs.existsSync(grammarPath)) {
  console.error('❌ Generated grammar file not found:', grammarPath);
  process.exit(1);
}

if (!fs.existsSync(nearleyModulePath)) {
  console.error('❌ Nearley module not found:', nearleyModulePath);
  process.exit(1);
}

// Read files
let grammarContent = fs.readFileSync(grammarPath, 'utf8');
const nearleySource = fs.readFileSync(nearleyModulePath, 'utf8');

// Read moo source
const mooModulePath = path.join(process.cwd(), 'node_modules', 'moo', 'moo.js');
let mooSource = fs.readFileSync(mooModulePath, 'utf8');

// Extract the factory function content from nearley UMD wrapper
const factoryStart = nearleySource.indexOf('function() {') + 'function() {'.length;
const factoryEnd = nearleySource.lastIndexOf('    return {');
const factoryContent = nearleySource.slice(factoryStart, factoryEnd).trim();
const returnStatement = nearleySource.slice(factoryEnd, nearleySource.lastIndexOf('}));')).trim();

// Create a bundled version with moo and nearley inline
const bundledGrammar = `// Bundled Moo and Nearley Runtime
// This file is self-contained and requires no external dependencies

// Inline Moo (${(mooSource.length / 1024).toFixed(1)}KB)
const moo = (() => {
  const module = { exports: {} };
  const exports = module.exports;
  
  ${mooSource.replace(/\(function\(root, factory\) {[\s\S]*?}\)\(this, function\(\) {/, '').replace(/}\);[\s]*$/, '')}
  
  return module.exports;
})();

// Bundled Nearley Runtime (${(nearleySource.length / 1024).toFixed(1)}KB)
const nearley = (function() {
${factoryContent}

${returnStatement}
})();

// Original Generated Grammar (with require statements removed)
${(() => {
  let content = grammarContent
    .replace('(function () {', '')
    .replace(/}\)\(\);[\s]*$/, '')
    .replace("const moo = require('moo');", '// moo is already bundled above');
  
  // Remove the CommonJS/browser export section
  const exportStart = content.indexOf('if (typeof module !== \'undefined\'&& typeof module.exports !== \'undefined\') {');
  if (exportStart !== -1) {
    const exportEnd = content.indexOf('}', content.indexOf('window.grammar = grammar;')) + 1;
    content = content.slice(0, exportStart) + content.slice(exportEnd);
  }
  
  return content.trim();
})()}

// Export both nearley runtime and grammar for ES modules
export { nearley };
export { grammar };
export default grammar;`;

// Write the bundled grammar
fs.writeFileSync(grammarPath, bundledGrammar, 'utf8');

console.log('✅ Bundled moo and nearley runtime into grammar file');
console.log(`📦 Moo lexer: ${(mooSource.length / 1024).toFixed(1)}KB bundled`);
console.log(`📦 Nearley runtime: ${(nearleySource.length / 1024).toFixed(1)}KB bundled`);
console.log('🚀 Grammar file is now self-contained - no external dependencies!');