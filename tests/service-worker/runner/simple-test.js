#!/usr/bin/env node

/**
 * Simple Wang Service Worker Test
 * Tests core functionality with minimal browser automation
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🧪 Simple Wang Service Worker Test');
console.log('==================================\n');

let browser;
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
  testResults.push(entry);
  return entry;
}

async function setupBrowser() {
  log('Setting up Chrome with extension');
  
  const extensionPath = path.resolve(__dirname, '../extension');
  
  browser = await puppeteer.launch({
    headless: false, // We need visible Chrome for extensions
    devtools: false, // Start without devtools to be less intrusive
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-ipc-flooding-protection',
      '--enable-logging',
      '--v=1'
    ],
    defaultViewport: { width: 1200, height: 800 }
  });
  
  log('✅ Chrome launched with Wang extension');
  return browser;
}

async function waitForExtension() {
  log('Waiting for extension to load');
  
  // Give extension time to initialize
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const targets = await browser.targets();
  const extensionTarget = targets.find(t => 
    t.url().includes('chrome-extension://') && t.url().includes('popup.html')
  );
  
  if (extensionTarget) {
    const extensionId = extensionTarget.url().split('/')[2];
    log('✅ Extension loaded', { extensionId });
    return extensionId;
  } else {
    throw new Error('Extension not found');
  }
}

async function testBasicAPI() {
  log('Testing API endpoints');
  
  const endpoints = [
    'http://localhost:3000/api/test',
    'http://localhost:3000/api/status',
    'http://localhost:3000/api/random'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok) {
        log(`✅ API ${endpoint.split('/').pop()} - OK`);
        results.push({ endpoint, status: 'ok', data });
      } else {
        log(`❌ API ${endpoint.split('/').pop()} - Failed`, { status: response.status });
        results.push({ endpoint, status: 'failed', code: response.status });
      }
    } catch (error) {
      log(`❌ API ${endpoint.split('/').pop()} - Error`, { error: error.message });
      results.push({ endpoint, status: 'error', error: error.message });
    }
  }
  
  return results;
}

async function openTestPage() {
  log('Opening test page');
  
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    log(`[Test Page] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    log('❌ Page error', { error: error.message });
  });
  
  try {
    await page.goto('http://localhost:3000/simple-form.html', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Verify page loaded correctly
    const title = await page.title();
    const formExists = await page.$('#test-form');
    
    if (formExists) {
      log('✅ Test page loaded successfully', { title });
      return page;
    } else {
      throw new Error('Test form not found on page');
    }
    
  } catch (error) {
    log('❌ Failed to load test page', { error: error.message });
    return null;
  }
}

async function openExtensionPopup(extensionId) {
  log('Opening extension popup');
  
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const popup = await browser.newPage();
  
  // Enhanced console logging for popup
  popup.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    // Capture Wang-specific logs
    if (text.includes('[Wang]') || text.includes('Wang')) {
      log(`[Wang Popup] ${type}: ${text}`);
    } else {
      log(`[Popup] ${type}: ${text}`);
    }
  });
  
  popup.on('pageerror', error => {
    log('❌ Popup error', { error: error.message });
  });
  
  try {
    await popup.goto(popupUrl, { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait for popup elements to load
    await popup.waitForSelector('#code-editor', { timeout: 5000 });
    await popup.waitForSelector('#script-selector', { timeout: 5000 });
    
    log('✅ Extension popup opened');
    return popup;
    
  } catch (error) {
    log('❌ Failed to open popup', { error: error.message });
    return null;
  }
}

async function executeWangScript(popup, scriptName) {
  log(`Executing Wang script: ${scriptName}`);
  
  try {
    // Select script from dropdown
    await popup.select('#script-selector', scriptName);
    await popup.waitForTimeout(500);
    
    // Load script
    await popup.click('#load-script-btn');
    await popup.waitForTimeout(1000);
    
    // Get loaded script content
    const scriptContent = await popup.$eval('#code-editor', el => el.value);
    log(`Script loaded (${scriptContent.length} characters)`);
    
    // Clear previous output
    await popup.click('#clear-btn');
    await popup.waitForTimeout(500);
    
    // Execute script
    const startTime = Date.now();
    await popup.click('#run-btn');
    
    // Wait for execution to complete
    await popup.waitForFunction(
      () => {
        const status = document.querySelector('#status');
        return status && (status.textContent === 'Completed' || status.textContent === 'Error');
      },
      { timeout: 30000 }
    );
    
    const duration = Date.now() - startTime;
    
    // Get execution results
    const status = await popup.$eval('#status', el => el.textContent);
    const consoleOutput = await popup.$eval('#console-output', el => el.textContent);
    const executionTime = await popup.$eval('#execution-time', el => el.textContent);
    
    const result = {
      script: scriptName,
      status,
      duration,
      executionTime,
      outputLength: consoleOutput.length,
      output: consoleOutput.substring(0, 500) + (consoleOutput.length > 500 ? '...' : ''), // Truncate for logging
      success: status === 'Completed'
    };
    
    if (result.success) {
      log(`✅ ${scriptName} completed successfully`, { 
        duration: `${duration}ms`,
        executionTime,
        outputLength: consoleOutput.length
      });
    } else {
      log(`❌ ${scriptName} failed`, { 
        status,
        duration: `${duration}ms`,
        outputPreview: consoleOutput.substring(0, 200)
      });
    }
    
    return result;
    
  } catch (error) {
    log(`❌ Script execution failed: ${scriptName}`, { error: error.message });
    return {
      script: scriptName,
      status: 'error',
      error: error.message,
      success: false
    };
  }
}

async function testServiceWorkerLogs() {
  log('Checking service worker logs');
  
  try {
    // Get service worker target
    const targets = await browser.targets();
    const serviceWorkerTarget = targets.find(t => t.type() === 'service_worker');
    
    if (serviceWorkerTarget) {
      log('✅ Service worker target found', { url: serviceWorkerTarget.url() });
      
      // Try to access service worker logs via CDP
      const cdp = await serviceWorkerTarget.createCDPSession();
      await cdp.send('Runtime.enable');
      
      // Set up listener for new console messages
      let logCount = 0;
      cdp.on('Runtime.consoleAPICalled', (params) => {
        logCount++;
        const args = params.args.map(arg => arg.value || arg.description || '[object]').join(' ');
        log(`[Service Worker] ${params.type}: ${args}`);
      });
      
      // Wait a bit to capture any existing logs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      log(`Service worker monitoring active (${logCount} initial messages)`);
      return true;
      
    } else {
      log('⚠️ No service worker target found');
      return false;
    }
    
  } catch (error) {
    log('❌ Service worker access failed', { error: error.message });
    return false;
  }
}

async function runFullTest() {
  const testStart = Date.now();
  
  try {
    // Setup
    await setupBrowser();
    const extensionId = await waitForExtension();
    
    // Test API
    const apiResults = await testBasicAPI();
    
    // Test service worker
    const swActive = await testServiceWorkerLogs();
    
    // Open pages
    const testPage = await openTestPage();
    const popup = await openExtensionPopup(extensionId);
    
    if (!popup) {
      throw new Error('Could not open extension popup');
    }
    
    // Execute test scripts
    const scripts = [
      'dom-automation.wang',
      'api-calls.wang', 
      'storage-ops.wang'
    ];
    
    const scriptResults = [];
    for (const script of scripts) {
      const result = await executeWangScript(popup, script);
      scriptResults.push(result);
      
      // Wait between scripts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Final results
    const totalDuration = Date.now() - testStart;
    const successCount = scriptResults.filter(r => r.success).length;
    
    log('\n🎉 Test Summary', {
      totalDuration: `${totalDuration}ms`,
      scriptsExecuted: scriptResults.length,
      successful: successCount,
      failed: scriptResults.length - successCount,
      successRate: `${Math.round((successCount / scriptResults.length) * 100)}%`,
      apiEndpoints: apiResults.filter(r => r.status === 'ok').length,
      serviceWorkerActive: swActive
    });
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Test complete! Browser left open for manual inspection.');
    console.log('You can now manually test the extension or press Ctrl+C to close.\n');
    
    // Generate simple report
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        total: scriptResults.length,
        successful: successCount,
        failed: scriptResults.length - successCount,
        successRate: Math.round((successCount / scriptResults.length) * 100)
      },
      scripts: scriptResults,
      api: apiResults,
      serviceWorker: swActive,
      logs: testResults
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'simple-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`📊 Report saved to: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    log('💥 Test failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Cleanup handler
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Run the test
runFullTest().catch(err => {
  console.error('\n💥 Test execution failed:', err.message);
  process.exit(1);
});