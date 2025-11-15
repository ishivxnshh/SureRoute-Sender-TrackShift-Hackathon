import path from 'path';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';

function sha256(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (d) => hash.update(d));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function main() {
  const backend = process.env.BACKEND || 'http://localhost:4000';
  const filePath = path.resolve(process.cwd(), './resume.data');
  const size = 3 * 1024 * 1024; // 3MB
  const chunkSize = 1024 * 1024;
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.alloc(size, 0xcd));
  }
  const totalChunks = Math.ceil(size / chunkSize);
  const chunks = [];
  for (let i = 0; i < totalChunks; i += 1) {
    const start = i * chunkSize;
    const len = Math.min(chunkSize, size - start);
    const buf = Buffer.alloc(len, 0xcd);
    chunks.push(sha256(buf));
  }
  const globalSha = await sha256File(filePath);
  const manifest = {
    transfer_id: crypto.randomUUID(),
    file_name: path.basename(filePath),
    file_size: size,
    chunk_size: chunkSize,
    chunks,
    global_sha256: globalSha,
    priority: 'low'
  };
  const m1 = await axios.post(`${backend}/transfer/manifest`, manifest);
  const { transfer_id: transferId } = m1.data;
  // Upload first half
  const firstHalf = Math.floor(totalChunks / 2);
  for (let i = 0; i < firstHalf; i += 1) {
    const start = i * chunkSize;
    const len = Math.min(chunkSize, size - start);
    const buf = Buffer.alloc(len, 0xcd);
    await axios.post(`${backend}/transfer/${transferId}/chunk/${i}`, buf, {
      headers: { 'Content-Type': 'application/octet-stream', 'X-Chunk-Hash': chunks[i] }
    });
  }
  // Simulate stop; then resume via manifest
  const m2 = await axios.post(`${backend}/transfer/manifest`, { ...manifest, transfer_id: transferId });
  const { missing_chunks } = m2.data;
  for (const i of missing_chunks) {
    const start = i * chunkSize;
    const len = Math.min(chunkSize, size - start);
    const buf = Buffer.alloc(len, 0xcd);
    await axios.post(`${backend}/transfer/${transferId}/chunk/${i}`, buf, {
      headers: { 'Content-Type': 'application/octet-stream', 'X-Chunk-Hash': chunks[i] }
    });
  }
  const complete = await axios.post(`${backend}/transfer/${transferId}/complete`);
  console.log('Resume complete:', complete.data.ok ? 'OK' : 'FAILED');
  process.exit(complete.data.ok ? 0 : 1);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});


