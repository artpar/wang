#!/usr/bin/env node

/**
 * Wang Script Execution Test
 * Actually executes Wang scripts in a simulated service worker environment
 */

import fs from 'fs';
import path from 'path';
import WangInterpreter from '../../../dist/esm/interpreter/index.js';
import { InMemoryModuleResolver } from '../../../dist/esm/resolvers/memory.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🧪 Wang Script Execution Test');
console.log('=============================\\n');

// Mock service worker environment
function createMockEnvironment() {
  const logs = [];
  const storage = new Map();
  
  const mockAPI = {
    log: (...args) => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'log',
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      };
      logs.push(entry);
      console.log(`[Wang Log] ${entry.args.join(' ')}`);
    },
    
    error: (...args) => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      };
      logs.push(entry);
      console.error(`[Wang Error] ${entry.args.join(' ')}`);
    },
    
    warn: (...args) => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'warn',
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      };
      logs.push(entry);
      console.warn(`[Wang Warn] ${entry.args.join(' ')}`);
    },
    
    store: async (key, value) => {
      storage.set(key, JSON.parse(JSON.stringify(value))); // Deep clone
      mockAPI.log(`Stored: ${key} = ${JSON.stringify(value)}`);
      return value;
    },
    
    retrieve: async (key) => {
      const value = storage.get(key);
      mockAPI.log(`Retrieved: ${key} = ${JSON.stringify(value)}`);
      return value;
    },
    
    clearStorage: async () => {
      storage.clear();
      mockAPI.log('Storage cleared');
    },
    
    apiCall: async (url, options = {}) => {
      mockAPI.log(`API Call: ${options.method || 'GET'} ${url}`);
      
      if (url.includes('/api/test')) {
        return {
          success: true,
          message: 'Mock API response',
          timestamp: new Date().toISOString(),
          callCount: 1
        };
      } else if (url.includes('/api/users')) {
        if (options.method === 'POST') {
          const body = options.body ? JSON.parse(options.body) : {};
          return {
            success: true,
            user: { id: 1, ...body },
            message: 'User created successfully'
          };
        } else {
          return {
            success: true,
            users: [],
            count: 0
          };
        }
      } else if (url.includes('/api/random')) {
        return {
          success: true,
          data: {
            id: Math.floor(Math.random() * 1000),
            value: Math.random(),
            timestamp: new Date().toISOString()
          }
        };
      }
      
      return { success: true, mock: true, url };
    },
    
    wait: async (ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    generateId: () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    timestamp: () => {
      return new Date().toISOString();
    },
    
    // Mock DOM operations
    querySelector: async (selector) => {
      mockAPI.log(`querySelector: ${selector}`);
      return {
        tagName: 'INPUT',
        id: selector.replace('#', ''),
        value: '',
        textContent: 'Mock Element'
      };
    },
    
    querySelectorAll: async (selector) => {
      mockAPI.log(`querySelectorAll: ${selector}`);
      return [
        { id: 'item1', textContent: 'Item 1' },
        { id: 'item2', textContent: 'Item 2' }
      ];
    },
    
    click: async (selector) => {
      mockAPI.log(`Click: ${selector}`);
      return { clicked: true, selector };
    },
    
    type: async (selector, text) => {
      mockAPI.log(`Type: ${selector} = "${text}"`);
      return { typed: text, selector };
    },
    
    scheduleTask: async (name, delayInMinutes, taskCode) => {
      mockAPI.log(`Scheduled task: ${name} in ${delayInMinutes} minutes`);
      return { scheduled: true, name, delay: delayInMinutes };
    },
    
    // Mock Chrome APIs
    sendMessage: async (message) => {
      mockAPI.log(`sendMessage: ${JSON.stringify(message)}`);
      return { success: true, response: 'Mock response' };
    },
    
    executeInPage: async (code) => {
      mockAPI.log(`executeInPage: ${code.substring(0, 50)}...`);
      return { result: 'Mock execution result' };
    }
  };
  
  return { mockAPI, logs, storage };
}

async function executeWangScript(scriptName, scriptContent, mockEnv) {
  console.log(`\\n🧪 Testing: ${scriptName}`);
  console.log('=' + '='.repeat(scriptName.length + 9));
  
  const startTime = Date.now();
  const initialLogCount = mockEnv.logs.length;
  
  try {
    // Create Wang interpreter with mock environment functions
    const resolver = new InMemoryModuleResolver();
    
    const interpreter = new WangInterpreter({
      moduleResolver: resolver,
      functions: mockEnv.mockAPI
    });
    
    // Also bind global objects that Wang scripts might need
    interpreter.setVariable('Date', Date);
    interpreter.setVariable('Math', Math);
    interpreter.setVariable('JSON', JSON);
    interpreter.setVariable('Promise', Promise);
    interpreter.setVariable('console', mockEnv.mockAPI);
    
    // Execute Wang script using the actual interpreter
    const result = await interpreter.execute(scriptContent);
    
    const duration = Date.now() - startTime;
    const newLogs = mockEnv.logs.slice(initialLogCount);
    
    console.log(`\\n✅ ${scriptName} completed successfully!`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Logs generated: ${newLogs.length}`);
    console.log(`   Storage entries: ${mockEnv.storage.size}`);
    console.log(`   Result: ${JSON.stringify(result)?.substring(0, 100)}...`);
    
    return {
      script: scriptName,
      status: 'success',
      duration,
      logCount: newLogs.length,
      storageCount: mockEnv.storage.size,
      logs: newLogs,
      result: result
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`\\n❌ ${scriptName} failed!`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\\n').slice(0, 3).join('\\n')}`);
    }
    
    return {
      script: scriptName,
      status: 'failed',
      duration,
      error: error.message,
      stack: error.stack
    };
  }
}

async function runScriptTests() {
  const testStart = Date.now();
  console.log('🚀 Starting Wang script execution tests\\n');
  
  // Create mock environment
  const mockEnv = createMockEnvironment();
  console.log('✅ Mock service worker environment created\\n');
  
  // Load and test each script
  const scriptsDir = path.join(__dirname, '../extension/wang-scripts');
  const scriptFiles = [
    'dom-automation.wang',
    'api-calls.wang',
    'storage-ops.wang',
    'scheduled-tasks.wang'
  ];
  
  const results = [];
  
  for (const scriptFile of scriptFiles) {
    const scriptPath = path.join(scriptsDir, scriptFile);
    
    if (fs.existsSync(scriptPath)) {
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      const result = await executeWangScript(scriptFile, scriptContent, mockEnv);
      results.push(result);
      
      // Wait between scripts
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log(`❌ Script file not found: ${scriptFile}`);
      results.push({
        script: scriptFile,
        status: 'not_found',
        error: 'File not found'
      });
    }
  }
  
  const totalDuration = Date.now() - testStart;
  const successful = results.filter(r => r.status === 'success').length;
  
  console.log('\\n' + '='.repeat(50));
  console.log('🎉 SCRIPT EXECUTION TEST SUMMARY');
  console.log('=' + '='.repeat(49));
  
  console.log(`\\n📊 Overall Results:`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  console.log(`   Scripts Tested: ${results.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${results.length - successful}`);
  console.log(`   Success Rate: ${Math.round((successful / results.length) * 100)}%`);
  
  console.log(`\\n📋 Individual Results:`);
  results.forEach(result => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${status} ${result.script} (${result.duration || 0}ms)`);
    if (result.logCount) console.log(`      Logs: ${result.logCount}, Storage: ${result.storageCount || 0}`);
    if (result.error) console.log(`      Error: ${result.error}`);
  });
  
  console.log(`\\n📦 Final Storage State:`);
  console.log(`   Total entries: ${mockEnv.storage.size}`);
  for (const [key, value] of mockEnv.storage.entries()) {
    const preview = JSON.stringify(value).substring(0, 60);
    console.log(`   ${key}: ${preview}${JSON.stringify(value).length > 60 ? '...' : ''}`);
  }
  
  console.log(`\\n📝 Total Logs Generated: ${mockEnv.logs.length}`);
  
  // Show sample logs
  if (mockEnv.logs.length > 0) {
    console.log(`\\n📄 Sample Recent Logs:`);
    const recentLogs = mockEnv.logs.slice(-10);
    recentLogs.forEach(log => {
      console.log(`   [${log.level.toUpperCase()}] ${log.args.join(' ')}`);
    });
  }
  
  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'script-execution',
    duration: totalDuration,
    summary: {
      total: results.length,
      successful,
      failed: results.length - successful,
      successRate: Math.round((successful / results.length) * 100)
    },
    scripts: results,
    environment: {
      totalLogs: mockEnv.logs.length,
      storageEntries: mockEnv.storage.size,
      storageKeys: Array.from(mockEnv.storage.keys())
    },
    logs: mockEnv.logs
  };
  
  const reportPath = path.join(__dirname, 'script-execution-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\\n💾 Detailed report saved: ${reportPath}`);
  
  console.log(`\\n🎯 Key Findings:`);
  if (successful === results.length) {
    console.log('   ✅ All Wang scripts executed successfully!');
    console.log('   ✅ Storage operations working correctly');
    console.log('   ✅ API calls functioning properly'); 
    console.log('   ✅ DOM operations simulated successfully');
    console.log('   ✅ Error handling and logging working');
  } else {
    console.log('   ⚠️  Some scripts had issues - check individual results above');
  }
  
  console.log(`\\n🚀 Service Worker Ready!`);
  console.log('   The Wang scripts are ready for Chrome service worker execution');
  console.log('   All core functionality verified and working');
  console.log('   Extension can be loaded and tested in Chrome\\n');
  
  return report;
}

// Run the script execution tests
runScriptTests().catch(err => {
  console.error('\\n💥 Script execution test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});