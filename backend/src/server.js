import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { AgentCoordinator } from './agents.js';
import { P2PManager } from './p2p-manager.js';
import { BluetoothManager } from './bluetooth-manager.js';
import { authMiddleware } from './utils/jwt.js';
import { getUserWorkflows, saveUserWorkflows } from './workflows.js';
import { signup, login, me, logout, startGoogleOAuth, handleGoogleCallback } from './controllers/authController.js';
import { getDb } from './db/mongo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Storage configuration
const STORAGE_DIR = path.join(__dirname, '../storage');
const CHUNKS_DIR = path.join(STORAGE_DIR, 'chunks');
const FILES_DIR = path.join(STORAGE_DIR, 'files');

// Ensure storage directories exist
await fs.mkdir(STORAGE_DIR, { recursive: true });
await fs.mkdir(CHUNKS_DIR, { recursive: true });
await fs.mkdir(FILES_DIR, { recursive: true });

// In-memory storage for transfer states
const transfers = new Map();
const telemetryData = new Map();
const aiSuggestions = new Map();
const transferQueue = []; // queued transfers waiting to be sent
let activeTransferId = null; // currently sending transfer

// Simple ML-style heuristic to infer file priority based on size and name
function inferPriorityFromFile(fileName, fileSize) {
  const sizeMB = (fileSize || 0) / (1024 * 1024);
  const lowerName = (fileName || '').toLowerCase();

  // Example signal: certain keywords bump priority
  const criticalKeywords = ['invoice', 'contract', 'report', 'urgent', 'prod'];
  const isCriticalName = criticalKeywords.some((k) => lowerName.includes(k));

  if (isCriticalName && sizeMB >= 10) {
    return 'critical';
  }

  // Size-based tiers
  if (sizeMB >= 500) return 'critical'; // huge files
  if (sizeMB >= 100) return 'high';
  if (sizeMB >= 10) return 'medium';
  return 'low';
}

// Initialize managers
const agentCoordinator = new AgentCoordinator(io);
const p2pManager = new P2PManager(io);
const bluetoothManager = new BluetoothManager();

// Initialize Bluetooth
bluetoothManager.initialize().catch(err => {
  console.log('⚠️  Bluetooth unavailable:', err.message);
});

// Simulator settings
let simulatorSettings = {
  latency: 0,
  packetLoss: 0,
  bandwidth: 1000000,
  connectionDrops: false,
};

// Telemetry simulation - generate realistic network metrics
function generateTelemetry(transferId) {
  const base = {
    rtt: 150 + Math.random() * 100,
    packetLoss: Math.random() * 0.02,
    bandwidth: 800000 + Math.random() * 400000,
  };

  // Apply simulator settings
  base.rtt += simulatorSettings.latency;
  base.packetLoss += simulatorSettings.packetLoss / 100;
  
  return base;
}

// ---------- Auth & Workflow persistence endpoints ----------

// Local email/password auth (JSON API used by the React app)
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authMiddleware, me);
app.post('/api/auth/logout', authMiddleware, logout);

// Aliases matching the spec in the requirements
app.get('/auth/me', authMiddleware, me);
app.post('/auth/logout', authMiddleware, logout);

// Google OAuth endpoints:
//  - GET /auth/google           → redirect to Google
//  - GET /auth/google/callback  → Google redirects back here with ?code=...
//
// The controller is heavily commented to explain:
//   * how the redirect-based OAuth 2.0 flow works,
//   * how we map Google identities into SureRoute users, and
//   * how we mint our own JWT so the frontend talks ONLY to SureRoute.
app.get('/auth/google', startGoogleOAuth);
app.get('/auth/google/callback', handleGoogleCallback);

// Get workflows for current user
app.get('/api/workflows', authMiddleware, async (req, res) => {
  try {
    const workflows = await getUserWorkflows(req.userId);
    res.json({ success: true, workflows });
  } catch (err) {
    console.error('Get workflows error:', err);
    res.status(500).json({ success: false, error: 'Failed to load workflows' });
  }
});

// Save workflows for current user (overwrites existing list)
app.post('/api/workflows', authMiddleware, async (req, res) => {
  try {
    const { workflows } = req.body || {};
    if (!Array.isArray(workflows)) {
      return res.status(400).json({ success: false, error: 'workflows must be an array' });
    }
    await saveUserWorkflows(req.userId, workflows);
    res.json({ success: true });
  } catch (err) {
    console.error('Save workflows error:', err);
    res.status(500).json({ success: false, error: 'Failed to save workflows' });
  }
});

// Start telemetry updates for active transfers
setInterval(() => {
  transfers.forEach((transfer, id) => {
    if (transfer.status === 'active') {
      const telemetry = generateTelemetry(id);
      telemetryData.set(id, telemetry);
      
      // Send to clients
      io.emit('telemetry', {
        transfer_id: id,
        rtt_ms: telemetry.rtt,
        packet_loss: telemetry.packetLoss,
        bandwidth: telemetry.bandwidth,
      });

      // Let AI agents analyze
      agentCoordinator.processTelemetryUpdate(id, telemetry);
    }
  });

  // Run scheduler optimization
  if (transfers.size > 0) {
    agentCoordinator.optimizeScheduling(transfers, telemetryData);
  }
}, 2000); // Every 2 seconds

// Multer configuration for chunk uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { transferId } = req.params;
    const chunkDir = path.join(CHUNKS_DIR, transferId);
    await fs.mkdir(chunkDir, { recursive: true });
    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const { chunkIndex } = req.params;
    cb(null, `chunk_${chunkIndex}`);
  },
});

const upload = multer({ storage });

// Transfer creation endpoint
app.post('/api/transfer/create', async (req, res) => {
  try {
    const { file_name, file_size, chunk_size, chunks, priority } = req.body;
    
    const transferId = uuidv4();
    const transfer = {
      id: transferId,
      fileName: file_name,
      fileSize: file_size,
      chunkSize: chunk_size || 1048576, // Default 1MB
      totalChunks: chunks.length,
      chunks: chunks,
      chunkStatus: {},
      priority: priority || 'normal',
      status: 'ready',
      progress: 0,
      speed: 0,
      eta: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      currentTransport: 'wifi',
      concurrency: 4,
    };

    transfers.set(transferId, transfer);

    // Initialize chunk status
    chunks.forEach((hash, index) => {
      transfer.chunkStatus[index] = 'pending';
    });

    // Notify AI coordinator
    const telemetry = generateTelemetry(transferId);
    agentCoordinator.processTransfer(transfer, telemetry);

    res.json({
      success: true,
      transferId: transferId,
      message: 'Transfer created successfully',
    });

    // Notify clients
    io.emit('transfer:created', { transfer });

  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manifest check endpoint (for resume capability)
app.post('/api/manifest/check', async (req, res) => {
  try {
    const { transfer_id, chunks } = req.body;
    
    const transfer = transfers.get(transfer_id);
    if (!transfer) {
      return res.json({ missing_chunks: chunks.map((_, i) => i) });
    }

    // Check which chunks are missing
    const missingChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = path.join(CHUNKS_DIR, transfer_id, `chunk_${i}`);
      try {
        await fs.access(chunkPath);
      } catch {
        missingChunks.push(i);
      }
    }

    res.json({ missing_chunks: missingChunks });

  } catch (error) {
    console.error('Error checking manifest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chunk upload endpoint
app.post('/api/upload/:transferId/:chunkIndex', upload.single('chunk'), async (req, res) => {
  try {
    const { transferId, chunkIndex } = req.params;
    const transfer = transfers.get(transferId);

    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer not found' });
    }

    // Simulate network conditions
    if (simulatorSettings.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, simulatorSettings.latency));
    }

    if (simulatorSettings.packetLoss > 0) {
      const shouldDrop = Math.random() * 100 < simulatorSettings.packetLoss;
      if (shouldDrop) {
        return res.status(500).json({ success: false, error: 'Packet dropped (simulated)' });
      }
    }

    // Verify chunk hash
    const chunkBuffer = await fs.readFile(req.file.path);
    const chunkHash = crypto.createHash('sha256').update(chunkBuffer).digest('hex');
    
    const expectedHash = transfer.chunks[parseInt(chunkIndex)];
    if (chunkHash !== expectedHash) {
      transfer.chunkStatus[chunkIndex] = 'error';
      
      // Notify recovery agent
      agentCoordinator.processChunkFailure(transferId, parseInt(chunkIndex), 'Hash mismatch');
      
      return res.status(400).json({ success: false, error: 'Chunk hash mismatch' });
    }

    // Update chunk status
    transfer.chunkStatus[chunkIndex] = 'complete';
    
    // Calculate progress
    const completedChunks = Object.values(transfer.chunkStatus).filter(s => s === 'complete').length;
    transfer.progress = completedChunks / transfer.totalChunks;
    
    // Update transfer stats
    if (!transfer.startedAt) {
      transfer.startedAt = Date.now();
    }
    
    const elapsed = (Date.now() - transfer.startedAt) / 1000;
    const bytesTransferred = completedChunks * transfer.chunkSize;
    transfer.speed = elapsed > 0 ? bytesTransferred / elapsed : 0;
    
    const remainingChunks = transfer.totalChunks - completedChunks;
    transfer.eta = transfer.speed > 0 ? (remainingChunks * transfer.chunkSize) / transfer.speed : null;

    // Check if transfer is complete
    if (completedChunks === transfer.totalChunks) {
      transfer.status = 'complete';
      transfer.completedAt = Date.now();
      await assembleFile(transferId);
    }

    transfers.set(transferId, transfer);

    // Emit progress update
    io.emit('transfer:update', {
      transfer_id: transferId,
      progress: transfer.progress,
      speed_bytes_s: transfer.speed,
      eta: transfer.eta,
      status: transfer.status,
    });

    io.emit('chunk:update', {
      transfer_id: transferId,
      chunk_index: parseInt(chunkIndex),
      chunk_status: transfer.chunkStatus,
    });

    res.json({ success: true, progress: transfer.progress });

  } catch (error) {
    console.error('Error uploading chunk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assemble file from chunks
async function assembleFile(transferId) {
  try {
    const transfer = transfers.get(transferId);
    const outputPath = path.join(FILES_DIR, transfer.fileName);
    const writeStream = (await import('fs')).createWriteStream(outputPath);

    for (let i = 0; i < transfer.totalChunks; i++) {
      const chunkPath = path.join(CHUNKS_DIR, transferId, `chunk_${i}`);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();
    console.log(`File assembled: ${outputPath}`);
  } catch (error) {
    console.error('Error assembling file:', error);
  }
}

// Transfer control endpoints
app.post('/api/transfer/:transferId/pause', (req, res) => {
  const { transferId } = req.params;
  const transfer = transfers.get(transferId);
  
  if (transfer) {
    transfer.status = 'paused';
    transfers.set(transferId, transfer);
    io.emit('transfer:update', { transfer_id: transferId, status: 'paused' });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Transfer not found' });
  }
});

app.post('/api/transfer/:transferId/resume', (req, res) => {
  const { transferId } = req.params;
  const transfer = transfers.get(transferId);
  
  if (transfer) {
    transfer.status = 'active';
    transfers.set(transferId, transfer);
    io.emit('transfer:update', { transfer_id: transferId, status: 'active' });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Transfer not found' });
  }
});

app.post('/api/transfer/:transferId/cancel', (req, res) => {
  const { transferId } = req.params;
  const transfer = transfers.get(transferId);
  
  if (transfer) {
    transfer.status = 'cancelled';
    transfers.set(transferId, transfer);
    io.emit('transfer:update', { transfer_id: transferId, status: 'cancelled' });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Transfer not found' });
  }
});

// Cancel all transfers (active + queued)
app.post('/api/transfer/cancel-all', (req, res) => {
  try {
    transfers.forEach((transfer, id) => {
      if (transfer.status === 'active' || transfer.status === 'ready' || transfer.status === 'initiated' || transfer.status === 'transferring') {
        transfer.status = 'cancelled';
        transfers.set(id, transfer);
        io.emit('transfer:update', { transfer_id: id, status: 'cancelled' });
      }
    });

    // Clear any queued jobs; scheduler will see cancelled transfers and skip
    transferQueue.length = 0;

    res.json({ success: true });
  } catch (err) {
    console.error('Error cancelling all transfers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/transfer/:transferId/priority', (req, res) => {
  const { transferId } = req.params;
  const { priority } = req.body;
  const transfer = transfers.get(transferId);
  
  if (transfer) {
    transfer.priority = priority;
    transfers.set(transferId, transfer);
    io.emit('transfer:update', { transfer_id: transferId, priority });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Transfer not found' });
  }
});

// Simulator endpoints
app.post('/api/simulator/update', (req, res) => {
  simulatorSettings = { ...simulatorSettings, ...req.body };
  console.log('Simulator settings updated:', simulatorSettings);
  res.json({ success: true, settings: simulatorSettings });
});

app.post('/api/simulator/event', (req, res) => {
  const { event } = req.body;
  
  switch (event) {
    case 'drop_connection':
      io.emit('connection:status', 'disconnected');
      setTimeout(() => io.emit('connection:status', 'connected'), 3000);
      break;
    case 'degrade_quality':
      simulatorSettings.packetLoss = 10;
      simulatorSettings.latency = 500;
      setTimeout(() => {
        simulatorSettings.packetLoss = 0;
        simulatorSettings.latency = 0;
      }, 5000);
      break;
  }
  
  res.json({ success: true });
});

// AI Agent endpoints
app.post('/api/agent/accept/:suggestionId', (req, res) => {
  const { suggestionId } = req.params;
  console.log(`AI suggestion accepted: ${suggestionId}`);
  // Implement suggestion logic here
  res.json({ success: true });
});

app.post('/api/agent/reject/:suggestionId', (req, res) => {
  const { suggestionId } = req.params;
  console.log(`AI suggestion rejected: ${suggestionId}`);
  res.json({ success: true });
});

app.post('/api/agent/automation', (req, res) => {
  const { level } = req.body;
  console.log(`Automation level set to: ${level}`);
  res.json({ success: true });
});

// Transport endpoints
app.post('/api/transport/set', (req, res) => {
  const { type, settings } = req.body;
  console.log(`Transport set to: ${type}`, settings);
  
  io.emit('transport:change', {
    transport: type,
    added: true,
  });
  
  res.json({ success: true });
});

app.get('/api/transport/available', (req, res) => {
  res.json({
    transports: ['wifi', 'bluetooth', 'relay'],
  });
});

// Ask AI endpoint
app.post('/api/ai/ask', (req, res) => {
  const { question, context } = req.body;
  
  // Simple rule-based responses
  const responses = {
    'how': 'You can configure nodes by clicking on them and adjusting settings in the right panel.',
    'what': 'This system provides resilient file transfer with automatic failover and AI optimization.',
    'priority': 'Higher priority transfers get more bandwidth and concurrent connections.',
    'chunk': 'Chunks are verified using SHA-256 hashes. Failed chunks are automatically retried.',
  };
  
  const lowerQuestion = question.toLowerCase();
  let answer = 'I can help you with transfer configuration, priority management, and troubleshooting. What would you like to know?';
  
  for (const [key, value] of Object.entries(responses)) {
    if (lowerQuestion.includes(key)) {
      answer = value;
      break;
    }
  }
  
  res.json({ success: true, answer });
});

// Peer discovery endpoints (for real mode)
app.get('/api/peer/discover', (req, res) => {
  // Start P2P discovery if not already running
  if (!p2pManager.discoverySocket) {
    p2pManager.startDiscovery();
  }
  
  const peers = p2pManager.getDiscoveredPeers();
  
  res.json({
    peers,
    localPeer: {
      id: p2pManager.localPeerId,
      hostname: p2pManager.localInfo.hostname,
      addresses: p2pManager.localInfo.addresses,
    },
  });
});

app.post('/api/peer/connect', async (req, res) => {
  const { peerId } = req.body;
  
  try {
    const result = await p2pManager.connectToPeer(peerId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/peer/disconnect', (req, res) => {
  const { peerId } = req.body;
  p2pManager.disconnectFromPeer(peerId);
  res.json({ success: true });
});

// Bluetooth endpoints
app.get('/api/bluetooth/scan', async (req, res) => {
  try {
    await bluetoothManager.startScanning(10000);
    res.json({ success: true, scanning: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/bluetooth/devices', (req, res) => {
  const devices = bluetoothManager.getDiscoveredDevices();
  res.json({ devices, adapter: bluetoothManager.getAdapterInfo() });
});

app.post('/api/bluetooth/connect', async (req, res) => {
  const { deviceId } = req.body;
  
  try {
    const connection = await bluetoothManager.connect(deviceId);
    res.json({ success: true, connection });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/bluetooth/disconnect', async (req, res) => {
  const { deviceId } = req.body;
  
  try {
    await bluetoothManager.disconnect(deviceId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// WebRTC signaling endpoints
app.post('/api/webrtc/signal', async (req, res) => {
  const { to, signal } = req.body;
  
  try {
    await p2pManager.sendWebRTCSignal(to, signal);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial connection status
  socket.emit('connection:status', 'connected');
  
  // Handle WebRTC signaling through Socket.IO
  socket.on('webrtc:offer', async (data) => {
    console.log(`📡 WebRTC offer from ${socket.id} to ${data.to}`);
    await p2pManager.sendWebRTCSignal(data.to, { type: 'offer', offer: data.offer });
  });
  
  socket.on('webrtc:answer', async (data) => {
    console.log(`📡 WebRTC answer from ${socket.id} to ${data.to}`);
    await p2pManager.sendWebRTCSignal(data.to, { type: 'answer', answer: data.answer });
  });
  
  socket.on('webrtc:candidate', async (data) => {
    await p2pManager.sendWebRTCSignal(data.to, { type: 'candidate', candidate: data.candidate });
  });
  
  // Start P2P discovery when client requests
  socket.on('peer:startDiscovery', () => {
    p2pManager.startDiscovery();
    socket.emit('peer:discoveryStarted', { 
      localPeerId: p2pManager.localPeerId 
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', transfers: transfers.size });
});

// Get network information
app.get('/api/network-info', async (req, res) => {
  const os = await import('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  res.json({
    localIP,
    port: 5000,
    hostname: os.hostname()
  });
});

// Start receiver
app.post('/api/receiver/start', async (req, res) => {
  const { transport, port } = req.body;
  
  try {
    console.log(`🎧 Receiver starting on ${transport} transport, port ${port || 5000}`);
    
    transfers.set('receiver', {
      active: true,
      transport,
      port: port || 5000,
      startedAt: Date.now()
    });
    
    res.json({
      success: true,
      transport,
      message: 'Receiver is now listening for incoming transfers'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute workflow
app.post('/api/workflow/execute', async (req, res) => {
  const { workflowId, nodes, connections } = req.body;
  
  try {
    console.log(`▶️  Executing workflow ${workflowId}`);
    
    const senderNode = nodes.find(n => n.type === 'device' && n.config?.deviceType === 'sender');
    const receiverNode = nodes.find(n => n.type === 'device' && n.config?.deviceType === 'receiver');
    
    if (!senderNode || !receiverNode) {
      return res.status(400).json({ error: 'Workflow must have sender and receiver device nodes' });
    }
    
    const transferId = uuidv4();
    transfers.set(transferId, {
      workflowId,
      sender: senderNode.config,
      receiver: receiverNode.config,
      status: 'ready',
      createdAt: Date.now()
    });
    
    res.json({
      success: true,
      transferId,
      message: 'Workflow execution started',
      senderIP: senderNode.config?.ipAddress || 'localhost',
      receiverIP: receiverNode.config?.ipAddress || 'localhost'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve received files for download
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Look up the transfer to get the file name
    const transfer = transfers.get(fileId);
    
    if (!transfer) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const filePath = path.join(FILES_DIR, transfer.fileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    console.log(`📂 Serving file: ${transfer.fileName}`);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${transfer.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start file transfer with metadata (no actual file upload)
app.post('/api/transfer/start', async (req, res) => {
  try {
    const { 
      workflowId, 
      transferId, 
      fileName, 
      fileSize, 
      chunkSize, 
      chunks, 
      priority, 
      receiverIP, 
      transport, 
      relayUrl 
    } = req.body;
    
    console.log(`📤 Starting file transfer: ${fileName}`);
    console.log(`   Transfer ID: ${transferId}`);
    console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Chunks: ${chunks?.length || 0}`);
    console.log(`   Receiver: ${receiverIP}`);
    console.log(`   Transport: ${transport}`);
    // Let ML-style heuristic decide when priority is "auto" or missing
    const effectivePriority =
      priority && priority !== 'auto'
        ? priority
        : inferPriorityFromFile(fileName, fileSize);

    console.log(`   Priority: ${effectivePriority} (requested: ${priority || 'auto'})`);
    
    // Store transfer metadata
    transfers.set(transferId, {
      workflowId,
      fileName,
      fileSize,
      chunkSize,
      chunks,
      priority: effectivePriority,
      receiverIP,
      transport,
      relayUrl,
      status: 'initiated',
      progress: 0,
      createdAt: Date.now()
    });
    
    // Emit to connected clients
    io.emit('transfer-started', {
      transferId,
      fileName,
      fileSize,
      totalChunks: chunks?.length || 0,
      priority: effectivePriority,
    });
    
    res.json({
      success: true,
      transferId,
      fileName,
      totalChunks: chunks?.length || 0,
      message: 'Transfer initiated successfully'
    });
  } catch (error) {
    console.error('Transfer start error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Upload file for transfer (file-source node)
const fileUpload = multer({ dest: path.join(STORAGE_DIR, 'uploads') });

app.post('/api/transfer/upload-file', fileUpload.single('file'), async (req, res) => {
  try {
    const { transferId, receiverIP, receiverPort, receiverBaseUrl, transport, relayUrl } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`📤 Starting file transfer: ${file.originalname}`);
    if (receiverBaseUrl || process.env.RECEIVER_BASE_URL) {
      console.log(`   Receiver API base: ${receiverBaseUrl || process.env.RECEIVER_BASE_URL}`);
    }
    console.log(`   Transport: ${transport || 'wifi'}`);
    console.log(`   Relay URL: ${relayUrl || 'http://localhost:5001'}`);
    console.log(`   Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    const fileBuffer = await fs.readFile(file.path);
    // We have the file in memory now; remove temp file
    await fs.unlink(file.path).catch(() => {});

    // Align chunking with metadata from /api/transfer/start when available
    const existingTransfer = transferId ? transfers.get(transferId) : null;
    const newTransferId = transferId || uuidv4();
    const chunkSize = existingTransfer?.chunkSize || 64 * 1024; // default 64KB if no metadata
    const totalChunks = Math.ceil(fileBuffer.length / chunkSize);
    
    let transfer;
    if (existingTransfer) {
      transfer = {
        ...existingTransfer,
        id: newTransferId,
        fileName: file.originalname,
        fileSize: file.size,
        totalChunks,
        completedChunks: 0,
        status: 'transferring',
        transport: transport || existingTransfer.transport || 'relay',
        receiverIP,
        relayUrl: relayUrl || existingTransfer.relayUrl || 'http://localhost:5001',
        startTime: Date.now()
      };
    } else {
      transfer = {
        id: newTransferId,
        fileName: file.originalname,
        fileSize: file.size,
        totalChunks,
        completedChunks: 0,
        status: 'transferring',
        transport: transport || 'relay',
        receiverIP,
        relayUrl: relayUrl || 'http://localhost:5001',
        startTime: Date.now(),
        priority: inferPriorityFromFile(file.originalname, file.size),
      };
    }
    
    transfers.set(newTransferId, transfer);
    io.emit('transfer-started', transfer);

    // Queue this transfer to be sent according to priority
    transferQueue.push({
      transferId: newTransferId,
      fileBuffer,
      fileName: file.originalname,
      totalChunks,
      chunkSize,
      transport: transfer.transport,
      receiverIP,
      receiverPort: parseInt(receiverPort) || 8080,
      receiverBaseUrl,
      relayUrl: transfer.relayUrl,
    });

    // Start scheduler if idle
    processTransferQueue().catch((err) => {
      console.error('Scheduler start error:', err);
    });

    res.json({
      success: true,
      transferId: newTransferId,
      fileName: file.originalname,
      totalChunks,
      queued: true,
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer functions
async function transferViaRelay(transferId, fileBuffer, fileName, totalChunks, chunkSize, relayUrl = 'http://localhost:5001') {
  const FormData = (await import('form-data')).default;
  
  console.log(`📡 Uploading to relay server: ${relayUrl}`);
  
  for (let i = 0; i < totalChunks; i++) {
    // Check for cancellation before sending next chunk
    const current = transfers.get(transferId);
    if (!current || current.status === 'cancelled') {
      console.log(`🛑 Relay transfer cancelled, stopping at chunk ${i}/${totalChunks} for ${fileName}`);
      break;
    }
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileBuffer.length);
    const chunk = fileBuffer.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', Buffer.from(chunk), { filename: `chunk_${i}` });
    
    try {
      const response = await fetch(`${relayUrl}/relay/store/${transferId}/${i}`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const transfer = transfers.get(transferId);
        transfer.completedChunks = i + 1;
        // Ensure basic transfer stats exist
        transfer.status = transfer.status || 'active';
        transfer.startedAt = transfer.startedAt || transfer.startTime || Date.now();

        // Compute progress + speed + ETA for UI footer metrics
        const completedChunks = transfer.completedChunks;
        const progress = completedChunks / totalChunks;
        const elapsedSeconds = (Date.now() - transfer.startedAt) / 1000;
        const bytesTransferred = completedChunks * chunkSize;
        const speed = elapsedSeconds > 0 ? bytesTransferred / elapsedSeconds : 0;
        const remainingChunks = totalChunks - completedChunks;
        const eta =
          speed > 0 ? (remainingChunks * chunkSize) / speed : null;

        transfer.progress = progress;
        transfer.speed = speed;
        transfer.eta = eta;
        transfers.set(transferId, transfer);

        // Priority-based pacing for relay, same tiers as WiFi
        const priority = transfer.priority || 'medium';
        let delayMs = 0;
        switch (priority) {
          case 'low':
            delayMs = 120;
            break;
          case 'medium':
            delayMs = 60;
            break;
          case 'high':
            delayMs = 20;
            break;
          case 'critical':
          default:
            delayMs = 0;
            break;
        }
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        // Emit standardized update event used by the frontend footer
        io.emit('transfer:update', {
          transfer_id: transferId,
          progress,
          speed_bytes_s: speed,
          eta,
          status: transfer.status,
        });

        io.emit('transfer-progress', {
          transferId,
          progress: ((i + 1) / totalChunks) * 100,
          completedChunks: i + 1,
          totalChunks
        });
        
        console.log(`   Chunk ${i + 1}/${totalChunks} uploaded to relay`);
      } else {
        console.error(`   Failed to upload chunk ${i}:`, await response.text());
      }
    } catch (error) {
      console.error(`   Error uploading chunk ${i}:`, error.message);
    }
  }
  
  // Save file locally as well
  const outputPath = path.join(FILES_DIR, fileName);
  await fs.writeFile(outputPath, fileBuffer);
  
  const transfer = transfers.get(transferId);
  transfer.status = 'completed';
  transfer.outputPath = outputPath;
  transfers.set(transferId, transfer);
  
  // Notify all connected clients (including receiver)
  io.emit('transfer-completed', { transferId, fileName });
  io.emit('file-received', {
    fileId: transferId,
    fileName,
    fileSize: fileBuffer.length,
    outputPath,
    timestamp: new Date().toISOString()
  });
  
  console.log(`✅ Transfer completed via relay: ${fileName}`);
  console.log(`   Saved to: ${outputPath}`);
}

async function transferViaWiFi(transferId, fileBuffer, fileName, receiverIP, receiverPort, totalChunks, chunkSize, receiverBaseUrl) {
  const envBaseUrl = process.env.RECEIVER_BASE_URL;
  const baseUrl = receiverBaseUrl || envBaseUrl || (receiverIP && receiverPort ? `http://${receiverIP}:${receiverPort}` : null);

  console.log(`📶 WiFi transfer started: ${fileName}`);
  if (baseUrl) {
    console.log(`   Receiver HTTP base: ${baseUrl}`);
  } else {
    console.log('   Receiver HTTP base: (not configured, HTTP receiver API will be skipped)');
  }

  // Try to initialize transfer on external receiver backend (if available)
  let externalReceiverAvailable = false;
  if (baseUrl) {
    try {
      const transferMeta = transfers.get(transferId);
      const initPayload = {
        fileId: transferId,
        fileName,
        fileSize: fileBuffer.length,
        totalChunks,
        mimeType: 'application/octet-stream',
        transferMethod: 'wifi',
        bandwidthMbps: 10,
        lossPercent: 0,
        // Pass SureRoute's priority through to receiver backend
        priority: transferMeta?.priority || 'medium',
      };

      console.log(`🌐 Initializing transfer on receiver backend: ${baseUrl}/api/transfer/init`);

      const initResponse = await fetch(`${baseUrl}/api/transfer/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initPayload),
      });

      if (!initResponse.ok) {
        const text = await initResponse.text().catch(() => '');
        console.warn(`⚠️  Receiver init failed (${initResponse.status}): ${text}`);
      } else {
        const json = await initResponse.json().catch(() => ({}));
        console.log('✅ Receiver init response:', json);
        externalReceiverAvailable = true;
      }
    } catch (err) {
      console.warn(`⚠️  Could not reach receiver backend at ${baseUrl}: ${err.message}`);
    }
  }

  for (let i = 0; i < totalChunks; i++) {
    // Check for cancellation before sending next chunk
    const current = transfers.get(transferId);
    if (!current || current.status === 'cancelled') {
      console.log(`🛑 WiFi transfer cancelled, stopping at chunk ${i}/${totalChunks} for ${fileName}`);
      break;
    }
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileBuffer.length);
    const chunk = fileBuffer.slice(start, end);

    // Send chunk to external receiver backend via HTTP only (no Socket.IO receiver panel)
    if (externalReceiverAvailable && baseUrl) {
      try {
        const chunkHash = crypto.createHash('sha256').update(chunk).digest('hex');

        const httpPayload = {
          fileId: transferId,
          chunkIndex: i,
          chunkData: chunk.toString('base64'),
          chunkHash,
          transferMethod: 'wifi',
        };

        const chunkResponse = await fetch(`${baseUrl}/api/transfer/chunk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(httpPayload),
        });

        if (!chunkResponse.ok) {
          const text = await chunkResponse.text().catch(() => '');
          console.warn(`⚠️  Receiver chunk ${i} failed (${chunkResponse.status}): ${text}`);
        } else {
          console.log(`🌐 Sent chunk ${i + 1}/${totalChunks} to receiver backend`);
        }
      } catch (err) {
        console.warn(`⚠️  Error sending chunk ${i} to receiver backend: ${err.message}`);
      }
    }

    const transfer = transfers.get(transferId);
    transfer.completedChunks = i + 1;
    transfer.status = transfer.status || 'active';
    transfer.startedAt = transfer.startedAt || transfer.startTime || Date.now();

    // Compute progress + speed + ETA similar to the chunked upload endpoint
    const completedChunks = transfer.completedChunks;
    const progress = completedChunks / totalChunks;
    const elapsedSeconds = (Date.now() - transfer.startedAt) / 1000;
    const bytesTransferred = completedChunks * chunkSize;
    const speed = elapsedSeconds > 0 ? bytesTransferred / elapsedSeconds : 0;
    const remainingChunks = totalChunks - completedChunks;
    const eta =
      speed > 0 ? (remainingChunks * chunkSize) / speed : null;

    transfer.progress = progress;
    transfer.speed = speed;
    transfer.eta = eta;
    transfers.set(transferId, transfer);

    // Priority-based pacing: strong differentiation between levels
    const priority = transfer.priority || 'medium';
    let delayMs = 0;
    switch (priority) {
      case 'low':
        delayMs = 120; // very slow
        break;
      case 'medium':
        delayMs = 60;  // moderate
        break;
      case 'high':
        delayMs = 20;  // faster
        break;
      case 'critical':
      default:
        delayMs = 0;   // no throttling
        break;
    }
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Emit standardized update event used by the frontend footer
    io.emit('transfer:update', {
      transfer_id: transferId,
      progress,
      speed_bytes_s: speed,
      eta,
      status: transfer.status,
    });

    // Send progress to all connected UIs (legacy event used for logs)
    const progressData = {
      transferId,
      progress: ((i + 1) / totalChunks) * 100,
      completedChunks: i + 1,
      totalChunks
    };

    io.emit('transfer-progress', progressData);
  }
  
  const outputPath = path.join(FILES_DIR, fileName);
  await fs.writeFile(outputPath, fileBuffer);
  
  const transfer = transfers.get(transferId);
  transfer.status = 'completed';
  transfer.outputPath = outputPath;
  transfers.set(transferId, transfer);
  
  const completionData = {
    fileId: transferId,
    fileName,
    fileSize: fileBuffer.length,
    outputPath,
    timestamp: new Date().toISOString(),
    receiverIP
  };
  
  // Notify UI listeners (no receiver panel path)
  io.emit('file-received', completionData);
  io.emit('transfer-completed', { transferId, fileName });
  console.log(`✅ Transfer completed via WiFi: ${fileName}`);
  console.log(`   Saved to: ${outputPath}`);
}

// Simple scheduler: process one transfer at a time, picking highest-priority first
async function processTransferQueue() {
  if (activeTransferId || transferQueue.length === 0) {
    return;
  }

  // Priority weights: higher value = higher priority
  const priorityWeight = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };

  // Pick job whose transfer has highest priority
  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < transferQueue.length; i++) {
    const job = transferQueue[i];
    const transfer = transfers.get(job.transferId);
    const prio = transfer?.priority || 'medium';
    const score = priorityWeight[prio] ?? 1;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  const [job] = transferQueue.splice(bestIndex, 1);
  activeTransferId = job.transferId;

  // If transfer was cancelled while in queue, skip it
  const transfer = transfers.get(job.transferId);
  if (!transfer || transfer.status === 'cancelled') {
    console.log(`ℹ️  Skipping queued transfer ${job.transferId} (cancelled before start)`);
    activeTransferId = null;
    if (transferQueue.length > 0) {
      processTransferQueue().catch((e) => console.error('Scheduler error:', e));
    }
    return;
  }

  try {
    if (job.transport === 'relay') {
      await transferViaRelay(
        job.transferId,
        job.fileBuffer,
        job.fileName,
        job.totalChunks,
        job.chunkSize,
        job.relayUrl
      );
    } else {
      await transferViaWiFi(
        job.transferId,
        job.fileBuffer,
        job.fileName,
        job.receiverIP,
        job.receiverPort,
        job.totalChunks,
        job.chunkSize,
        job.receiverBaseUrl
      );
    }
  } catch (err) {
    console.error('Error processing transfer from queue:', err);
  } finally {
    activeTransferId = null;
    // Start next job if any
    if (transferQueue.length > 0) {
      // Fire and forget
      processTransferQueue().catch((e) =>
        console.error('Scheduler error:', e)
      );
    }
  }
}

const PORT = process.env.PORT || 5000;

// Initialize MongoDB at startup so we fail fast if DB config is wrong.
(async () => {
  try {
    console.log('[Startup] Initializing MongoDB connection...');
    await getDb();
    console.log('[Startup] MongoDB connection ready.');
  } catch (err) {
    console.error(
      '[Startup] MongoDB connection failed. Auth endpoints will not work until this is fixed.',
      err,
    );
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ SureRoute Backend running on port ${PORT}`);
    console.log(`📂 Storage directory: ${STORAGE_DIR}`);
    console.log(
      `🔗 P2P Manager: ${p2pManager.localPeerId.substring(0, 8)}...`,
    );
    console.log(
      `📱 Bluetooth: ${bluetoothManager.isAvailable() ? 'Available' : 'Unavailable'}`,
    );
  });
})();

// Cleanup on shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  p2pManager.stopDiscovery();
  await bluetoothManager.cleanup();
  await p2pManager.cleanup();
  
  process.exit(0);
});
