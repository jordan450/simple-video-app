const http = require('http');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;

// Simple in-memory storage
const jobs = new Map();
const uploadedFiles = new Map();
let jobCounter = 0;
let fileCounter = 0;

// CORS headers
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}

// Send JSON response
function sendJSON(res, statusCode, data) {
  setCORS(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Parse POST data
function parsePostData(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body.startsWith('{')) {
          resolve(JSON.parse(body));
        } else {
          resolve({ raw: body });
        }
      } catch (e) {
        resolve({ raw: body });
      }
    });
  });
}

// Simple multipart parser
function parseMultipart(body, boundary) {
  const parts = body.split(`--${boundary}`);
  const files = {};
  
  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      const filenameMatch = part.match(/filename="([^"]+)"/);
      
      if (nameMatch && filenameMatch) {
        const fieldName = nameMatch[1];
        const filename = filenameMatch[1];
        
        // Find the file content (after double CRLF)
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const content = part.substring(contentStart);
        
        files[fieldName] = {
          filename: filename,
          content: content,
          size: content.length
        };
      }
    }
  }
  
  return files;
}

// Process video (simulation)
async function processVideoSimple(jobId, videoId, variationCount) {
  const job = jobs.get(jobId);
  
  try {
    const results = [];
    
    for (let i = 0; i < variationCount; i++) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const variationId = `${videoId}_variation_${i + 1}`;
      const similarity = 50 + Math.floor(Math.random() * 20); // 50-70%
      
      results.push({
        id: variationId,
        name: `variation_${i + 1}.mp4`,
        similarity: similarity,
        downloadUrl: `/api/video/download/${variationId}`,
        size: '25.4 MB'
      });
      
      job.progress = Math.round(((i + 1) / variationCount) * 100);
    }
    
    job.status = 'completed';
    job.data = results;
    
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  setCORS(res);
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      sendJSON(res, 200, {
        status: 'SUCCESS!',
        message: 'Zero-dependency server running!',
        timestamp: new Date(),
        uptime: process.uptime()
      });
      return;
    }
    
    // API test
    if (path === '/api/test' && method === 'GET') {
      sendJSON(res, 200, {
        message: 'API working perfectly!',
        success: true,
        mode: 'MINIMAL'
      });
      return;
    }
    
    // Video upload
    if (path === '/api/video/upload' && method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      
      if (contentType.includes('multipart/form-data')) {
        const boundary = contentType.split('boundary=')[1];
        const postData = await parsePostData(req);
        
        // Simulate successful upload
        const fileId = `video_${++fileCounter}_${Date.now()}`;
        
        uploadedFiles.set(fileId, {
          originalName: 'uploaded-video.mp4',
          size: 25600000, // 25.6MB
          uploadedAt: new Date()
        });
        
        sendJSON(res, 200, {
          success: true,
          videoId: fileId,
          originalName: 'uploaded-video.mp4',
          size: '25.6 MB',
          message: 'Video uploaded successfully!'
        });
      } else {
        sendJSON(res, 400, { error: 'Invalid upload format' });
      }
      return;
    }
    
    // Start processing
    if (path === '/api/video/process' && method === 'POST') {
      const postData = await parsePostData(req);
      const { videoId, variationCount = 5 } = postData;
      
      if (!videoId) {
        sendJSON(res, 400, { error: 'Missing videoId' });
        return;
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
      processVideoSimple(jobId, videoId, variationCount);
      
      sendJSON(res, 200, {
        success: true,
        jobId,
        message: `Processing ${variationCount} variations`,
        estimatedTime: `${variationCount * 2} seconds`
      });
      return;
    }
    
    // Job status
    if (path.startsWith('/api/video/status/') && method === 'GET') {
      const jobId = parseInt(path.split('/').pop());
      const job = jobs.get(jobId);
      
      if (!job) {
        sendJSON(res, 200, { status: 'not_found' });
        return;
      }
      
      sendJSON(res, 200, job);
      return;
    }
    
    // Download
    if (path.startsWith('/api/video/download/') && method === 'GET') {
      const videoId = path.split('/').pop();
      
      sendJSON(res, 200, {
        message: 'Download simulation successful!',
        videoId: videoId,
        note: 'In production, this would stream the actual video file'
      });
      return;
    }
    
    // 404
    sendJSON(res, 404, { 
      error: 'Route not found',
      path: path
    });
    
  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Zero-dependency server running on port ${PORT}`);
  console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`✅ No external dependencies - guaranteed to work!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
