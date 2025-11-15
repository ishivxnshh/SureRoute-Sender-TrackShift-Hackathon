import crypto from 'crypto';
import fs from 'fs';

export function sha256Buffer(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

export function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(path);
    stream.on('data', (d) => hash.update(d));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}


