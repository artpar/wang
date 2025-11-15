/**
 * Wang Test Environment - Popup interface
 * Provides a code editor and execution controls for testing Wang in service worker
 */

class WangTestPopup {
  constructor() {
    this.currentExecution = null;
    this.connectionStatus = 'disconnected';
    this.init();
  }
  
  init() {
    this.bindElements();
    this.bindEvents();
    this.setupMessageListener();
    this.loadInitialState();
    this.connectToServiceWorker();
  }
  
  bindElements() {
    // Buttons
    this.runBtn = document.getElementById('run-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.resumeBtn = document.getElementById('resume-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.loadScriptBtn = document.getElementById('load-script-btn');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');
    
    // UI elements
    this.codeEditor = document.getElementById('code-editor');
    this.scriptSelector = document.getElementById('script-selector');
    this.status = document.getElementById('status');
    this.runSpinner = document.getElementById('run-spinner');
    
    // Output areas
    this.consoleOutput = document.getElementById('console-output');
    this.variablesDisplay = document.getElementById('variables-display');
    this.callstackDisplay = document.getElementById('callstack-display');
    this.executionStateDisplay = document.getElementById('execution-state-display');
    this.historyOutput = document.getElementById('history-output');
    
    // Info displays
    this.executionTime = document.getElementById('execution-time');
    this.executionStatus = document.getElementById('execution-status');
    
    // Tabs
    this.tabs = document.querySelectorAll('.tab');
    this.tabContents = document.querySelectorAll('.tab-content');
  }
  
  bindEvents() {
    this.runBtn.addEventListener('click', () => this.executeCode());
    this.pauseBtn.addEventListener('click', () => this.pauseExecution());
    this.resumeBtn.addEventListener('click', () => this.resumeExecution());
    this.clearBtn.addEventListener('click', () => this.clearOutput());
    this.loadScriptBtn.addEventListener('click', () => this.loadScript());
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    
    // Tab switching
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Auto-save code in local storage
    this.codeEditor.addEventListener('input', () => {
      localStorage.setItem('wang_test_code', this.codeEditor.value);
    });
    
    // Keyboard shortcuts
    this.codeEditor.addEventListener('keydown', (e) => {
      // Ctrl+Enter or Cmd+Enter to execute
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.executeCode();
      }
      
      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.codeEditor.selectionStart;
        const end = this.codeEditor.selectionEnd;
        this.codeEditor.value = 
          this.codeEditor.value.substring(0, start) + 
          '  ' + 
          this.codeEditor.value.substring(end);
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + 2;
      }
    });
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleServiceWorkerMessage(message);
    });
  }
  
  handleServiceWorkerMessage(message) {
    switch (message.type) {
      case 'wang_log':
        this.addLogEntry(message.data);
        break;
      case 'execution_started':
        this.onExecutionStarted(message.data);
        break;
      case 'execution_completed':
        this.onExecutionCompleted(message.data);
        break;
      case 'execution_error':
        this.onExecutionError(message.data);
        break;
    }
  }
  
  async connectToServiceWorker() {
    try {
      // Test connection by requesting state
      const response = await this.sendMessage({ type: 'get_state' });
      if (response.success) {
        this.connectionStatus = 'connected';
        this.updateStatus('Ready', 'ready');
      }
    } catch (error) {
      this.connectionStatus = 'error';
      this.updateStatus('SW Error', 'error');
      console.error('Failed to connect to service worker:', error);
    }
  }
  
  async loadInitialState() {
    // Load saved code
    const savedCode = localStorage.getItem('wang_test_code');
    if (savedCode) {
      this.codeEditor.value = savedCode;
    }
    
    // Load execution history
    await this.refreshHistory();
    await this.refreshState();
  }
  
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  async executeCode() {
    const code = this.codeEditor.value.trim();
    if (!code) {
      this.addLogEntry({
        type: 'error',
        args: ['No code to execute'],
        timestamp: Date.now()
      });
      return;
    }
    
    try {
      this.setExecuting(true);
      this.clearOutput();
      this.addLogEntry({
        type: 'log',
        args: ['Executing code...'],
        timestamp: Date.now()
      });
      
      const startTime = Date.now();
      const response = await this.sendMessage({
        type: 'execute_wang',
        code
      });
      
      const duration = Date.now() - startTime;
      this.updateExecutionInfo(duration, response.success ? 'completed' : 'error');
      
      if (response.success) {
        if (response.result !== undefined) {
          this.addLogEntry({
            type: 'result',
            args: ['Result:', response.result],
            timestamp: Date.now()
          });
        }
        this.updateStatus('Completed', 'ready');
      } else {
        this.addLogEntry({
          type: 'error',
          args: ['Error:', response.error],
          timestamp: Date.now()
        });
        if (response.stack) {
          this.addLogEntry({
            type: 'error',
            args: [response.stack],
            timestamp: Date.now()
          });
        }
        this.updateStatus('Error', 'error');
      }
      
      // Show any logs from execution
      if (response.logs) {
        response.logs.forEach(log => this.addLogEntry(log.data));
      }
      
    } catch (error) {
      this.addLogEntry({
        type: 'error',
        args: ['Communication error:', error.message],
        timestamp: Date.now()
      });
      this.updateStatus('Comm Error', 'error');
    } finally {
      this.setExecuting(false);
    }
    
    // Refresh state and history
    await this.refreshState();
    await this.refreshHistory();
  }
  
  async pauseExecution() {
    try {
      const response = await this.sendMessage({ type: 'pause_wang' });
      if (response.success) {
        this.updateStatus('Paused', 'paused');
        this.pauseBtn.disabled = true;
        this.resumeBtn.disabled = false;
      }
    } catch (error) {
      console.error('Failed to pause execution:', error);
    }
  }
  
  async resumeExecution() {
    try {
      const response = await this.sendMessage({ type: 'resume_wang' });
      if (response.success) {
        this.updateStatus('Running', 'running');
        this.pauseBtn.disabled = false;
        this.resumeBtn.disabled = true;
      }
    } catch (error) {
      console.error('Failed to resume execution:', error);
    }
  }
  
  async loadScript() {
    const scriptName = this.scriptSelector.value;
    if (!scriptName) return;
    
    try {
      const response = await this.sendMessage({
        type: 'load_script',
        scriptName
      });
      
      if (response.success) {
        this.codeEditor.value = response.code;
        localStorage.setItem('wang_test_code', response.code);
        this.addLogEntry({
          type: 'log',
          args: [`Loaded script: ${scriptName}`],
          timestamp: Date.now()
        });
      } else {
        this.addLogEntry({
          type: 'error',
          args: [`Failed to load script: ${response.error}`],
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.addLogEntry({
        type: 'error',
        args: [`Error loading script: ${error.message}`],
        timestamp: Date.now()
      });
    }
  }
  
  clearOutput() {
    this.consoleOutput.innerHTML = '';
    this.updateExecutionInfo('', '');
  }
  
  async clearHistory() {
    try {
      await this.sendMessage({ type: 'clear_history' });
      this.historyOutput.innerHTML = '';
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }
  
  async refreshState() {
    try {
      const response = await this.sendMessage({ type: 'get_state' });
      if (response.success) {
        const { state } = response;
        this.variablesDisplay.textContent = JSON.stringify(state.variables || {}, null, 2);
        this.callstackDisplay.textContent = JSON.stringify(state.callStack || [], null, 2);
        this.executionStateDisplay.textContent = JSON.stringify(state.executionState || {}, null, 2);
        
        // Update button states based on execution state
        if (state.executionState) {
          const execState = state.executionState;
          if (execState.type === 'running') {
            this.pauseBtn.disabled = false;
            this.resumeBtn.disabled = true;
          } else if (execState.type === 'paused') {
            this.pauseBtn.disabled = true;
            this.resumeBtn.disabled = false;
          } else {
            this.pauseBtn.disabled = true;
            this.resumeBtn.disabled = true;
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh state:', error);
    }
  }
  
  async refreshHistory() {
    try {
      const response = await this.sendMessage({ type: 'get_history' });
      if (response.success) {
        this.displayHistory(response.history);
      }
    } catch (error) {
      console.error('Failed to refresh history:', error);
    }
  }
  
  displayHistory(history) {
    this.historyOutput.innerHTML = '';
    
    history.forEach((execution, index) => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      
      const timestamp = new Date(execution.startTime).toLocaleTimeString();
      const duration = execution.duration ? `${execution.duration}ms` : 'N/A';
      const status = execution.status || 'unknown';
      
      let preview = execution.code.substring(0, 50);
      if (execution.code.length > 50) preview += '...';
      
      entry.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #4fc1ff;">#${history.length - index}</span>
          <span style="color: #888; font-size: 11px;">${timestamp} • ${duration}</span>
        </div>
        <div style="margin-bottom: 4px; color: #cccccc;">${preview}</div>
        <div style="color: ${this.getStatusColor(status)}; font-size: 11px;">
          Status: ${status}
          ${execution.result !== undefined ? ` • Result: ${JSON.stringify(execution.result)}` : ''}
          ${execution.error ? ` • Error: ${execution.error}` : ''}
        </div>
      `;
      
      entry.style.marginBottom = '10px';
      entry.style.padding = '8px';
      entry.style.background = '#252526';
      entry.style.borderRadius = '4px';
      entry.style.border = '1px solid #3e3e42';
      entry.style.cursor = 'pointer';
      
      entry.addEventListener('click', () => {
        this.codeEditor.value = execution.code;
        localStorage.setItem('wang_test_code', execution.code);
      });
      
      this.historyOutput.appendChild(entry);
    });
  }
  
  getStatusColor(status) {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'error': return '#f48771';
      case 'running': return '#f9a825';
      case 'paused': return '#ed6c02';
      default: return '#888';
    }
  }
  
  addLogEntry(data) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${data.type}`;
    
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'log-timestamp';
    timestampSpan.textContent = timestamp;
    
    const content = data.args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');
    
    entry.appendChild(timestampSpan);
    entry.appendChild(document.createTextNode(content));
    
    this.consoleOutput.appendChild(entry);
    this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
  }
  
  setExecuting(isExecuting) {
    this.runBtn.disabled = isExecuting;
    this.runSpinner.classList.toggle('active', isExecuting);
    
    if (isExecuting) {
      this.updateStatus('Running', 'running');
      this.pauseBtn.disabled = false;
    } else {
      this.pauseBtn.disabled = true;
      this.resumeBtn.disabled = true;
    }
  }
  
  updateStatus(text, type) {
    this.status.textContent = text;
    this.status.className = `status ${type}`;
  }
  
  updateExecutionInfo(duration, status) {
    this.executionTime.textContent = duration ? `${duration}ms` : '';
    this.executionStatus.textContent = status || '';
  }
  
  switchTab(tabName) {
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Refresh data when switching to state tab
    if (tabName === 'state') {
      this.refreshState();
    } else if (tabName === 'history') {
      this.refreshHistory();
    }
  }
  
  onExecutionStarted(data) {
    this.currentExecution = data;
    this.setExecuting(true);
  }
  
  onExecutionCompleted(data) {
    this.setExecuting(false);
    this.updateStatus('Completed', 'ready');
    this.updateExecutionInfo(data.duration, 'completed');
  }
  
  onExecutionError(data) {
    this.setExecuting(false);
    this.updateStatus('Error', 'error');
    this.addLogEntry({
      type: 'error',
      args: ['Execution error:', data.error],
      timestamp: Date.now()
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WangTestPopup();
});