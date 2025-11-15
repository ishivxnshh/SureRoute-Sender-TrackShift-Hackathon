export interface FileAttributes {
  priority: 'high' | 'medium' | 'low';
  chunkSizeMB: number;
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface UploadOptions {
  baseUrl?: string; // e.g. https://data-receiver.onrender.com
  transferMethod?: 'wifi' | 'bluetooth';
  onProgress?: (pct: number) => void;
}

export async function uploadFileWithChunks(file: File, attrs: FileAttributes, options?: UploadOptions) {
  const baseUrl =
    options?.baseUrl ||
    (import.meta as any).env.VITE_RECEIVER_BASE ||
    'https://data-receiver.onrender.com';
  const onProgress = options?.onProgress;
  const transferMethod = options?.transferMethod || 'wifi';

  const chunkSize = Math.max(1, attrs.chunkSizeMB) * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);

  const chunkBuffers: ArrayBuffer[] = [];
  const chunkHashes: string[] = [];

  // Split into chunks, compute per-chunk hash
  for (let i = 0; i < totalChunks; i += 1) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const blob = file.slice(start, end);
    const buf = await blob.arrayBuffer();
    const h = await sha256(buf);
    chunkBuffers.push(buf);
    chunkHashes.push(h);
    if (onProgress) {
      const pct = Math.round(((i + 0.5) / (totalChunks + 2)) * 100);
      onProgress(Math.min(99, pct));
    }
  }

  // Whole-file hash for logging/verification
  const fullBuf = await file.arrayBuffer();
  const fullHash = await sha256(fullBuf);

  // Client-generated fileId for this transfer
  const fileId =
    (crypto as any).randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  // 1) Initialize transfer
  const initRes = await fetch(`${baseUrl}/api/transfer/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      mimeType: file.type || 'application/octet-stream',
      transferMethod
    })
  });

  if (!initRes.ok) {
    throw new Error(`Receiver init failed with status ${initRes.status}`);
  }

  // 2) Upload chunks sequentially
  for (let i = 0; i < totalChunks; i += 1) {
    const buf = chunkBuffers[i];
    const body = {
      fileId,
      chunkIndex: i,
      chunkData: bufferToBase64(buf),
      chunkHash: chunkHashes[i],
      transferMethod
    };

    const chunkRes = await fetch(`${baseUrl}/api/transfer/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!chunkRes.ok) {
      throw new Error(`Receiver chunk ${i} failed with status ${chunkRes.status}`);
    }

    if (onProgress) {
      const pct = Math.round(((i + 1) / (totalChunks + 2)) * 100);
      onProgress(Math.min(100, pct));
    }
  }

  // Return manifest for logging
  return {
    fileId,
    fileName: file.name,
    fileSize: file.size,
    chunkSize,
    totalChunks,
    chunkHashes,
    fullHash
  };
}


