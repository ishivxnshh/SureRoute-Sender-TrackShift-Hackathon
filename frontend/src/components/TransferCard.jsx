import React from 'react';
import { useDrag } from 'react-dnd';
import { useStore } from '../store';
import { api } from '../services/api';
import { Play, Pause, X, TrendingUp } from 'lucide-react';
import './TransferCard.css';

const TransferCard = ({ transfer, laneColor }) => {
  const { updateTransfer, setActiveTransfer } = useStore();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TRANSFER_CARD',
    item: { type: 'TRANSFER_CARD', id: transfer.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec) => {
    return formatBytes(bytesPerSec) + '/s';
  };

  const formatETA = (seconds) => {
    if (!seconds || seconds === Infinity) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const handlePauseResume = (e) => {
    e.stopPropagation();
    const newStatus = transfer.status === 'active' ? 'paused' : 'active';
    updateTransfer(transfer.id, { status: newStatus });
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    updateTransfer(transfer.id, { status: 'cancelled' });
    try {
      await api.cancelTransfer(transfer.id);
    } catch (error) {
      console.error('Failed to cancel transfer:', error);
    }
  };

  const handleClick = () => {
    setActiveTransfer(transfer);
  };

  const handlePriorityChange = async (e) => {
    e.stopPropagation();
    const newPriority = e.target.value;
    updateTransfer(transfer.id, { priority: newPriority });
    try {
      await api.changePriority(transfer.id, newPriority);
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  return (
    <div
      ref={drag}
      className={`transfer-card ${isDragging ? 'dragging' : ''} status-${transfer.status}`}
      onClick={handleClick}
      style={{ borderLeftColor: laneColor }}
    >
      <div className="transfer-header">
        <div className="transfer-icon" style={{ background: `${laneColor}30`, color: laneColor }}>
          📄
        </div>
        <div className="transfer-info">
          <div className="transfer-name" title={transfer.fileName}>
            {transfer.fileName || '(no name)'}
            <span className="transfer-size-inline">
              {' '}
              ({formatBytes(transfer.fileSize)})
            </span>
          </div>
          <div className="transfer-meta-row">
            {transfer.priority && (
              <select
                className={`transfer-priority priority-${transfer.priority}`}
                value={transfer.priority}
                onChange={handlePriorityChange}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="auto">Auto (ML)</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="transfer-progress">
        <div className="progress-ring-container">
          <svg className="progress-ring" width="60" height="60">
            <circle
              className="progress-ring-circle-bg"
              cx="30"
              cy="30"
              r="26"
            />
            <circle
              className="progress-ring-circle"
              cx="30"
              cy="30"
              r="26"
              style={{
                strokeDasharray: `${2 * Math.PI * 26}`,
                strokeDashoffset: `${2 * Math.PI * 26 * (1 - transfer.progress)}`,
                stroke: laneColor,
              }}
            />
          </svg>
          <div className="progress-text">
            {Math.round(transfer.progress * 100)}%
          </div>
        </div>

        <div className="transfer-stats">
          <div className="stat">
            <TrendingUp size={14} />
            <span>{formatSpeed(transfer.speed)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">ETA:</span>
            <span>{formatETA(transfer.eta)}</span>
          </div>
        </div>
      </div>

      <div className="chunk-map-mini">
        {Array.from({ length: 20 }).map((_, i) => {
          const chunkIndex = Math.floor((i / 20) * (transfer.chunks?.length || 100));
          const status = transfer.chunkStatus?.[chunkIndex] || 'pending';
          return (
            <div
              key={i}
              className={`chunk-mini chunk-${status}`}
              style={{
                background: status === 'complete' ? laneColor : status === 'error' ? '#ef4444' : '#2d3655'
              }}
            />
          );
        })}
      </div>

      <div className="transfer-actions">
        <button className="transfer-action-btn" onClick={handlePauseResume}>
          {transfer.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="transfer-action-btn danger" onClick={handleCancel}>
          <X size={16} />
        </button>
        <div className="agent-indicator" data-tooltip="AI Agent Active">
          🤖
        </div>
      </div>
    </div>
  );
};

export default TransferCard;
