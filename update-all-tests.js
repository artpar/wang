#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Find all test files
const testFiles = [
  'tests/unit/interpreter.test.js',
  'tests/unit/edge-cases-errors.test.js', 
  'tests/unit/return-value.test.js',
  'tests/unit/parser.test.js',
  'tests/e2e/language-features.test.js'
];

function updateTestSyntax(content) {
  // Process each execute() or parse() block
  return content.replace(/((?:execute|parse)\s*\(\s*`)([\s\S]*?)(`\s*\))/g, (match, start, code, end) => {
    let updated = code;
    
    // Step 1: Protect for-loop semicolons
    const forLoops = [];
    updated = updated.replace(/for\s*\([^)]*\)/g, (forMatch) => {
      forLoops.push(forMatch);
      return `<<<FOR_${forLoops.length - 1}>>>`;
    });
    
    // Step 2: Remove semicolons at end of lines
    updated = updated.replace(/;(\s*\n)/g, '$1');
    updated = updated.replace(/;(\s*})/g, '$1');
    updated = updated.replace(/;(\s*$)/g, '$1');
    
    // Step 3: Restore for loops with fixes
    forLoops.forEach((forLoop, i) => {
      // Fix ++ and -- in for loops
      let fixed = forLoop
        .replace(/(\w+)\+\+/g, '$1 = $1 + 1')
        .replace(/(\w+)--/g, '$1 = $1 - 1');
      updated = updated.replace(`<<<FOR_${i}>>>`, fixed);
    });
    
    // Step 4: Replace compound assignments
    updated = updated.replace(/(\w+)\s*\+=\s*([^;\n]+)/g, '$1 = $1 + ($2)');
    updated = updated.replace(/(\w+)\s*-=\s*([^;\n]+)/g, '$1 = $1 - ($2)');
    updated = updated.replace(/(\w+)\s*\*=\s*([^;\n]+)/g, '$1 = $1 * ($2)');
    updated = updated.replace(/(\w+)\s*\/=\s*([^;\n]+)/g, '$1 = $1 / ($2)');
    updated = updated.replace(/(\w+)\s*%=\s*([^;\n]+)/g, '$1 = $1 % ($2)');
    
    // Step 5: Fix standalone ++ and --
    updated = updated.replace(/(\w+)\+\+/g, '$1 = $1 + 1');
    updated = updated.replace(/(\w+)--/g, '$1 = $1 - 1');
    
    // Step 6: Remove ternary operators (we don't support them)
    if (updated.includes('?') && updated.includes(':') && !updated.includes('case')) {
      // This is a simple check - may need manual fixes for complex cases
      console.log('  Warning: Ternary operator detected - needs manual fix');
    }
    
    return start + updated + end;
  });
}

console.log('Updating test files to new Wang syntax...\n');

testFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`  Skipping ${file} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  content = updateTestSyntax(content);
  
  // Special handling for specific test patterns
  
  // Remove tests that use features we don't support
  if (file.includes('language-features')) {
    // Comment out switch statement tests
    content = content.replace(/(it\('should handle switch statements'[\s\S]*?\}\);)/g, 
      '/* Removed: switch statements not supported\n$1\n*/');
    
    // Comment out static method tests
    content = content.replace(/(it\('should handle static methods'[\s\S]*?\}\);)/g,
      '/* Removed: static methods not supported\n$1\n*/');
      
    // Comment out getter/setter tests
    content = content.replace(/(it\('should handle getters and setters'[\s\S]*?\}\);)/g,
      '/* Removed: getters/setters not supported\n$1\n*/');
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`  No changes needed for ${file}`);
  }
});

console.log('\n✓ Test syntax update complete!');
console.log('\nNote: Some tests may still fail due to:');
console.log('  - Features not supported (switch, static, getters/setters, ternary)');
console.log('  - Tests that need manual adjustment');
console.log('\nRun "npm test" to see remaining issues.');