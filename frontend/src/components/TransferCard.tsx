import React from 'react';
import ChunkMap from './ChunkMap';
import { useStore } from '../store/useStore';

export default function TransferCard({ id }: { id: string }) {
  const t = useStore((s) => s.transfers[id]);
  const select = useStore((s) => s.select);
  if (!t) return null;
  const pct = Math.round((t.progress || 0) * 100);
  const badgeClass = t.priority === 'high' ? 'badge-high' : t.priority === 'medium' ? 'badge-medium' : 'badge-low';
  return (
    <div className="transfer-card cursor-pointer" onClick={() => select(id)}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold flex-1 min-w-0 truncate" title={t.fileName}>
          {t.fileName}
        </div>
        <div className={`badge ${badgeClass}`}>{t.priority}</div>
      </div>
      <div className="text-xs text-gray-400 mt-1">{(t.size / (1024 * 1024)).toFixed(1)} MB</div>
      <div className="mt-2 flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 36 36" className="w-10 h-10">
            <path
              className="text-gray-700"
              stroke="currentColor"
              fill="none"
              strokeWidth="3"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-green-500"
              stroke="currentColor"
              fill="none"
              strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{pct}%</div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-300">
            {Math.max(0, Math.round(t.speed / 1024))} KB/s • {t.etaSecs ? `${t.etaSecs}s ETA` : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 capitalize">Mode: {t.transport}</div>
        </div>
      </div>
      <div className="mt-2">
        <ChunkMap bitmap={t.chunkBitmap || []} />
      </div>
    </div>
  );
}


