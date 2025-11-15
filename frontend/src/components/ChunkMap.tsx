import React from 'react';

export default function ChunkMap({ bitmap }: { bitmap: boolean[] }) {
  if (!bitmap || bitmap.length === 0) {
    return <div className="text-xs text-gray-400">No chunks</div>;
  }
  const cols = 20;
  const rows = Math.ceil(bitmap.length / cols);
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 2 }}>
      {bitmap.map((b, i) => (
        <div
          key={i}
          className="h-2 rounded"
          style={{ background: b ? '#16a34a' : '#374151' }}
          title={`Chunk ${i}: ${b ? 'done' : 'pending'}`}
        />
      ))}
      {Array(Math.max(0, rows * cols - bitmap.length))
        .fill(0)
        .map((_, i) => (
          <div key={`p${i}`} className="h-2 rounded bg-gray-800" />
        ))}
    </div>
  );
}


