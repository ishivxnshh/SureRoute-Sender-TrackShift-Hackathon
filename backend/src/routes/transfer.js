import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  ensureDataDirs,
  readTransferState,
  writeTransferState,
  listExistingChunks,
  writeChunk,
  assembleFile,
  getAssembledPath,
  markChunkReceived
} from '../store.js';
import { sha256Buffer, sha256File } from '../utils/hash.js';
import { getConditions, sleep } from '../simulatorClient.js';
import { acquireSlot, PRIORITY, setHighActive } from '../scheduler.js';
import { emitTelemetry, emitTransferUpdate } from '../ws.js';

const router = express.Router();

// Accept raw binary for chunk uploads
router.use((req, res, next) => {
  if (req.is('application/octet-stream')) {
    let data = [];
    req.on('data', (chunk) => data.push(chunk));
    req.on('end', () => {
      req.rawBody = Buffer.concat(data);
      next();
    });
  } else {
    next();
  }
});

router.post('/manifest', (req, res) => {
  ensureDataDirs();
  const manifest = req.body || {};
  let { transfer_id: transferId } = manifest;
  const {
    file_name: fileName,
    file_size: fileSize,
    chunk_size: chunkSize = 1024 * 1024,
    chunks = [],
    global_sha256: globalSha256,
    priority = 'medium'
  } = manifest;

  if (!transferId) transferId = uuidv4();
  if (!fileName || !fileSize || !chunkSize || !Array.isArray(chunks) || chunks.length === 0) {
    return res.status(400).json({ error: 'invalid manifest' });
  }
  if (!['high', 'medium', 'low'].includes(priority)) {
    return res.status(400).json({ error: 'invalid priority' });
  }

  const totalChunks = chunks.length;
  const existingState = readTransferState(transferId);
  const state = existingState || {
    transfer_id: transferId,
    file_name: fileName,
    file_size: fileSize,
    chunk_size: chunkSize,
    chunks,
    global_sha256: globalSha256,
    priority,
    total_chunks: totalChunks,
    received_chunks: Array(totalChunks).fill(false),
    created_at: Date.now(),
    completed: false,
    transport: 'wifi'
  };

  // Update priority if changed
  state.priority = priority;

  // Determine missing chunks from disk
  const present = listExistingChunks(transferId, totalChunks);
  present.forEach((idx) => {
    state.received_chunks[idx] = true;
  });

  writeTransferState(transferId, state);

  const missing = [];
  for (let i = 0; i < totalChunks; i += 1) {
    if (!state.received_chunks[i]) missing.push(i);
  }

  // High priority flag for scheduler
  setHighActive(state.priority === 'high');

  emitTransferUpdate({
    type: 'transfer:update',
    transfer_id: transferId,
    progress: state.received_chunks.filter(Boolean).length / totalChunks,
    speed: 0,
    eta_secs: null,
    priority: state.priority,
    transport: state.transport
  });

  return res.json({ transfer_id: transferId, missing_chunks: missing });
});

router.post('/:transfer_id/chunk/:index', async (req, res) => {
  const transferId = req.params.transfer_id;
  const index = Number(req.params.index);
  const state = readTransferState(transferId);
  if (!state) return res.status(404).json({ error: 'transfer not found' });
  if (state.completed) return res.status(400).json({ error: 'transfer already completed' });
  if (!Number.isInteger(index) || index < 0 || index >= state.total_chunks) {
    return res.status(400).json({ error: 'invalid chunk index' });
  }
  const hashHeader = req.header('X-Chunk-Hash');
  if (!hashHeader) return res.status(400).json({ error: 'missing X-Chunk-Hash header' });
  if (!req.rawBody) return res.status(400).json({ error: 'missing binary body' });

  // Scheduler acquire slot per priority
  const priority = state.priority || 'medium';
  const release = await acquireSlot(priority);
  const startTs = Date.now();

  try {
    // Apply simulator conditions
    const cond = await getConditions();
    if (cond.down) {
      await sleep(100 + Math.random() * 200);
      return res.status(503).json({ error: 'link down (simulated)' });
    }
    const computedHash = sha256Buffer(req.rawBody);
    if (Math.random() < (cond.packet_loss || 0)) {
      // drop packet
      return res.status(500).json({ error: 'simulated packet loss' });
    }
    // latency + jitter
    const jitter = cond.jitter_ms ? (Math.random() - 0.5) * cond.jitter_ms : 0;
    const delay = Math.max(0, (cond.latency_ms || 0) + jitter);
    if (delay) await sleep(delay);

    if (computedHash !== hashHeader) {
      return res.status(400).json({ error: 'chunk hash mismatch' });
    }

    writeChunk(transferId, index, req.rawBody);
    await markChunkReceived(transferId, index);
    
    // Re-read state after atomic update
    const updatedState = readTransferState(transferId);
    const receivedCount = updatedState.received_chunks.filter(Boolean).length;
    const progress = receivedCount / state.total_chunks;
    const durationMs = Math.max(1, Date.now() - startTs);
    const speed = Math.round(req.rawBody.length / (durationMs / 1000));
    emitTelemetry({
      type: 'telemetry',
      transfer_id: transferId,
      rtt_ms: delay,
      packet_loss: cond.packet_loss || 0,
      priority,
      speed
    });
    emitTransferUpdate({
      type: 'transfer:update',
      transfer_id: transferId,
      progress,
      speed,
      eta_secs: Math.round(((state.total_chunks - receivedCount) * durationMs) / 1000),
      priority,
      transport: state.transport
    });

    return res.json({ index, success: true });
  } finally {
    release();
  }
});

router.get('/:transfer_id/status', (req, res) => {
  const { transfer_id: transferId } = req.params;
  const state = readTransferState(transferId);
  if (!state) return res.status(404).json({ error: 'transfer not found' });
  return res.json({
    transfer_id: state.transfer_id,
    file_name: state.file_name,
    file_size: state.file_size,
    chunk_size: state.chunk_size,
    total_chunks: state.total_chunks,
    received_chunks: state.received_chunks,
    completed: state.completed,
    priority: state.priority,
    transport: state.transport
  });
});

router.post('/:transfer_id/complete', async (req, res) => {
  const transferId = req.params.transfer_id;
  const state = readTransferState(transferId);
  if (!state) return res.status(404).json({ error: 'transfer not found' });
  const allReceived = state.received_chunks.every(Boolean);
  if (!allReceived) return res.status(400).json({ error: 'missing chunks' });

  const outPath = assembleFile(transferId, state.total_chunks, state.file_name);
  const checksum = await sha256File(outPath);
  if (state.global_sha256 && checksum !== state.global_sha256) {
    return res.status(400).json({ error: 'global checksum mismatch', checksum, expected: state.global_sha256 });
  }

  state.completed = true;
  writeTransferState(transferId, state);
  emitTransferUpdate({
    type: 'transfer:update',
    transfer_id: transferId,
    progress: 1,
    speed: 0,
    eta_secs: 0,
    priority: state.priority,
    transport: state.transport
  });

  return res.json({ ok: true, assembled_path: getAssembledPath(transferId, state.file_name), checksum });
});

export default router;


