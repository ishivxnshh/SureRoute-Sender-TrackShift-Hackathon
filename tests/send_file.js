import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { Command } from 'commander';
import axios from 'axios';

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
  const program = new Command();
  program
    .option('--file <path>', 'file to send', './sample.data')
    .option('--sizeMB <n>', 'generate sample file with size MB if not exists', '5')
    .option('--chunkSize <n>', 'chunk size bytes', '1048576')
    .option('--backend <url>', 'backend url', 'http://localhost:4000')
    .option('--concurrency <n>', 'concurrency', '4')
    .option('--priority <level>', 'priority: high, medium, or low', 'medium');
  program.parse(process.argv);
  const opts = program.opts();
  const filePath = path.resolve(process.cwd(), opts.file);
  const sizeMB = Number(opts.sizeMB);
  const chunkSize = Number(opts.chunkSize);
  const backend = opts.backend.replace(/\/$/, '');
  const concurrency = Number(opts.concurrency);
  const priority = opts.priority.toLowerCase();

  // Generate sample file if needed
  if (!fs.existsSync(filePath)) {
    const fd = fs.openSync(filePath, 'w');
    const totalBytes = sizeMB * 1024 * 1024;
    const buf = Buffer.alloc(1024 * 1024, 0xab);
    let written = 0;
    while (written < totalBytes) {
      const toWrite = Math.min(buf.length, totalBytes - written);
      fs.writeSync(fd, buf.subarray(0, toWrite));
      written += toWrite;
    }
    fs.closeSync(fd);
    console.log(`Generated sample file: ${filePath} (${sizeMB}MB)`);
  }

  const stats = fs.statSync(filePath);
  const totalSize = stats.size;
  const totalChunks = Math.ceil(totalSize / chunkSize);
  console.log(`Preparing manifest: size=${totalSize} chunks=${totalChunks}`);

  const chunks = [];
  const fd = fs.openSync(filePath, 'r');
  for (let i = 0; i < totalChunks; i += 1) {
    const start = i * chunkSize;
    const len = Math.min(chunkSize, totalSize - start);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, start);
    chunks.push(sha256(buf));
  }
  fs.closeSync(fd);
  const globalSha = await sha256File(filePath);

  const manifest = {
    transfer_id: crypto.randomUUID(),
    file_name: path.basename(filePath),
    file_size: totalSize,
    chunk_size: chunkSize,
    chunks,
    global_sha256: globalSha,
    priority: priority
  };

  // Post manifest
  const manifestRes = await axios.post(`${backend}/transfer/manifest`, manifest);
  const { transfer_id: transferId, missing_chunks: missing } = manifestRes.data;
  console.log(`Transfer: ${transferId}, missing ${missing.length} chunks`);

  // Upload with limited concurrency
  let active = 0;
  let idx = 0;
  let completed = 0;
  const failures = [];

  async function uploadOne(index) {
    const start = index * chunkSize;
    const len = Math.min(chunkSize, totalSize - start);
    const buf = Buffer.alloc(len);
    fs.readSync(fs.openSync(filePath, 'r'), buf, 0, len, start);
    try {
      await axios.post(`${backend}/transfer/${transferId}/chunk/${index}`, buf, {
        headers: { 'Content-Type': 'application/octet-stream', 'X-Chunk-Hash': chunks[index] },
        timeout: 30000
      });
      completed += 1;
      process.stdout.write(`\rUploaded ${completed}/${missing.length}`);
    } catch (e) {
      failures.push(index);
    }
  }

  const queue = [...missing];
  const promises = [];
  async function worker() {
    while (queue.length) {
      const i = queue.shift();
      await uploadOne(i);
    }
  }
  for (let i = 0; i < concurrency; i += 1) {
    promises.push(worker());
  }
  await Promise.all(promises);
  console.log('');
  if (failures.length) {
    console.log(`Retrying ${failures.length} failed chunks...`);
    for (const i of failures) {
      await uploadOne(i);
    }
    console.log('');
  }

  try {
    const complete = await axios.post(`${backend}/transfer/${transferId}/complete`);
    console.log('Complete:', complete.data);
    if (complete.data.checksum !== globalSha) {
      console.error('Checksum mismatch!');
      process.exit(1);
    } else {
      console.log('Checksum verified.');
    }
  } catch (err) {
    console.error('Complete failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});


