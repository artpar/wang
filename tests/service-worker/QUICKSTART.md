# Wang Service Worker - Quick Start Guide

🚀 **Ready to Test!** Everything is set up and working. Follow these steps to test Wang automation in a Chrome service worker.

## ⚡ Immediate Testing (2 minutes)

### 1. Start Test Server ✅
```bash
# Server is running at: http://localhost:3000
# API endpoints tested and working
```

### 2. Load Extension in Chrome
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Select: `/Users/artpar/workspace/code/insidious/wang/tests/service-worker/extension`
5. ✅ Extension should load successfully

### 3. Open Test Page
- Navigate to: http://localhost:3000/simple-form.html
- ✅ Page has interactive form elements for testing

### 4. Test Wang in Service Worker
1. **Click Wang extension icon** in Chrome toolbar
2. **Select "DOM Automation"** from dropdown
3. **Click "Load"** to load the script
4. **Click "Run"** to execute Wang code in service worker
5. **Watch the magic!** ✨

## 🎯 What You'll See

### In Extension Popup:
- Real-time console output from Wang execution
- Variable state inspection
- Execution timing and performance
- Error handling with stack traces

### On Test Page:
- Form automatically filled by Wang script
- Dynamic content loaded
- Interactive elements clicked
- Real DOM manipulation from service worker

### In Chrome DevTools:
- Service worker logs showing Wang interpreter
- Network requests to mock API
- Chrome storage with persistent data
- Background task scheduling

## 🧪 Test Scripts Available

### 1. **DOM Automation** (`dom-automation.wang`)
```javascript
// Fills forms, clicks buttons, manipulates page elements
await type("#email", "wang@example.com")
await click("#submit-btn")
let result = await querySelector(".success")
```

### 2. **API Calls** (`api-calls.wang`)
```javascript
// Tests network operations from service worker
let users = await apiCall("http://localhost:3000/api/users")
let newUser = await apiCall("/api/users", { method: "POST", ... })
```

### 3. **Storage Operations** (`storage-ops.wang`)
```javascript
// Chrome storage persistence
await store("test_data", { complex: "object" })
let retrieved = await retrieve("test_data")
```

### 4. **Scheduled Tasks** (`scheduled-tasks.wang`)
```javascript
// Background task scheduling with Chrome alarms
await scheduleTask("daily_sync", 1440, `log("Daily task!")`)
```

## 🔧 Quick Debug Script

Paste this in the extension popup to test basic functionality:

```javascript
// Test 1: Basic Wang execution
log("🚀 Wang running in service worker!")

// Test 2: Storage operations  
await store("quick_test", {
  timestamp: new Date().toISOString(),
  success: true,
  message: "Service worker storage working!"
})

let stored = await retrieve("quick_test")
log("📦 Storage test:", stored)

// Test 3: API call
let apiTest = await apiCall("http://localhost:3000/api/test")
log("🌐 API test:", apiTest)

// Test 4: DOM interaction (if test page is open)
try {
  await type("#name", "Wang Automation Test")
  log("✅ DOM automation working!")
} catch (error) {
  log("⚠️ DOM test skipped (open test page first)")
}

log("🎉 All basic tests completed!")
```

## 🎪 Advanced Testing

### Real-time Debugging:
- Click **"Pause"** during script execution
- Inspect variables in **"State"** tab  
- Resume execution step by step
- View execution history in **"History"** tab

### Service Worker Monitoring:
1. Go to `chrome://extensions/`
2. Click **"service worker"** link for Wang extension
3. Watch real-time Wang logs in service worker console

### Performance Profiling:
- Execution timing displayed in popup
- Background task scheduling tests
- Memory usage monitoring
- Network request tracking

## 🎯 Success Indicators

✅ **Extension loads** without errors  
✅ **Service worker registers** and shows "[Wang] Background script loaded"  
✅ **Popup interface** opens and functions correctly  
✅ **Wang scripts execute** and show console output  
✅ **DOM manipulation** works across page contexts  
✅ **API calls complete** with proper responses  
✅ **Storage operations** persist data in Chrome storage  
✅ **Real-time debugging** functions work (pause/resume/inspect)  

## 🚨 If Something's Not Working

### Extension won't load:
- Check `chrome://extensions/` for error details
- Verify all files exist in extension directory
- Check manifest.json syntax

### Service worker issues:
- Look for errors in service worker console
- Verify wang.min.js imported correctly
- Check background.js syntax

### Script execution fails:
- Check popup console for errors
- Verify test server is running on port 3000
- Ensure test page is loaded

### DOM operations don't work:
- Open test page at `localhost:3000/simple-form.html`
- Check content script injection
- Verify page console for errors

---

## 🎉 **You're Ready!**

This complete service worker environment provides:
- ⚡ **Instant feedback** on Wang automation scripts
- 🔍 **Real-time debugging** with pause/resume capabilities  
- 📊 **Performance monitoring** with execution metrics
- 🎯 **True service worker execution** - runs even when pages are closed
- 🛠️ **LLM-friendly development** - write, test, iterate rapidly

**Perfect for developing and testing Wang automation in a real Chrome environment!** 🚀