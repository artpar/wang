/**
 * Wang Test Server - Local development server for testing Wang automation
 * Serves test pages and provides mock API endpoints
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../test-pages')));

// Mock data
let userData = [];
let apiCallCount = 0;
let serverStartTime = Date.now();

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>Wang Test Server</h1>
    <p>Server running since: ${new Date(serverStartTime).toLocaleString()}</p>
    <p>API calls served: ${apiCallCount}</p>
    <h2>Available Test Pages:</h2>
    <ul>
      <li><a href="/simple-form.html">Simple Form Test</a></li>
      <li><a href="/dynamic-content.html">Dynamic Content Test</a></li>
      <li><a href="/api-demo.html">API Demo Page</a></li>
    </ul>
    <h2>API Endpoints:</h2>
    <ul>
      <li><code>GET /api/test</code> - Simple test endpoint</li>
      <li><code>GET /api/users</code> - Get all users</li>
      <li><code>POST /api/users</code> - Create user</li>
      <li><code>GET /api/delay/:seconds</code> - Delayed response</li>
      <li><code>GET /api/random</code> - Random data</li>
      <li><code>POST /api/echo</code> - Echo request body</li>
    </ul>
  `);
});

// API Routes

// Simple test endpoint
app.get('/api/test', (req, res) => {
  apiCallCount++;
  res.json({
    success: true,
    message: 'Wang API test successful!',
    timestamp: new Date().toISOString(),
    callCount: apiCallCount,
    server: 'Wang Test Server'
  });
});

// Users endpoint
app.get('/api/users', (req, res) => {
  apiCallCount++;
  res.json({
    success: true,
    users: userData,
    count: userData.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/users', (req, res) => {
  apiCallCount++;
  const user = {
    id: userData.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  userData.push(user);
  
  res.status(201).json({
    success: true,
    user: user,
    message: 'User created successfully',
    totalUsers: userData.length
  });
});

// Get specific user
app.get('/api/users/:id', (req, res) => {
  apiCallCount++;
  const userId = parseInt(req.params.id);
  const user = userData.find(u => u.id === userId);
  
  if (user) {
    res.json({
      success: true,
      user: user
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
});

// Delayed response endpoint
app.get('/api/delay/:seconds', (req, res) => {
  apiCallCount++;
  const delay = Math.min(parseInt(req.params.seconds) || 1, 10); // Max 10 seconds
  
  setTimeout(() => {
    res.json({
      success: true,
      message: `Response delayed by ${delay} seconds`,
      delay: delay,
      timestamp: new Date().toISOString()
    });
  }, delay * 1000);
});

// Random data endpoint
app.get('/api/random', (req, res) => {
  apiCallCount++;
  const randomData = {
    id: Math.floor(Math.random() * 10000),
    name: `User ${Math.floor(Math.random() * 1000)}`,
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    score: Math.floor(Math.random() * 100),
    active: Math.random() > 0.5,
    category: ['premium', 'basic', 'trial'][Math.floor(Math.random() * 3)],
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: randomData
  });
});

// Echo endpoint
app.post('/api/echo', (req, res) => {
  apiCallCount++;
  res.json({
    success: true,
    echo: req.body,
    headers: req.headers,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Form submission endpoint
app.post('/api/submit-form', (req, res) => {
  apiCallCount++;
  const formData = req.body;
  
  // Simulate validation
  const errors = [];
  
  if (!formData.name) errors.push('Name is required');
  if (!formData.email) errors.push('Email is required');
  if (formData.email && !formData.email.includes('@')) errors.push('Invalid email format');
  if (!formData.terms) errors.push('Must accept terms and conditions');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors,
      message: 'Form validation failed'
    });
  }
  
  // Success
  const submission = {
    id: Date.now(),
    ...formData,
    submittedAt: new Date().toISOString(),
    processed: true
  };
  
  res.json({
    success: true,
    submission: submission,
    message: 'Form submitted successfully',
    id: submission.id
  });
});

// Error simulation endpoints
app.get('/api/error/:code', (req, res) => {
  apiCallCount++;
  const code = parseInt(req.params.code) || 500;
  
  const errorMessages = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden', 
    404: 'Not Found',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  };
  
  res.status(code).json({
    success: false,
    error: errorMessages[code] || 'Unknown Error',
    code: code,
    timestamp: new Date().toISOString()
  });
});

// Authentication simulation
app.post('/api/login', (req, res) => {
  apiCallCount++;
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'password') {
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 1,
        username: 'admin',
        role: 'administrator'
      },
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Username or password incorrect'
    });
  }
});

// Status endpoint
app.get('/api/status', (req, res) => {
  apiCallCount++;
  res.json({
    status: 'healthy',
    uptime: Date.now() - serverStartTime,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    apiCalls: apiCallCount,
    users: userData.length,
    memory: process.memoryUsage()
  });
});

// Search endpoint
app.get('/api/search', (req, res) => {
  apiCallCount++;
  const query = req.query.q || '';
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  
  // Mock search results
  const results = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
    id: i + 1,
    title: `Search Result ${i + 1} for "${query}"`,
    description: `This is a mock search result containing information about ${query}`,
    url: `https://example.com/result/${i + 1}`,
    score: Math.random()
  }));
  
  res.json({
    success: true,
    query: query,
    results: results,
    total: results.length,
    timestamp: new Date().toISOString()
  });
});

// Bulk data endpoint
app.get('/api/bulk/:count', (req, res) => {
  apiCallCount++;
  const count = Math.min(parseInt(req.params.count) || 10, 1000);
  
  const data = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 100,
    category: ['A', 'B', 'C'][i % 3],
    active: Math.random() > 0.3,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
  }));
  
  res.json({
    success: true,
    data: data,
    count: data.length,
    timestamp: new Date().toISOString()
  });
});

// File upload simulation
app.post('/api/upload', (req, res) => {
  apiCallCount++;
  
  // Simulate file upload processing
  setTimeout(() => {
    res.json({
      success: true,
      file: {
        name: 'uploaded-file.txt',
        size: Math.floor(Math.random() * 10000),
        type: 'text/plain',
        url: '/uploads/uploaded-file.txt'
      },
      message: 'File uploaded successfully',
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

// Catch-all for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\\n🚀 Wang Test Server running on http://localhost:${PORT}`);
  console.log(`\\n📁 Test Pages:`);
  console.log(`   • Simple Form: http://localhost:${PORT}/simple-form.html`);
  console.log(`   • Dynamic Content: http://localhost:${PORT}/dynamic-content.html`);
  console.log(`   • API Demo: http://localhost:${PORT}/api-demo.html`);
  console.log(`\\n🔗 API Endpoints:`);
  console.log(`   • Test: http://localhost:${PORT}/api/test`);
  console.log(`   • Users: http://localhost:${PORT}/api/users`);
  console.log(`   • Status: http://localhost:${PORT}/api/status`);
  console.log(`   • Random: http://localhost:${PORT}/api/random`);
  console.log(`\\n💡 Use these endpoints to test Wang automation scripts!\\n`);
});

module.exports = app;