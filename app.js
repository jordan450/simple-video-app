const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
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

// Simple in-memory storage
const jobs = new Map();
const uploadedFiles = new Map();
let jobCounter = 0;
let fileCounter = 0;

// Simple file upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit to be safe
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files'));
    }
  }
});

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'SUCCESS!', 
    message: 'Stable video processing server',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API working perfectly!',
    success: true,
    mode: 'STABLE'
  });
});

// File upload
app.post('/api/video/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const fileId = `video_${++fileCounter}_${Date.now()}`;
    
    // Store file in memory temporarily
    uploadedFiles.set(fileId, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    });

    res.json({
      success: true,
      videoId: fileId,
      originalName: req.file.originalname,
      size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
      message: 'Video uploaded successfully!'
    });
    
    console.log(`✅ Uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Start processing
app.post('/api/video/process', async (req, res) => {
  try {
    const { videoId, variationCount = 5 } = req.body;
    
    if (!videoId || !uploadedFiles.has(videoId)) {
      return res.status(400).json({ error: 'Video not found' });
    }

    const jobId = ++jobCounter;
    
    jobs.set(jobId, {
      status: 'active',
      progress: 0,
      data: null,
      videoId,
      variationCount,
      startedAt: new Date()
    });

    // Start processing
    processVideoStable(jobId, videoId, variationCount);

    res.json({
      success: true,
      jobId,
      message: `Processing ${variationCount} variations`,
      estimatedTime: `${variationCount * 3} seconds`
    });
    
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Job status
app.get('/api/video/status/:jobId', (req, res) => {
  const jobId = parseInt(req.params.jobId);
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.json({ status: 'not_found' });
  }
  
  res.json(job);
});

// Download (simulate for now)
app.get('/api/video/download/:videoId', (req, res) => {
  const videoId = req.para
