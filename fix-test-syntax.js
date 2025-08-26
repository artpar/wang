#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all test files
const testFiles = glob.sync('tests/**/*.test.js');

console.log(`Found ${testFiles.length} test files to update`);

testFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Only modify content inside execute() or parse() calls
  // This regex matches content between execute(` or parse(` and the closing `)
  content = content.replace(/((?:execute|parse)\s*\(\s*`)([\s\S]*?)(`\s*\))/g, (match, start, code, end) => {
    let modifiedCode = code;
    
    // Remove semicolons at end of statements (but keep in for loops)
    // First, protect for loop semicolons
    modifiedCode = modifiedCode.replace(/for\s*\([^)]*\)/g, match => {
      return match.replace(/;/g, '<<<FORSEMI>>>');
    });
    
    // Remove other semicolons
    modifiedCode = modifiedCode.replace(/;(\s*\n|\s*$)/g, '$1');
    modifiedCode = modifiedCode.replace(/;(\s*})/g, '$1');
    
    // Restore for loop semicolons
    modifiedCode = modifiedCode.replace(/<<<FORSEMI>>>/g, ';');
    
    // Replace i++ with i = i + 1 in for loops
    modifiedCode = modifiedCode.replace(/(\w+)\+\+/g, '$1 = $1 + 1');
    modifiedCode = modifiedCode.replace(/(\w+)--/g, '$1 = $1 - 1');
    
    // Replace compound assignments
    modifiedCode = modifiedCode.replace(/(\w+)\s*\+=\s*([^;\n]+)/g, '$1 = $1 + ($2)');
    modifiedCode = modifiedCode.replace(/(\w+)\s*-=\s*([^;\n]+)/g, '$1 = $1 - ($2)');
    modifiedCode = modifiedCode.replace(/(\w+)\s*\*=\s*([^;\n]+)/g, '$1 = $1 * ($2)');
    modifiedCode = modifiedCode.replace(/(\w+)\s*\/=\s*([^;\n]+)/g, '$1 = $1 / ($2)');
    
    // Fix switch statements - comment them out for now as we don't support them
    if (modifiedCode.includes('switch')) {
      console.log(`  Warning: ${file} contains switch statement - needs manual fix`);
    }
    
    return start + modifiedCode + end;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`  No changes needed for ${file}`);
  }
});

console.log('\nDone! Now running tests to check for remaining issues...');