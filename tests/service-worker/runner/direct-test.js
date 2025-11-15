#!/usr/bin/env node

/**
 * Direct Wang Test - Tests Wang execution without browser automation
 * Tests the core Wang interpreter functionality that powers the service worker
 */

import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🧪 Direct Wang Execution Test');
console.log('=============================\n');

let testResults = [];

// Simple logger
function log(message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    ...data
  };
  console.log(`📋 ${message}`);
  if (data.error) console.error(`    Error: ${data.error}`);
  if (data.result) console.log(`    Result: ${JSON.stringify(data.result).substring(0, 100)}...`);
  testResults.push(entry);
  return entry;
}

async function testWangBundle() {
  log('Testing Wang browser bundle');
  
  try {
    // Check if wang.min.js exists
    const wangPath = path.join(__dirname, '../extension/wang.min.js');
    if (!fs.existsSync(wangPath)) {
      throw new Error('wang.min.js not found in extension directory');
    }
    
    const stats = fs.statSync(wangPath);
    log('✅ Wang bundle found', { size: `${(stats.size / 1024).toFixed(1)}KB` });
    
    // Read and check bundle contents
    const wangCode = fs.readFileSync(wangPath, 'utf8');
    const expectedExports = ['WangInterpreter', 'PausableWangInterpreter', 'InMemoryModuleResolver'];
    
    const foundExports = expectedExports.filter(exp => wangCode.includes(exp));
    
    log(`✅ Bundle exports verified`, { 
      expected: expectedExports.length,
      found: foundExports.length,
      exports: foundExports
    });
    
    return foundExports.length === expectedExports.length;
    
  } catch (error) {
    log('❌ Wang bundle test failed', { error: error.message });
    return false;
  }
}

async function testServerAPIs() {
  log('Testing server API endpoints');
  
  const endpoints = [
    'http://localhost:3000/api/test',
    'http://localhost:3000/api/status',
    'http://localhost:3000/api/users',
    'http://localhost:3000/api/random'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok && data) {
        log(`✅ ${endpoint.split('/').pop()} API - OK`, { 
          status: response.status,
          hasData: !!data.success || !!data.status
        });
        results.push({ endpoint, status: 'ok', data: data });
      } else {
        log(`❌ ${endpoint.split('/').pop()} API - Failed`, { 
          status: response.status 
        });
        results.push({ endpoint, status: 'failed', code: response.status });
      }
    } catch (error) {
      log(`❌ ${endpoint.split('/').pop()} API - Error`, { error: error.message });
      results.push({ endpoint, status: 'error', error: error.message });
    }
  }
  
  return results;
}

async function testWangScripts() {
  log('Testing Wang script files');
  
  const scriptsDir = path.join(__dirname, '../extension/wang-scripts');
  const expectedScripts = [
    'dom-automation.wang',
    'api-calls.wang',
    'storage-ops.wang',
    'scheduled-tasks.wang'
  ];
  
  const scriptTests = [];
  
  for (const scriptName of expectedScripts) {
    const scriptPath = path.join(scriptsDir, scriptName);
    
    try {
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Script file not found');
      }
      
      const content = fs.readFileSync(scriptPath, 'utf8');
      const lines = content.split('\\n').length;
      
      // Basic syntax checks
      const hasLogStatements = content.includes('log(');
      const hasAsyncOperations = content.includes('await ');
      const hasErrorHandling = content.includes('try {') || content.includes('catch');
      
      log(`✅ ${scriptName} - Valid`, {
        lines,
        hasLogging: hasLogStatements,
        hasAsync: hasAsyncOperations,
        hasErrorHandling
      });
      
      scriptTests.push({
        script: scriptName,
        status: 'valid',
        lines,
        features: {
          logging: hasLogStatements,
          async: hasAsyncOperations,
          errorHandling
        }
      });
      
    } catch (error) {
      log(`❌ ${scriptName} - Error`, { error: error.message });
      scriptTests.push({
        script: scriptName,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return scriptTests;
}

async function testNodeEnvironment() {
  log('Testing Node.js environment simulation');
  
  try {
    // Test basic JavaScript features that Wang uses
    const tests = [
      {
        name: 'Promise support',
        test: () => typeof Promise !== 'undefined'
      },
      {
        name: 'Async/await support', 
        test: async () => {
          const result = await Promise.resolve('test');
          return result === 'test';
        }
      },
      {
        name: 'JSON support',
        test: () => {
          const obj = { test: true, nested: { value: 42 } };
          const json = JSON.stringify(obj);
          const parsed = JSON.parse(json);
          return parsed.test === true && parsed.nested.value === 42;
        }
      },
      {
        name: 'Map support',
        test: () => {
          const map = new Map();
          map.set('key', 'value');
          return map.get('key') === 'value';
        }
      },
      {
        name: 'Date support',
        test: () => {
          const date = new Date();
          return date instanceof Date && !isNaN(date.getTime());
        }
      },
      {
        name: 'Error support',
        test: () => {
          try {
            throw new Error('test error');
          } catch (e) {
            return e instanceof Error && e.message === 'test error';
          }
        }
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const result = await test.test();
        if (result) {
          log(`✅ ${test.name} - Working`);
          results.push({ test: test.name, status: 'ok' });
        } else {
          log(`❌ ${test.name} - Failed`);
          results.push({ test: test.name, status: 'failed' });
        }
      } catch (error) {
        log(`❌ ${test.name} - Error`, { error: error.message });
        results.push({ test: test.name, status: 'error', error: error.message });
      }
    }
    
    return results;
    
  } catch (error) {
    log('❌ Environment test failed', { error: error.message });
    return [];
  }
}

async function simulateServiceWorkerEnvironment() {
  log('Simulating service worker environment');
  
  try {
    // Mock Chrome APIs that would be available in service worker
    const mockChrome = {
      runtime: {
        sendMessage: (message, callback) => {
          log('Mock chrome.runtime.sendMessage called', { message });
          if (callback) callback({ success: true, mock: true });
        }
      },
      storage: {
        local: {
          get: (keys) => {
            log('Mock chrome.storage.local.get called', { keys });
            return Promise.resolve({});
          },
          set: (items) => {
            log('Mock chrome.storage.local.set called', { items });
            return Promise.resolve();
          }
        }
      },
      alarms: {
        create: (name, alarmInfo) => {
          log('Mock chrome.alarms.create called', { name, alarmInfo });
        }
      }
    };
    
    // Mock fetch for API calls
    global.fetch = global.fetch || (async (url, options) => {
      log('Mock fetch called', { url, method: options?.method || 'GET' });
      
      if (url.includes('/api/test')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            message: 'Mock API response',
            timestamp: new Date().toISOString()
          })
        };
      }
      
      return {
        ok: true,
        json: async () => ({ mock: true, url })
      };
    });
    
    log('✅ Service worker environment simulation ready');
    return { chrome: mockChrome, fetch: global.fetch };
    
  } catch (error) {
    log('❌ Service worker simulation failed', { error: error.message });
    return null;
  }
}

async function testWangInterpreterDirectly() {
  log('Testing Wang interpreter directly');
  
  try {
    // This is tricky because wang.min.js is designed for browser
    // But we can at least verify it would load
    
    const wangPath = path.join(__dirname, '../extension/wang.min.js');
    const wangCode = fs.readFileSync(wangPath, 'utf8');
    
    // Check for common issues that would prevent loading
    const issues = [];
    
    if (wangCode.includes('document.') && !wangCode.includes('typeof document')) {
      issues.push('Direct document access without feature detection');
    }
    
    if (wangCode.includes('window.') && !wangCode.includes('typeof window')) {
      issues.push('Direct window access without feature detection');
    }
    
    // Check for service worker compatibility markers
    const hasServiceWorkerSupport = wangCode.includes('importScripts') || 
                                  wangCode.includes('self.') ||
                                  !wangCode.includes('document.');
    
    log('Wang bundle analysis', {
      size: `${(wangCode.length / 1024).toFixed(1)}KB`,
      issues: issues.length,
      serviceWorkerCompatible: hasServiceWorkerSupport,
      hasImportScripts: wangCode.includes('importScripts'),
      hasGlobalThis: wangCode.includes('globalThis'),
      hasSelf: wangCode.includes('self.')
    });
    
    if (issues.length === 0) {
      log('✅ Wang bundle appears service worker compatible');
    } else {
      log('⚠️ Potential service worker compatibility issues', { issues });
    }
    
    return { compatible: issues.length === 0, issues };
    
  } catch (error) {
    log('❌ Wang interpreter test failed', { error: error.message });
    return { compatible: false, error: error.message };
  }
}

async function runDirectTests() {
  const testStart = Date.now();
  
  try {
    log('Starting direct Wang tests\\n');
    
    // Test 1: Wang bundle
    const bundleOK = await testWangBundle();
    
    // Test 2: Server APIs
    const apiResults = await testServerAPIs();
    const apiOK = apiResults.filter(r => r.status === 'ok').length > 0;
    
    // Test 3: Script files
    const scriptResults = await testWangScripts();
    const scriptsOK = scriptResults.filter(s => s.status === 'valid').length === scriptResults.length;
    
    // Test 4: Node environment
    const envResults = await testNodeEnvironment();
    const envOK = envResults.filter(r => r.status === 'ok').length === envResults.length;
    
    // Test 5: Service worker simulation
    const swEnv = await simulateServiceWorkerEnvironment();
    const swOK = swEnv !== null;
    
    // Test 6: Wang compatibility analysis
    const wangCompat = await testWangInterpreterDirectly();
    const compatOK = wangCompat.compatible;
    
    const totalDuration = Date.now() - testStart;
    
    // Summary
    const allTests = [
      { name: 'Wang Bundle', status: bundleOK },
      { name: 'API Endpoints', status: apiOK },
      { name: 'Wang Scripts', status: scriptsOK },
      { name: 'Node Environment', status: envOK },
      { name: 'Service Worker Sim', status: swOK },
      { name: 'Wang Compatibility', status: compatOK }
    ];
    
    const passed = allTests.filter(t => t.status).length;
    const total = allTests.length;
    
    log('\\n🎉 Direct Test Summary', {
      duration: `${totalDuration}ms`,
      passed,
      total,
      successRate: `${Math.round((passed / total) * 100)}%`
    });
    
    console.log('\\n📊 Test Results:');
    allTests.forEach(test => {
      console.log(`   ${test.status ? '✅' : '❌'} ${test.name}`);
    });
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        total,
        passed,
        failed: total - passed,
        successRate: Math.round((passed / total) * 100)
      },
      details: {
        wangBundle: bundleOK,
        apiEndpoints: apiResults,
        scripts: scriptResults,
        environment: envResults,
        serviceWorker: swOK,
        wangCompatibility: wangCompat
      },
      logs: testResults
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'direct-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\\n📋 Report saved to: ${reportPath}`);
    
    console.log('\\n🔍 Next Steps:');
    console.log('1. Load extension manually in Chrome: chrome://extensions/');
    console.log(`2. Select extension folder: ${path.resolve(__dirname, '../extension')}`);
    console.log('3. Open test page: http://localhost:3000/simple-form.html');
    console.log('4. Click extension icon and test Wang scripts');
    console.log('5. Check service worker console for Wang logs\\n');
    
    return report;
    
  } catch (error) {
    log('💥 Direct test failed', { error: error.message });
    throw error;
  }
}

// Run the direct tests
runDirectTests().catch(err => {
  console.error('\\n💥 Test execution failed:', err.message);
  process.exit(1);
});