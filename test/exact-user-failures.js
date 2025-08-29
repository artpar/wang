#!/usr/bin/env node

import nearley from 'nearley';
import * as grammar from '../dist/esm/generated/wang-grammar.js';

// These are the EXACT failures users reported
const userFailures = [
  {
    name: 'User Report 1: Arrow in map with property access',
    code: `let formattedStories = map(stories, (story, index) => {
    return (index + 1) + ". [" + story.title + "](" + story.url + ")"
})`
  },
  {
    name: 'User Report 2: Object with arr.length',
    code: `let report = {
    success: true,
    workflow: "hackernews-to-gist",
    storiesExtracted: stories.length,
    markdownGenerated: markdownContent.length > 0
}`
  },
  {
    name: 'User Report 3: Console.log with concatenation',
    code: 'console.log("- Stories extracted: " + report.storiesExtracted)'
  },
  {
    name: 'User Report 4: Function keyword in map',
    code: `let formattedStories = map(stories, function(story, index) {
    return (index + 1) + ". [" + story.title + "](" + story.url + ")"
})`
  },
  {
    name: 'User Report 5: Multi-line boolean',
    code: `let allTabsDifferent = (apiTabId !== htmlTabId) &&
                       (htmlTabId !== dataTabId) &&
                       (apiTabId !== dataTabId)`
  },
  {
    name: 'User Report 6: Method call in expression',
    code: 'markdownContent = markdownContent + formattedStories.join("\\n")'
  },
  {
    name: 'User Report 7: Complex ternary',
    code: 'let currentUrl = tabInfo && tabInfo.tabs && tabInfo.tabs[0] ? tabInfo.tabs[0].url : ""'
  }
];

console.log('Testing EXACT User-Reported Failures\n');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

for (const test of userFailures) {
  console.log(`\n${test.name}`);
  console.log('-'.repeat(70));
  console.log('Code:');
  console.log(test.code);
  console.log();
  
  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar.default || grammar.grammar));
    parser.feed(test.code);
    
    if (parser.results.length === 0) {
      console.log('❌ FAILED: No parse found');
      failed++;
    } else if (parser.results.length > 1) {
      console.log(`⚠️  WARNING: Ambiguous (${parser.results.length} parses) but PASSED`);
      passed++;
    } else {
      console.log('✅ PASSED: Parsed successfully');
      passed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Parse error');
    failed++;
    
    // Extract specific error details
    const lines = error.message.split('\n');
    const unexpectedLine = lines.find(l => l.includes('Unexpected'));
    if (unexpectedLine) {
      console.log('   Error:', unexpectedLine.trim());
    }
    
    // Find the exact position
    const match = error.message.match(/at line (\d+) col (\d+)/);
    if (match) {
      const line = parseInt(match[1]) - 1;
      const col = parseInt(match[2]) - 1;
      const codeLines = test.code.split('\n');
      if (codeLines[line]) {
        console.log(`   Location: Line ${match[1]}, Column ${match[2]}`);
        console.log(`   Problem area: "${codeLines[line].substring(col, col + 10)}..."`);
      }
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log('\nRESULTS:');
console.log(`✅ Passed: ${passed} / ${userFailures.length}`);
console.log(`❌ Failed: ${failed} / ${userFailures.length}`);

if (failed === 0) {
  console.log('\n🎉 ALL USER-REPORTED CASES NOW PARSE CORRECTLY!');
  console.log('The parser actually works - the issue must be elsewhere.');
} else if (failed === 1 && userFailures[4].name.includes('Multi-line')) {
  console.log('\n📝 Only multi-line expressions fail!');
  console.log('All other "failures" users reported actually parse fine.');
  console.log('The real issue is that Wang requires newlines to separate statements,');
  console.log('which conflicts with multi-line expressions.');
}