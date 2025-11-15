#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const config = {
  serverPort: 3000,
  extensionPath: path.resolve(__dirname, '../extension'),
  serverPath: path.resolve(__dirname, '../server'),
  distPath: path.resolve(__dirname, '../../../dist'),
  testTimeout: 30000,
  scriptTimeout: 15000
};

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
const sessionDir = path.join(logsDir, sessionId);

// Ensure directories exist
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

// Create log streams
const logs = {
  all: fs.createWriteStream(path.join(sessionDir, 'all.log'), { flags: 'a' }),
  console: fs.createWriteStream(path.join(sessionDir, 'console.log'), { flags: 'a' }),
  network: fs.createWriteStream(path.join(sessionDir, 'network.log'), { flags: 'a' }),
  errors: fs.createWriteStream(path.join(sessionDir, 'errors.log'), { flags: 'a' }),
  test: fs.createWriteStream(path.join(sessionDir, 'test-results.log'), { flags: 'a' }),
  performance: fs.createWriteStream(path.join(sessionDir, 'performance.log'), { flags: 'a' })
};

// Test results tracking
const testResults = {
  sessionId,
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  performance: {
    totalDuration: 0,
    averageExecutionTime: 0,
    slowestTest: null,
    fastestTest: null
  }
};

function writeLog(category, data) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    category,
    ...data
  }) + '\\n';

  logs[category]?.write(entry);
  logs.all.write(entry);
}

function logTest(message, data = {}) {
  const testEntry = {
    timestamp: new Date().toISOString(),
    message,
    ...data
  };
  
  writeLog('test', testEntry);
  console.log(`📋 ${message}`);
  
  return testEntry;
}

async function buildWang() {
  console.log('🔨 Building Wang distribution...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: path.resolve(__dirname, '../../..'),
      stdio: 'pipe'
    });

    let output = '';
    buildProcess.stdout.on('data', (data) => {
      output += data.toString();
      writeLog('console', { source: 'build', message: data.toString().trim() });
    });

    buildProcess.stderr.on('data', (data) => {
      writeLog('errors', { source: 'build', message: data.toString().trim() });
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Wang build completed');
        resolve(output);
      } else {
        console.error('❌ Wang build failed');
        reject(new Error(`Build process exited with code ${code}`));
      }
    });
  });
}

async function copyWangFiles() {
  console.log('📁 Copying Wang files to extension...');
  
  const sourcePath = path.join(config.distPath, 'browser', 'wang.min.js');
  const targetPath = path.join(config.extensionPath, 'wang.min.js');
  
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Wang browser bundle not found at ${sourcePath}`);
  }
  
  fs.copyFileSync(sourcePath, targetPath);
  console.log('✅ Wang files copied to extension');
}

async function startTestServer() {
  console.log('🚀 Starting test server...');
  
  return new Promise((resolve, reject) => {
    // Install dependencies first
    const installProcess = spawn('npm', ['install'], {
      cwd: config.serverPath,
      stdio: 'pipe'
    });

    installProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to install server dependencies'));
        return;
      }

      // Start server
      const serverProcess = spawn('node', ['test-server.js'], {
        cwd: config.serverPath,
        stdio: 'pipe'
      });

      let serverReady = false;
      
      serverProcess.stdout.on('data', (data) => {
        const message = data.toString();
        writeLog('console', { source: 'test-server', message: message.trim() });
        
        if (message.includes('running on') || message.includes('localhost:3000')) {
          if (!serverReady) {
            serverReady = true;
            console.log('✅ Test server started on port 3000');
            resolve(serverProcess);
          }
        }
      });

      serverProcess.stderr.on('data', (data) => {
        writeLog('errors', { source: 'test-server', message: data.toString().trim() });
      });

      serverProcess.on('close', (code) => {
        if (!serverReady) {
          reject(new Error(`Server process exited with code ${code}`));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server failed to start within timeout'));
        }
      }, 10000);
    });
  });
}

async function launchChrome() {
  console.log('🌐 Launching Chrome with extension...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: [
      `--disable-extensions-except=${config.extensionPath}`,
      `--load-extension=${config.extensionPath}`,
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--enable-logging',
      '--v=1'
    ],
    debuggingPort: 9222
  });

  console.log('✅ Chrome launched with extension');
  return browser;
}

async function setupPageLogging(page, pageType) {
  const client = await page.target().createCDPSession();

  await client.send('Runtime.enable');
  await client.send('Network.enable');
  await client.send('Console.enable');

  // Console API calls
  client.on('Runtime.consoleAPICalled', (params) => {
    const args = params.args.map(arg => arg.value || arg.description || '[object]').join(' ');
    
    writeLog('console', {
      source: pageType,
      level: params.type,
      message: args,
      stackTrace: params.stackTrace,
      url: page.url()
    });

    console.log(`[${pageType}] ${params.type}: ${args}`);
  });

  // JavaScript exceptions
  client.on('Runtime.exceptionThrown', (params) => {
    const error = params.exceptionDetails.exception?.description || 'Unknown error';
    
    writeLog('errors', {
      source: pageType,
      error: error,
      url: page.url(),
      details: params.exceptionDetails
    });
    
    console.error(`[${pageType}] Exception: ${error}`);
  });

  // Network requests
  client.on('Network.requestWillBeSent', (params) => {
    writeLog('network', {
      source: pageType,
      type: 'request',
      url: params.request.url,
      method: params.request.method
    });
  });

  client.on('Network.responseReceived', (params) => {
    writeLog('network', {
      source: pageType,
      type: 'response',
      url: params.response.url,
      status: params.response.status
    });
  });
}

async function findExtensionId(browser) {
  const targets = await browser.targets();
  const extensionTarget = targets.find(t => 
    t.url().startsWith('chrome-extension://') && 
    t.url().includes('popup.html')
  );
  
  if (extensionTarget) {
    const extensionId = extensionTarget.url().split('/')[2];
    console.log(`📌 Found extension ID: ${extensionId}`);
    return extensionId;
  }
  
  throw new Error('Extension not found');
}

async function openExtensionPopup(browser, extensionId) {
  console.log('🔧 Opening extension popup...');
  
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const popup = await browser.newPage();
  
  await setupPageLogging(popup, 'extension-popup');
  await popup.goto(popupUrl);
  
  // Wait for popup to load
  await popup.waitForSelector('#code-editor', { timeout: 5000 });
  console.log('✅ Extension popup opened');
  
  return popup;
}

async function executeWangScript(popup, scriptName) {
  const testStart = Date.now();
  console.log(`🧪 Testing script: ${scriptName}`);
  
  try {
    // Select the script from dropdown
    await popup.select('#script-selector', scriptName);
    
    // Click load button
    await popup.click('#load-script-btn');
    
    // Wait for script to load
    await popup.waitForTimeout(1000);
    
    // Click run button
    await popup.click('#run-btn');
    
    // Wait for execution to complete (check status)
    await popup.waitForFunction(
      () => {
        const status = document.querySelector('#status').textContent;
        return status === 'Completed' || status === 'Error';
      },
      { timeout: config.scriptTimeout }
    );
    
    // Get final status
    const status = await popup.$eval('#status', el => el.textContent);
    const duration = Date.now() - testStart;
    
    // Get console output
    const consoleOutput = await popup.$eval('#console-output', el => el.textContent);
    
    const testResult = {
      script: scriptName,
      status: status === 'Completed' ? 'passed' : 'failed',
      duration,
      output: consoleOutput,
      timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(testResult);
    
    if (status === 'Completed') {
      testResults.summary.passed++;
      console.log(`✅ ${scriptName} - PASSED (${duration}ms)`);
    } else {
      testResults.summary.failed++;
      console.error(`❌ ${scriptName} - FAILED (${duration}ms)`);
    }
    
    logTest(`Script execution: ${scriptName}`, testResult);
    
    return testResult;
    
  } catch (error) {
    const duration = Date.now() - testStart;
    const testResult = {
      script: scriptName,
      status: 'failed',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(testResult);
    testResults.summary.failed++;
    
    console.error(`❌ ${scriptName} - FAILED: ${error.message}`);
    logTest(`Script execution failed: ${scriptName}`, testResult);
    
    return testResult;
  }
}

async function testDOMInteraction(browser) {
  console.log('🌐 Testing DOM interaction...');
  
  const testPage = await browser.newPage();
  await setupPageLogging(testPage, 'test-page');
  
  try {
    await testPage.goto(`http://localhost:${config.serverPort}/simple-form.html`);
    await testPage.waitForSelector('#test-form', { timeout: 5000 });
    
    console.log('✅ Test page loaded successfully');
    return testPage;
    
  } catch (error) {
    console.error('❌ Failed to load test page:', error.message);
    testResults.summary.failed++;
    return null;
  }
}

async function monitorServiceWorker(browser) {
  console.log('👁️ Monitoring service worker...');
  
  const targets = await browser.targets();
  const serviceWorkerTarget = targets.find(t => t.type() === 'service_worker');
  
  if (serviceWorkerTarget) {
    try {
      const cdp = await serviceWorkerTarget.createCDPSession();
      await cdp.send('Runtime.enable');
      await cdp.send('Console.enable');

      cdp.on('Runtime.consoleAPICalled', (params) => {
        const args = params.args.map(arg => arg.value || arg.description || '[object]').join(' ');
        
        writeLog('console', {
          source: 'service-worker',
          level: params.type,
          message: args,
          url: serviceWorkerTarget.url()
        });

        console.log(`[service-worker] ${params.type}: ${args}`);
      });

      cdp.on('Runtime.exceptionThrown', (params) => {
        const error = params.exceptionDetails.exception?.description || 'Unknown error';
        
        writeLog('errors', {
          source: 'service-worker',
          error: error,
          details: params.exceptionDetails
        });
        
        console.error(`[service-worker] Exception: ${error}`);
      });

      console.log('✅ Service worker monitoring active');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to monitor service worker:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ No service worker found');
    return false;
  }
}

async function generateTestReport() {
  testResults.endTime = new Date().toISOString();
  testResults.summary.total = testResults.tests.length;
  
  if (testResults.tests.length > 0) {
    const durations = testResults.tests.map(t => t.duration);
    testResults.performance.totalDuration = durations.reduce((a, b) => a + b, 0);
    testResults.performance.averageExecutionTime = Math.round(testResults.performance.totalDuration / testResults.tests.length);
    
    const sortedDurations = [...durations].sort((a, b) => a - b);
    testResults.performance.fastestTest = testResults.tests.find(t => t.duration === sortedDurations[0]);
    testResults.performance.slowestTest = testResults.tests.find(t => t.duration === sortedDurations[sortedDurations.length - 1]);
  }
  
  // Write detailed report
  const reportPath = path.join(sessionDir, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // Write summary report
  const summaryPath = path.join(sessionDir, 'summary.md');
  const summaryContent = `# Wang Service Worker Test Results

## Session: ${testResults.sessionId}
**Started:** ${testResults.startTime}  
**Completed:** ${testResults.endTime}

## Summary
- **Total Tests:** ${testResults.summary.total}
- **Passed:** ${testResults.summary.passed} ✅
- **Failed:** ${testResults.summary.failed} ${testResults.summary.failed > 0 ? '❌' : ''}
- **Success Rate:** ${testResults.summary.total > 0 ? Math.round((testResults.summary.passed / testResults.summary.total) * 100) : 0}%

## Performance
- **Total Duration:** ${testResults.performance.totalDuration}ms
- **Average Execution Time:** ${testResults.performance.averageExecutionTime}ms
- **Fastest Test:** ${testResults.performance.fastestTest?.script} (${testResults.performance.fastestTest?.duration}ms)
- **Slowest Test:** ${testResults.performance.slowestTest?.script} (${testResults.performance.slowestTest?.duration}ms)

## Test Results
${testResults.tests.map(t => `
### ${t.script}
- **Status:** ${t.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${t.duration}ms
- **Timestamp:** ${t.timestamp}
${t.error ? `- **Error:** ${t.error}` : ''}
`).join('')}

## Log Files
- All logs: \`logs/${sessionId}/all.log\`
- Console output: \`logs/${sessionId}/console.log\`
- Network activity: \`logs/${sessionId}/network.log\`
- Errors: \`logs/${sessionId}/errors.log\`
- Test results: \`logs/${sessionId}/test-results.log\`
`;

  fs.writeFileSync(summaryPath, summaryContent);
  
  console.log('\\n📊 Test Report Generated');
  console.log(`📁 Report location: ${summaryPath}`);
  console.log(`📁 Detailed data: ${reportPath}`);
  
  return { reportPath, summaryPath };
}

async function runAllTests() {
  let serverProcess = null;
  let browser = null;
  
  try {
    console.log('🚀 Starting Wang Service Worker Test Suite');
    console.log(`📁 Session ID: ${sessionId}`);
    console.log(`📁 Logs directory: ${sessionDir}\\n`);
    
    // Phase 1: Build and setup
    logTest('Starting test suite', { sessionId, phase: 'setup' });
    
    await buildWang();
    await copyWangFiles();
    serverProcess = await startTestServer();
    
    // Phase 2: Launch Chrome and load extension
    logTest('Launching Chrome with extension');
    browser = await launchChrome();
    
    // Wait for extension to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const extensionId = await findExtensionId(browser);
    const popup = await openExtensionPopup(browser, extensionId);
    
    // Phase 3: Monitor service worker
    const serviceWorkerActive = await monitorServiceWorker(browser);
    logTest('Service worker monitoring', { active: serviceWorkerActive });
    
    // Phase 4: Test DOM interaction
    const testPage = await testDOMInteraction(browser);
    if (testPage) {
      logTest('Test page loaded successfully');
    }
    
    // Phase 5: Execute all Wang scripts
    const scripts = [
      'dom-automation.wang',
      'api-calls.wang',
      'storage-ops.wang',
      'scheduled-tasks.wang'
    ];
    
    logTest('Starting script execution tests', { totalScripts: scripts.length });
    
    for (const script of scripts) {
      await executeWangScript(popup, script);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Phase 6: Generate report
    const { summaryPath } = await generateTestReport();
    
    console.log('\\n🎉 Test Suite Completed!');
    console.log(`✅ ${testResults.summary.passed} passed`);
    console.log(`❌ ${testResults.summary.failed} failed`);
    console.log(`📊 ${testResults.summary.total > 0 ? Math.round((testResults.summary.passed / testResults.summary.total) * 100) : 0}% success rate`);
    console.log(`⏱️  Average execution time: ${testResults.performance.averageExecutionTime}ms\\n`);
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser left open for manual inspection');
    console.log('Press Ctrl+C to close everything\\n');
    
    // Wait for manual termination
    await new Promise(() => {});
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    logTest('Test suite failed', { error: error.message, stack: error.stack });
    
    await generateTestReport();
    
  } finally {
    // Cleanup
    process.on('SIGINT', async () => {
      console.log('\\n🛑 Shutting down...');
      
      if (browser) {
        await browser.close();
      }
      
      if (serverProcess) {
        serverProcess.kill();
      }
      
      // Close log streams
      Object.values(logs).forEach(stream => stream.end());
      
      console.log('✅ Cleanup complete');
      process.exit(0);
    });
  }
}

// Run the test suite
runAllTests().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});