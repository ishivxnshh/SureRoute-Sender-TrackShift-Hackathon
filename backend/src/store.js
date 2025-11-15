import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirp } from 'mkdirp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataRoot = path.join(__dirname, '../data');
const chunksRoot = path.join(dataRoot, 'chunks');
const transfersRoot = path.join(dataRoot, 'transfers');
const assembledRoot = path.join(dataRoot, 'assembled');

// Simple in-memory locks per transfer to prevent race conditions
const stateLocks = new Map();

export function ensureDataDirs() {
  mkdirp.sync(chunksRoot);
  mkdirp.sync(transfersRoot);
  mkdirp.sync(assembledRoot);
}

export function getTransferStatePath(transferId) {
  return path.join(transfersRoot, `${transferId}.json`);
}

export function getChunksDir(transferId) {
  return path.join(chunksRoot, transferId);
}

export function readTransferState(transferId) {
  const statePath = getTransferStatePath(transferId);
  if (!fs.existsSync(statePath)) return null;
  const raw = fs.readFileSync(statePath, 'utf8');
  return JSON.parse(raw);
}

export function writeTransferState(transferId, state) {
  const statePath = getTransferStatePath(transferId);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

// Atomic update of a chunk's received status
export function markChunkReceived(transferId, index) {
  if (!stateLocks.has(transferId)) {
    stateLocks.set(transferId, Promise.resolve());
  }
  const lock = stateLocks.get(transferId);
  const next = lock.then(() => {
    const state = readTransferState(transferId);
    if (state) {
      state.received_chunks[index] = true;
      writeTransferState(transferId, state);
    }
  });
  stateLocks.set(transferId, next);
  return next;
}

export function writeChunk(transferId, index, buffer) {
  const dir = getChunksDir(transferId);
  mkdirp.sync(dir);
  const file = path.join(dir, `${index}`);
  fs.writeFileSync(file, buffer);
}

export function readChunk(transferId, index) {
  const file = path.join(getChunksDir(transferId), `${index}`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file);
}

export function chunkExists(transferId, index) {
  const file = path.join(getChunksDir(transferId), `${index}`);
  return fs.existsSync(file);
}

export function assembleFile(transferId, totalChunks, fileName) {
  const outPath = path.join(assembledRoot, `${transferId}_${fileName}`);
  const fd = fs.openSync(outPath, 'w');
  try {
    for (let i = 0; i < totalChunks; i += 1) {
      const part = readChunk(transferId, i);
      if (!part) throw new Error(`Missing chunk ${i}`);
      fs.writeSync(fd, part);
    }
  } finally {
    fs.closeSync(fd);
  }
  return outPath;
}

export function listExistingChunks(transferId, totalChunks) {
  const present = [];
  for (let i = 0; i < totalChunks; i += 1) {
    if (chunkExists(transferId, i)) {
      present.push(i);
    }
  }
  return present;
}

export function getAssembledPath(transferId, fileName) {
  return path.join(assembledRoot, `${transferId}_${fileName}`);
}


