/**
 * Wang Service Worker - Background script that runs Wang interpreter
 * This runs Wang code in a CSP-safe Chrome service worker environment
 */

// Import Wang interpreter from the built browser bundle
// Note: In a real setup, you'd copy the dist/browser files to the extension
importScripts('../../../dist/browser/wang.min.js');

// Global Wang interpreter instance
let wangInterpreter;
let executionHistory = [];
let currentExecution = null;

// Initialize Wang interpreter with service worker specific functions
function initializeWang() {
  const { WangInterpreter, PausableWangInterpreter, InMemoryModuleResolver } = globalThis.Wang;
  
  wangInterpreter = new PausableWangInterpreter({
    moduleResolver: new InMemoryModuleResolver(),
    functions: {
      // Console functions with message passing
      log: (...args) => {
        console.log('[Wang]', ...args);
        broadcastMessage('wang_log', { type: 'log', args, timestamp: Date.now() });
      },
      error: (...args) => {
        console.error('[Wang]', ...args);
        broadcastMessage('wang_log', { type: 'error', args, timestamp: Date.now() });
      },
      warn: (...args) => {
        console.warn('[Wang]', ...args);
        broadcastMessage('wang_log', { type: 'warn', args, timestamp: Date.now() });
      },
      
      // Chrome APIs available in service worker
      sendMessage: chrome.runtime.sendMessage,
      
      // Storage operations
      store: async (key, value) => {
        await chrome.storage.local.set({ [key]: value });
        return value;
      },
      retrieve: async (key) => {
        const result = await chrome.storage.local.get(key);
        return result[key];
      },
      clearStorage: async () => {
        await chrome.storage.local.clear();
      },
      
      // Tab operations
      createTab: async (url) => {
        return await chrome.tabs.create({ url });
      },
      getCurrentTab: async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
      },
      
      // Network operations
      apiCall: async (url, options = {}) => {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          ...options
        });
        return await response.json();
      },
      
      // Timing functions
      wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
      
      // Schedule tasks using Chrome alarms
      scheduleTask: async (name, delayInMinutes, taskCode) => {
        await chrome.alarms.create(name, { delayInMinutes });
        await chrome.storage.local.set({ [`task_${name}`]: taskCode });
      },
      
      // Content script communication
      executeInPage: async (code) => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error('No active tab found');
        
        return await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (codeToExecute) => {
            return eval(codeToExecute);
          },
          args: [code]
        });
      },
      
      // DOM operations via content script
      querySelector: async (selector) => {
        return await sendToContentScript('querySelector', { selector });
      },
      querySelectorAll: async (selector) => {
        return await sendToContentScript('querySelectorAll', { selector });
      },
      click: async (selector) => {
        return await sendToContentScript('click', { selector });
      },
      type: async (selector, text) => {
        return await sendToContentScript('type', { selector, text });
      },
      
      // Utility functions
      generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: () => new Date().toISOString(),
    }
  });
  
  console.log('[Wang] Interpreter initialized in service worker');
}

// Send message to content script
async function sendToContentScript(action, data) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found');
  
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { action, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Broadcast message to all connected clients (popup, content scripts)
function broadcastMessage(type, data) {
  // Store in execution history for later retrieval
  if (currentExecution) {
    currentExecution.logs.push({ type, data, timestamp: Date.now() });
  }
  
  // Try to send to popup if connected
  chrome.runtime.sendMessage({ type, data }).catch(() => {
    // Popup not connected, ignore
  });
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep message channel open for async responses
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'execute_wang':
        await executeWangCode(message.code, sendResponse);
        break;
        
      case 'pause_wang':
        if (wangInterpreter && wangInterpreter.isRunning()) {
          wangInterpreter.pause();
          sendResponse({ success: true, message: 'Execution paused' });
        } else {
          sendResponse({ success: false, error: 'No execution in progress' });
        }
        break;
        
      case 'resume_wang':
        if (wangInterpreter && wangInterpreter.isPaused()) {
          const result = await wangInterpreter.resume();
          sendResponse({ success: true, result });
        } else {
          sendResponse({ success: false, error: 'No paused execution found' });
        }
        break;
        
      case 'get_state':
        if (wangInterpreter) {
          const state = {
            executionState: wangInterpreter.getExecutionState(),
            variables: wangInterpreter.getCurrentVariables(),
            callStack: wangInterpreter.getCallStackTrace()
          };
          sendResponse({ success: true, state });
        } else {
          sendResponse({ success: false, error: 'Interpreter not initialized' });
        }
        break;
        
      case 'get_history':
        sendResponse({ success: true, history: executionHistory });
        break;
        
      case 'clear_history':
        executionHistory = [];
        sendResponse({ success: true });
        break;
        
      case 'load_script':
        await loadWangScript(message.scriptName, sendResponse);
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('[Wang] Error handling message:', error);
    sendResponse({ success: false, error: error.message, stack: error.stack });
  }
}

// Execute Wang code
async function executeWangCode(code, sendResponse) {
  if (!wangInterpreter) {
    initializeWang();
  }
  
  const executionId = Date.now().toString(36);
  currentExecution = {
    id: executionId,
    code,
    startTime: Date.now(),
    logs: [],
    status: 'running'
  };
  
  try {
    console.log('[Wang] Executing code:', code);
    broadcastMessage('execution_started', { id: executionId, code });
    
    const result = await wangInterpreter.execute(code);
    
    currentExecution.status = 'completed';
    currentExecution.result = result;
    currentExecution.endTime = Date.now();
    currentExecution.duration = currentExecution.endTime - currentExecution.startTime;
    
    // Add to history
    executionHistory.unshift({ ...currentExecution });
    if (executionHistory.length > 50) {
      executionHistory = executionHistory.slice(0, 50); // Keep last 50 executions
    }
    
    console.log('[Wang] Execution completed:', result);
    broadcastMessage('execution_completed', { 
      id: executionId, 
      result, 
      duration: currentExecution.duration 
    });
    
    sendResponse({ 
      success: true, 
      result, 
      executionId, 
      duration: currentExecution.duration,
      logs: currentExecution.logs
    });
    
  } catch (error) {
    currentExecution.status = 'error';
    currentExecution.error = error.message;
    currentExecution.stack = error.stack;
    currentExecution.endTime = Date.now();
    currentExecution.duration = currentExecution.endTime - currentExecution.startTime;
    
    // Add to history
    executionHistory.unshift({ ...currentExecution });
    if (executionHistory.length > 50) {
      executionHistory = executionHistory.slice(0, 50);
    }
    
    console.error('[Wang] Execution error:', error);
    broadcastMessage('execution_error', { 
      id: executionId, 
      error: error.message, 
      stack: error.stack 
    });
    
    sendResponse({ 
      success: false, 
      error: error.message, 
      stack: error.stack,
      executionId,
      duration: currentExecution.duration,
      logs: currentExecution.logs
    });
  } finally {
    currentExecution = null;
  }
}

// Load predefined Wang script
async function loadWangScript(scriptName, sendResponse) {
  try {
    const scriptUrl = chrome.runtime.getURL(`wang-scripts/${scriptName}`);
    const response = await fetch(scriptUrl);
    const code = await response.text();
    
    sendResponse({ success: true, code });
  } catch (error) {
    console.error('[Wang] Error loading script:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle scheduled tasks (Chrome alarms)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    const result = await chrome.storage.local.get(`task_${alarm.name}`);
    const taskCode = result[`task_${alarm.name}`];
    
    if (taskCode) {
      console.log(`[Wang] Executing scheduled task: ${alarm.name}`);
      await executeWangCode(taskCode, () => {});
    }
  } catch (error) {
    console.error('[Wang] Error executing scheduled task:', error);
  }
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[Wang] Service worker starting up');
  initializeWang();
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Wang] Extension installed, initializing...');
  initializeWang();
});

console.log('[Wang] Background script loaded');