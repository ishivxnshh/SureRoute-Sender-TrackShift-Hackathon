import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Storage for relay
const RELAY_STORAGE = path.join(__dirname, '../relay-storage');
await fs.mkdir(RELAY_STORAGE, { recursive: true });

// In-memory cache for chunks
const chunkCache = new Map();

// Multer configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { transferId } = req.params;
    const transferDir = path.join(RELAY_STORAGE, transferId);
    await fs.mkdir(transferDir, { recursive: true });
    cb(null, transferDir);
  },
  filename: (req, file, cb) => {
    const { chunkIndex } = req.params;
    cb(null, `chunk_${chunkIndex}`);
  },
});

const upload = multer({ storage });

// Store chunk endpoint
app.post('/relay/store/:transferId/:chunkIndex', upload.single('chunk'), async (req, res) => {
  try {
    const { transferId, chunkIndex } = req.params;
    
    console.log(`📦 Relay storing chunk ${chunkIndex} for transfer ${transferId}`);
    
    // Cache chunk metadata
    chunkCache.set(`${transferId}:${chunkIndex}`, {
      path: req.file.path,
      size: req.file.size,
      timestamp: Date.now(),
    });
    
    res.json({
      success: true,
      message: 'Chunk stored on relay',
      relay_url: `/relay/fetch/${transferId}/${chunkIndex}`,
    });
  } catch (error) {
    console.error('Error storing chunk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch chunk endpoint
app.get('/relay/fetch/:transferId/:chunkIndex', async (req, res) => {
  try {
    const { transferId, chunkIndex } = req.params;
    const chunkKey = `${transferId}:${chunkIndex}`;
    
    const chunkMeta = chunkCache.get(chunkKey);
    if (!chunkMeta) {
      return res.status(404).json({ success: false, error: 'Chunk not found on relay' });
    }
    
    console.log(`📤 Relay serving chunk ${chunkIndex} for transfer ${transferId}`);
    
    const chunkData = await fs.readFile(chunkMeta.path);
    res.send(chunkData);
  } catch (error) {
    console.error('Error fetching chunk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List chunks for a transfer
app.get('/relay/chunks/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params;
    const chunks = [];
    
    for (const [key, meta] of chunkCache.entries()) {
      if (key.startsWith(`${transferId}:`)) {
        const chunkIndex = key.split(':')[1];
        chunks.push({
          index: parseInt(chunkIndex),
          size: meta.size,
          timestamp: meta.timestamp,
        });
      }
    }
    
    res.json({ success: true, chunks });
  } catch (error) {
    console.error('Error listing chunks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean up old chunks (older than 1 hour)
setInterval(async () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, meta] of chunkCache.entries()) {
    if (now - meta.timestamp > oneHour) {
      try {
        await fs.unlink(meta.path);
        chunkCache.delete(key);
        console.log(`🗑️ Cleaned up old chunk: ${key}`);
      } catch (error) {
        console.error('Error cleaning up chunk:', error);
      }
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    cached_chunks: chunkCache.size,
    uptime: process.uptime(),
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SureRoute Relay Server running on port ${PORT}`);
  console.log(`📂 Relay storage: ${RELAY_STORAGE}`);
});
