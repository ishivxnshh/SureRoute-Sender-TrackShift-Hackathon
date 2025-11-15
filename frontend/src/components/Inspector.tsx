import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { SelectedElement } from './Canvas';
import { uploadFileWithChunks, FileAttributes } from '../lib/fileUpload';

// Hardcoded receiver base URL – adjust this to match your deployed receiver backend host
const RECEIVER_BASE_URL = 'https://data-receiver.onrender.com';

interface InspectorProps {
  selected: SelectedElement;
}

export default function Inspector({ selected }: InspectorProps) {
  const transfers = useStore((s) => s.transfers);
  const addActivity = useStore((s) => s.addActivity);
  // File-node upload state (kept at top level to satisfy React hook rules)
  const [pendingFiles, setPendingFiles] = useState<
    {
      id: string;
      file: File;
      attrs: FileAttributes;
      uploading: boolean;
      progress: number;
      error?: string;
      fileId?: string;
    }[]
  >([]);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const next: typeof pendingFiles = [];
    Array.from(fileList).forEach((file) => {
      next.push({
        id: `${file.name}-${file.lastModified}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        attrs: { priority: 'medium', chunkSizeMB: 1 },
        uploading: false,
        progress: 0
      });
    });
    setPendingFiles((prev) => [...prev, ...next]);
  }, []);

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const updateAttrs = (id: string, patch: Partial<FileAttributes>) => {
    setPendingFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, attrs: { ...item.attrs, ...patch } } : item))
    );
  };

  const startUpload = async (id: string) => {
    // mark as uploading
    setPendingFiles((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: true, error: undefined } : p)));

    const entry = pendingFiles.find((p) => p.id === id);
    if (!entry) return;

    try {
      addActivity(`Preparing upload for ${entry.file.name} (${(entry.file.size / (1024 * 1024)).toFixed(2)} MB)`);
      const manifest = await uploadFileWithChunks(entry.file, entry.attrs, {
        baseUrl: RECEIVER_BASE_URL,
        transferMethod: 'wifi',
        fileId: entry.fileId,
        resume: !!entry.fileId,
        onProgress: (pct) => {
          setPendingFiles((prev) => prev.map((p) => (p.id === id ? { ...p, progress: pct } : p)));
        }
      });
      addActivity(
        `Uploaded ${manifest.fileName} to receiver: ${manifest.totalChunks} chunks, sha256=${manifest.fullHash.slice(
          0,
          8
        )}…`
      );
      setPendingFiles((prev) =>
        prev
          .map((p) => (p.id === id ? { ...p, fileId: manifest.fileId } : p))
          .filter((p) => p.id !== id)
      );
    } catch (err: any) {
      const msg = err?.message || 'Upload failed';
      addActivity(`Upload error for ${entry.file.name}: ${msg}`);
      setPendingFiles((prev) => prev.map((p) => (p.id === id ? { ...p, uploading: false, error: msg } : p)));
    }
  };

  if (!selected) {
    return <div className="panel-placeholder">Select a node or link to inspect.</div>;
  }

  if (selected.kind === 'node') {
    const node = selected.node;
    const isFileNode = node.data?.type === 'file';

    return (
      <div>
        <div className="panel-title mb-1">Node</div>
        <div className="inspector-grid">
          <label>Label</label>
          <div>{node.data?.label}</div>
          <label>Type</label>
          <div>{node.data?.type}</div>
          <label>Stats</label>
          <div>{node.data?.stats || 'Idle'}</div>
          <label>Position</label>
          <div>
            {Math.round(node.position.x)}, {Math.round(node.position.y)}
          </div>
        </div>
        {!isFileNode && <button className="pill primary w-full mt-3">Ask AI for tuning</button>}
        {isFileNode && (
          <div className="mt-4 space-y-3">
            <div
              className="border border-dashed border-gray-500 rounded-lg p-3 text-xs text-gray-300 text-center cursor-pointer hover:border-gray-300"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.getElementById('file-node-input') as HTMLInputElement | null;
                input?.click();
              }}
            >
              Drop files here or click to select
              <input
                id="file-node-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
            {pendingFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                {pendingFiles.length > 1 && (
                  <button
                    className="pill primary w-full mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={pendingFiles.every((p) => p.uploading)}
                    onClick={async () => {
                      // execute uploads for all pending files sequentially, ordered by priority
                      const priorityRank: Record<FileAttributes['priority'], number> = {
                        high: 0,
                        medium: 1,
                        low: 2
                      };
                      const snapshot = [...pendingFiles].sort(
                        (a, b) => priorityRank[a.attrs.priority] - priorityRank[b.attrs.priority]
                      );
                      for (const item of snapshot) {
                        await startUpload(item.id);
                      }
                    }}
                  >
                    Execute all uploads
                  </button>
                )}
                {pendingFiles.map((item) => (
                  <div key={item.id} className="border border-gray-700 rounded-md p-2 space-y-1 bg-black/20">
                    <div className="flex justify-between items-center gap-2">
                      <div className="truncate font-semibold">{item.file.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <label className="text-[10px] uppercase tracking-wide text-gray-400">Priority</label>
                      <select
                        value={item.attrs.priority}
                        onChange={(e) =>
                          updateAttrs(item.id, { priority: e.target.value as FileAttributes['priority'] })
                        }
                        className="bg-transparent border border-gray-600 rounded px-1 py-0.5 text-xs"
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                      </select>
                      <label className="text-[10px] uppercase tracking-wide text-gray-400">Chunk MB</label>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        value={item.attrs.chunkSizeMB}
                        onChange={(e) =>
                          updateAttrs(item.id, { chunkSizeMB: Number(e.target.value) || item.attrs.chunkSizeMB })
                        }
                        className="bg-transparent border border-gray-600 rounded px-1 py-0.5 w-14 text-xs"
                      />
                    </div>
                    {item.uploading && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 bg-green-500"
                            style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{item.progress}%</div>
                      </div>
                    )}
                    {item.error && <div className="text-[10px] text-red-400 mt-0.5">{item.error}</div>}
                    <button
                      className="pill primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={item.uploading}
                      onClick={() => startUpload(item.id)}
                    >
                      {item.uploading ? 'Uploading…' : 'Send to Receiver'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  const edge = selected.edge;
  const transfer = edge.data?.transferId ? transfers[edge.data.transferId] : null;
  return (
    <div>
      <div className="panel-title mb-1">Link</div>
      <div className="inspector-grid">
        <label>Connection</label>
        <div>
          {edge.source} → {edge.target}
        </div>
        <label>Label</label>
        <div>{edge.label || 'Untitled link'}</div>
        {transfer && (
          <>
            <label>Transfer</label>
            <div>{transfer.fileName}</div>
            <label>Progress</label>
            <div>{Math.round(transfer.progress * 100)}%</div>
            <label>Speed</label>
            <div>{Math.round(transfer.speed / 1024)} KB/s</div>
          </>
        )}
      </div>
      {!transfer && <button className="pill primary w-full mt-3">Bind Transfer</button>}
    </div>
  );
}


