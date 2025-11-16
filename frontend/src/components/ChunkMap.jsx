import React, { useState } from 'react';
import './ChunkMap.css';

const ChunkMap = ({ transfer }) => {
  const [hoveredChunk, setHoveredChunk] = useState(null);
  
  const totalChunks = transfer.chunks?.length || 100;
  const chunkStatus = transfer.chunkStatus || {};

  const getChunkColor = (status) => {
    switch (status) {
      case 'complete':
        return '#4ade80';
      case 'uploading':
        return '#3b82f6';
      case 'error':
        return '#ef4444';
      case 'retrying':
        return '#fbbf24';
      default:
        return '#2d3655';
    }
  };

  const getChunkLabel = (status) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'uploading':
        return 'Uploading';
      case 'error':
        return 'Error';
      case 'retrying':
        return 'Retrying';
      default:
        return 'Pending';
    }
  };

  const chunks = Array.from({ length: totalChunks }, (_, i) => ({
    index: i,
    status: chunkStatus[i] || 'pending',
    hash: `sha256_${i.toString().padStart(4, '0')}`,
  }));

  const statusCounts = chunks.reduce((acc, chunk) => {
    acc[chunk.status] = (acc[chunk.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="chunk-map-container">
      <div className="chunk-stats">
        <div className="stat-item">
          <div className="stat-color" style={{ background: '#4ade80' }}></div>
          <span>{statusCounts.complete || 0} Complete</span>
        </div>
        <div className="stat-item">
          <div className="stat-color" style={{ background: '#3b82f6' }}></div>
          <span>{statusCounts.uploading || 0} Uploading</span>
        </div>
        <div className="stat-item">
          <div className="stat-color" style={{ background: '#ef4444' }}></div>
          <span>{statusCounts.error || 0} Error</span>
        </div>
        <div className="stat-item">
          <div className="stat-color" style={{ background: '#2d3655' }}></div>
          <span>{statusCounts.pending || 0} Pending</span>
        </div>
      </div>

      <div className="chunk-grid">
        {chunks.map((chunk) => (
          <div
            key={chunk.index}
            className={`chunk-cell chunk-${chunk.status}`}
            style={{ background: getChunkColor(chunk.status) }}
            onMouseEnter={() => setHoveredChunk(chunk)}
            onMouseLeave={() => setHoveredChunk(null)}
            data-tooltip={`Chunk ${chunk.index}: ${getChunkLabel(chunk.status)}`}
          />
        ))}
      </div>

      {hoveredChunk && (
        <div className="chunk-tooltip">
          <div className="tooltip-header">
            Chunk #{hoveredChunk.index}
          </div>
          <div className="tooltip-body">
            <div className="tooltip-row">
              <span>Status:</span>
              <span className={`badge badge-${hoveredChunk.status}`}>
                {getChunkLabel(hoveredChunk.status)}
              </span>
            </div>
            <div className="tooltip-row">
              <span>Hash:</span>
              <code>{hoveredChunk.hash}</code>
            </div>
          </div>
          <div className="tooltip-actions">
            <button className="tooltip-btn">Resend</button>
            <button className="tooltip-btn">View Details</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkMap;
