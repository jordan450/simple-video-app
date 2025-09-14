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

app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'SUCCESS!', 
    message: 'Your backend is working!',
    timestamp: new Date()
  });
});

// Basic API route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working perfectly!',
    success: true
  });
});

// Simulate video upload
app.post('/api/video/upload', (req, res) => {
  res.json({
    success: true,
    videoId: 'test-video-123',
    originalName: 'test-video.mp4',
    size: '25.5 MB',
    message: 'Upload simulation successful!'
  });
});

// Simulate processing
app.post('/api/video/process', (req, res) => {
  const { videoId, variationCount = 5 } = req.body;
  
  res.json({
    success: true,
    jobId: 'job-' + Math.random().toString(36).substr(2, 9),
    message: `Started processing ${variationCount} variations`,
    estimatedTime: '2 minutes'
  });
});

// Simulate status check
app.get('/api/video/status/:jobId', (req, res) => {
  // Simulate completed job
  res.json({
    status: 'completed',
    progress: 100,
    data: [
      {
        id: 'test-video-123_variation_1',
        name: 'variation_1.mp4',
        similarity: 62,
        downloadUrl: '/api/video/download/test-video-123_variation_1'
      },
      {
        id: 'test-video-123_variation_2', 
        name: 'variation_2.mp4',
        similarity: 58,
        downloadUrl: '/api/video/download/test-video-123_variation_2'
      },
      {
        id: 'test-video-123_variation_3',
        name: 'variation_3.mp4', 
        similarity: 65,
        downloadUrl: '/api/video/download/test-video-123_variation_3'
      }
    ]
  });
});

// Simulate download
app.get('/api/video/download/:videoId', (req, res) => {
  res.json({
    message: 'Download simulation - in real version this would be the video file',
    videoId: req.params.videoId
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server successfully running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
