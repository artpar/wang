#!/usr/bin/env node

/**
 * Manual Test Script for Wang Service Worker
 * This script provides manual verification steps and basic API testing
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🧪 Wang Service Worker Manual Test Guide');
console.log('=====================================\n');

// Test 1: Verify build files
console.log('📋 Test 1: Verifying build files...');

const requiredFiles = [
  'extension/manifest.json',
  'extension/background.js', 
  'extension/content-script.js',
  'extension/popup.html',
  'extension/popup.js',
  'extension/wang.min.js',
  'extension/wang-scripts/dom-automation.wang',
  'extension/wang-scripts/api-calls.wang',
  'extension/wang-scripts/storage-ops.wang',
  'extension/wang-scripts/scheduled-tasks.wang'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check the build process.');
  process.exit(1);
}

console.log('\n✅ All required files present\n');

// Test 2: Check Wang build
console.log('📋 Test 2: Checking Wang browser bundle...');

const wangMinPath = path.join(__dirname, 'extension/wang.min.js');
const wangMinStats = fs.statSync(wangMinPath);
console.log(`✅ wang.min.js size: ${(wangMinStats.size / 1024).toFixed(1)}KB`);

// Quick check that the bundle contains expected exports
const wangContent = fs.readFileSync(wangMinPath, 'utf8');
const expectedExports = ['WangInterpreter', 'PausableWangInterpreter', 'InMemoryModuleResolver'];
let missingExports = [];

for (const exportName of expectedExports) {
  if (wangContent.includes(exportName)) {
    console.log(`✅ ${exportName} found in bundle`);
  } else {
    console.log(`❌ ${exportName} missing from bundle`);
    missingExports.push(exportName);
  }
}

if (missingExports.length > 0) {
  console.log(`\n⚠️  Warning: Missing exports: ${missingExports.join(', ')}`);
  console.log('This may indicate a build issue.');
}

console.log('\n✅ Wang bundle verification complete\n');

// Test 3: Test server API
console.log('📋 Test 3: Testing server API endpoints...');

async function testAPI() {
  const baseUrl = 'http://localhost:3000';
  
  const endpoints = [
    '/api/test',
    '/api/status', 
    '/api/users',
    '/api/random'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(baseUrl + endpoint);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ ${endpoint} - OK`);
      } else {
        console.log(`❌ ${endpoint} - Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed to connect: ${error.message}`);
      return false;
    }
  }
  
  return true;
}

// Check if server is running and test APIs
try {
  const apiTestResult = await testAPI();
  if (apiTestResult) {
    console.log('\n✅ All API endpoints responding correctly\n');
  } else {
    console.log('\n❌ Some API endpoints failed. Is the test server running?\n');
  }
} catch (error) {
  console.log('\n❌ API test failed. Please ensure test server is running:');
  console.log('   cd tests/service-worker/server && node test-server.js\n');
}

// Test 4: Manual verification steps
console.log('📋 Test 4: Manual Verification Steps');
console.log('===================================\n');

console.log('🔧 Step 1: Load Extension in Chrome');
console.log('   1. Open Chrome and go to chrome://extensions/');
console.log('   2. Enable "Developer mode" (toggle in top-right)');
console.log('   3. Click "Load unpacked"');
console.log(`   4. Select: ${path.resolve(__dirname, 'extension')}`);
console.log('   5. Verify extension appears and is enabled\n');

console.log('🌐 Step 2: Open Test Page');
console.log('   1. Navigate to http://localhost:3000/simple-form.html');
console.log('   2. Verify page loads with form elements');
console.log('   3. Open Chrome DevTools (F12)\n');

console.log('🎮 Step 3: Test Extension Popup');
console.log('   1. Click the Wang extension icon in toolbar');
console.log('   2. Verify popup opens with code editor');
console.log('   3. Check console in popup DevTools for any errors');
console.log('   4. Verify dropdown shows example scripts\n');

console.log('⚙️  Step 4: Test Service Worker');
console.log('   1. In Chrome, go to chrome://extensions/');
console.log('   2. Find your extension, click "service worker" link');
console.log('   3. Verify service worker console opens');
console.log('   4. Look for "[Wang] Background script loaded" message\n');

console.log('🧪 Step 5: Execute Test Script');
console.log('   1. In extension popup, select "DOM Automation" from dropdown');
console.log('   2. Click "Load" to load the script');
console.log('   3. Click "Run" to execute');
console.log('   4. Watch console output in popup');
console.log('   5. Check service worker console for Wang logs\n');

console.log('📊 Step 6: Verify Results');
console.log('   1. Check if form on test page was filled');
console.log('   2. Verify console shows execution logs');
console.log('   3. Check Chrome storage: DevTools > Application > Storage > Extension');
console.log('   4. Look for stored test results\n');

console.log('🔍 Expected Results:');
console.log('   ✅ Extension loads without errors');
console.log('   ✅ Service worker registers and shows Wang logs');
console.log('   ✅ Popup interface loads and functions');
console.log('   ✅ DOM automation script fills form fields');
console.log('   ✅ API calls complete successfully');
console.log('   ✅ Data persists in Chrome storage');
console.log('   ✅ Real-time execution monitoring works\n');

console.log('📋 Quick Test Commands:');
console.log('======================\n');

console.log('// Test basic Wang execution in service worker');
console.log('// Paste this in extension popup:');
console.log(`
let message = "Hello from Wang in service worker!"
log(message)

// Test storage
await store("test_key", { timestamp: new Date().toISOString(), success: true })
let stored = await retrieve("test_key")
log("Storage test:", stored)

// Test API call
let apiResponse = await apiCall("http://localhost:3000/api/test")
log("API test:", apiResponse)
`);

console.log('\n🎯 Troubleshooting Tips:');
console.log('========================\n');

console.log('❌ Extension not loading:');
console.log('   - Check manifest.json syntax');
console.log('   - Verify wang.min.js exists and is valid');
console.log('   - Check Chrome extensions page for error details\n');

console.log('❌ Service worker not starting:');
console.log('   - Check background.js for syntax errors');
console.log('   - Verify wang.min.js is properly imported');
console.log('   - Look at service worker console for import errors\n');

console.log('❌ Scripts not executing:');
console.log('   - Check popup console for errors');
console.log('   - Verify message passing between popup and service worker');
console.log('   - Check if Wang interpreter initialized in service worker\n');

console.log('❌ DOM operations failing:');
console.log('   - Verify content script is injected');
console.log('   - Check page console for content script errors');
console.log('   - Ensure test page is loaded at localhost:3000\n');

console.log('🚀 Manual test guide complete!');
console.log('Please follow the steps above to verify Wang service worker functionality.');
console.log('This provides the fastest feedback loop for development and debugging.\n');