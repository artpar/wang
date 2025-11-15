# Wang Service Worker Test Environment

A complete testing environment for Wang language execution in Chrome service workers, featuring real-time code editing, debugging, and automation testing.

## 🚀 Quick Start

### 1. Build Wang Distribution
```bash
cd /path/to/wang/project
npm run build
```

### 2. Copy Wang Files to Extension
```bash
# Copy the built Wang browser bundle to the extension
cp dist/browser/wang.min.js tests/service-worker/extension/
```

### 3. Start Test Server
```bash
cd tests/service-worker/server
npm install
node test-server.js
```

### 4. Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `tests/service-worker/extension` directory

### 5. Start Testing
1. Click the Wang extension icon in Chrome toolbar
2. Navigate to `http://localhost:3000/simple-form.html`
3. Write Wang code in the popup editor
4. Click "Run" to execute in service worker

## 📁 Project Structure

```
tests/service-worker/
├── extension/                    # Chrome extension for testing
│   ├── manifest.json            # Extension manifest (v3)
│   ├── background.js             # Service worker with Wang interpreter
│   ├── content-script.js         # DOM interaction bridge
│   ├── popup.html                # Code editor interface
│   ├── popup.js                  # Popup logic
│   └── wang-scripts/             # Example Wang automation scripts
│       ├── dom-automation.wang   # DOM manipulation examples
│       ├── api-calls.wang        # API interaction tests
│       ├── storage-ops.wang      # Storage operations
│       └── scheduled-tasks.wang  # Background task scheduling
├── test-pages/                   # HTML test pages
│   └── simple-form.html          # Interactive form for automation
├── server/                       # Local test server
│   └── test-server.js            # Express server with mock APIs
├── runner/                       # Automated test framework
│   ├── test-runner.js            # Test automation
│   └── results-viewer.html       # Results dashboard
└── README.md                     # This file
```

## 🎯 Features

### Service Worker Execution
- **CSP-Safe**: Wang runs without eval() in restricted environments
- **Background Processing**: Execute automation scripts even when pages are closed
- **Persistent Storage**: Chrome storage APIs for data persistence
- **Scheduled Tasks**: Chrome alarms for background task execution

### Interactive Development
- **Live Code Editor**: Write and test Wang code in real-time
- **Syntax Highlighting**: Basic syntax support in editor
- **Execution Controls**: Run, pause, resume, and debug scripts
- **State Inspection**: View variables, call stack, and execution state

### Debugging & Monitoring
- **Real-time Logs**: Console output streaming from service worker
- **Error Handling**: Comprehensive error reporting with stack traces
- **Execution History**: Track all script executions with timing
- **Performance Monitoring**: Execution time and operation counts

### DOM Automation
- **Cross-Context DOM**: Service worker can interact with page DOM
- **Element Selection**: querySelector/querySelectorAll from service worker
- **Form Interaction**: Type, click, and manipulate form elements
- **Event Simulation**: Generate clicks, keyboard input, and custom events

## 📝 Example Scripts

### DOM Automation
```javascript
// Fill a form from service worker
await type("#email", "test@example.com")
await type("#password", "secretpassword")
await click("#login-button")

// Wait for elements
let result = await waitFor(".success-message", 5000)
log("Login successful:", result)
```

### API Calls
```javascript
// Make API calls from service worker
let userData = await apiCall("http://localhost:3000/api/users")
log("Users:", userData)

// POST data
let newUser = await apiCall("/api/users", {
  method: "POST",
  body: JSON.stringify({ name: "Wang User" })
})
```

### Storage Operations
```javascript
// Store and retrieve data
await store("user_preferences", { theme: "dark", lang: "en" })
let prefs = await retrieve("user_preferences")
log("Preferences:", prefs)
```

### Scheduled Tasks
```javascript
// Schedule background tasks
await scheduleTask("daily_sync", 1440, `
  let data = await apiCall("/api/sync")
  await store("last_sync", data)
  log("Daily sync completed")
`)
```

## 🧪 Testing Workflow

### 1. Load Example Scripts
- Select a script from the dropdown in the popup
- Click "Load" to populate the editor
- Modify as needed for your testing

### 2. Interactive Testing
- Write Wang code in the editor
- Use Ctrl+Enter (Cmd+Enter) to execute
- View real-time output in the console tab
- Check variable state in the State tab

### 3. Automation Testing
- Navigate to test pages (`/simple-form.html`)
- Run DOM automation scripts
- Verify interactions work correctly
- Check storage for persisted data

### 4. Background Tasks
- Schedule tasks using the scheduled-tasks script
- Tasks will execute in background
- Check storage after scheduled times for results

## 🔧 Configuration

### Server Configuration
The test server runs on `http://localhost:3000` by default. Available endpoints:

- `GET /api/test` - Simple test endpoint
- `GET /api/users` - User management
- `POST /api/users` - Create user
- `GET /api/random` - Random test data
- `GET /api/delay/:seconds` - Delayed responses

### Extension Permissions
The extension requires these permissions:
- `activeTab` - Interact with current tab
- `storage` - Chrome storage access
- `alarms` - Scheduled task support
- `scripting` - Execute scripts in pages

### Wang Interpreter Configuration
The service worker initializes Wang with these functions:
- DOM operations (`querySelector`, `click`, `type`)
- Storage operations (`store`, `retrieve`)
- Network operations (`apiCall`)
- Chrome APIs (`createTab`, `sendMessage`)
- Scheduling (`scheduleTask`)

## 🐛 Debugging

### Common Issues

1. **Extension not loading**: Check console for errors, ensure wang.min.js is copied
2. **Service worker errors**: Check chrome://extensions/ developer tools
3. **API calls failing**: Ensure test server is running on port 3000
4. **Storage issues**: Check Chrome storage in DevTools Application tab

### Debug Tools

1. **Extension DevTools**: Right-click extension → Inspect popup
2. **Service Worker DevTools**: chrome://extensions/ → Service worker link
3. **Content Script DevTools**: F12 on any page
4. **Test Server Logs**: Check terminal where server is running

## 📊 Performance

### Benchmarks
- Basic script execution: ~10-50ms
- DOM operations: ~100-500ms (depends on page complexity)
- API calls: ~100-2000ms (depends on server response)
- Storage operations: ~5-20ms

### Optimization Tips
- Use `pauseCheckInterval` to control execution granularity
- Batch DOM operations when possible
- Cache API responses in storage
- Use scheduled tasks for heavy background processing

## 🚀 Advanced Usage

### Custom Functions
Add your own functions to the Wang interpreter:

```javascript
// In background.js, add to the functions object:
myCustomFunction: async (data) => {
  // Your custom logic here
  return processedData;
}
```

### Module System
Create reusable Wang modules:

```javascript
// In a .wang file
export function automateLogin(email, password) {
  await type("#email", email)
  await type("#password", password) 
  await click("#login")
}

// Use in other scripts
import { automateLogin } from "login-helper.wang"
await automateLogin("user@example.com", "password")
```

### Error Handling
Implement robust error handling:

```javascript
try {
  await automateComplexTask()
} catch (error) {
  log("Task failed:", error.message)
  await store("error_log", {
    error: error.message,
    timestamp: new Date().toISOString()
  })
  // Retry logic or fallback behavior
}
```

## 🤝 Contributing

1. Fork the Wang repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## 📄 License

This test environment is part of the Wang language project and follows the same license terms.

## 🔗 Resources

- [Wang Language Documentation](../../../CLAUDE.md)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)