const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS manually
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Increase payload limit for video uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ limit: '500mb', type: 'application/octet-stream' }));

// Handle multipart form data (for file uploads)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Simulate successful file upload
    req.body = {
      success: true,
      videoId: 'uploaded-video-' + Math.random().toString(36).substr(2, 9),
      originalName: 'uploaded-video.mp4',
      size: '25.5 MB'
    };
  }
  next();
});

// Test routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'SUCCESS!', 
    message: 'Your backend is working!',
    timestamp: new Date()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working perfectly!',
    success: true
  });
});

// Handle video upload (simulate)
app.post('/api/video/upload', (req, res) => {
  // Check if it's a multipart form upload
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    res.json({
      success: true,
      videoId: 'uploaded-video-' + Math.random().toString(36).substr(2, 9),
      originalName: 'uploaded-video.mp4',
      size: '25.5 MB',
      message: 'File upload simulation successful!'
    });
  } else {
    // Handle JSON upload
    res.json({
      success: true,
      videoId: 'test-video-123',
      originalName: 'test-video.mp4',
      size: '25.5 MB',
      message: 'Upload simulation successful!'
    });
  }
});

// Handle processing
app.post('/api/video/process', (req, res) => {
  const { videoId, variationCount = 5 } = req.body;
  
  res.json({
    success: true,
    jobId: 'job-' + Math.random().toString(36).substr(2, 9),
    message: `Started processing ${variationCount} variations`,
    estimatedTime: '2 minutes'
  });
});

// Handle status check
app.get('/api/video/status/:jobId', (req, res) => {
  // Always return completed with demo data
  const variationCount = 3; // Default for demo
  const results = [];
  
  for (let i = 1; i <= variationCount; i++) {
    results.push({
      id: `demo-video-${i}`,
      name: `variation_${i}.mp4`,
      similarity: Math.floor(Math.random() * 20) + 50, // 50-70%
      downloadUrl: `/api/video/download/demo-video-${i}`
    });
  }
  
  res.json({
    status: 'completed',
    progress: 100,
    data: results
  });
});

// Handle download
app.get('/api/video/download/:videoId', (req, res) => {
  res.json({
    message: 'Download simulation - in real version this would be the video file',
    videoId: req.params.videoId,
    success: true
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableRoutes: ['/health', '/api/test', '/api/video/upload', '/api/video/process']
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server successfully running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 API test: http://localhost:${PORT}/api/test`);
});
