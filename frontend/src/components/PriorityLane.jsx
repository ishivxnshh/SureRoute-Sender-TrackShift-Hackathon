import React from 'react';
import { useDrop } from 'react-dnd';
import { useStore } from '../store';
import TransferCard from './TransferCard';
import './PriorityLane.css';

const PriorityLane = ({ priority, label, color }) => {
  const { transfers, addTransfer } = useStore();

  const laneTransfers = transfers.filter(t => t.priority === priority);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['FILE', 'TRANSFER_CARD'],
    drop: (item, monitor) => {
      if (item.type === 'FILE') {
        // Create new transfer from dropped file
        const transfer = {
          id: `transfer-${Date.now()}`,
          fileName: item.file.name,
          fileSize: item.file.size,
          priority: priority,
          status: 'ready',
          progress: 0,
          speed: 0,
          eta: null,
          chunks: [],
          chunkStatus: {},
        };
        addTransfer(transfer);
      } else if (item.type === 'TRANSFER_CARD') {
        // Move existing transfer to this lane
        // This will be handled by the TransferCard component
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`priority-lane ${isOver && canDrop ? 'drag-over' : ''}`}
      style={{ borderLeftColor: color }}
    >
      <div className="lane-header" style={{ background: `${color}15` }}>
        <div className="lane-label" style={{ color: color }}>
          {label}
        </div>
        <div className="lane-count">
          {laneTransfers.length} transfer{laneTransfers.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="lane-content scrollable">
        {laneTransfers.length === 0 ? (
          <div className="lane-empty">
            <div className="empty-icon" style={{ color: color }}>📁</div>
            <p>Drop files here to start transfer</p>
          </div>
        ) : (
          <div className="transfers-grid">
            {laneTransfers.map(transfer => (
              <TransferCard key={transfer.id} transfer={transfer} laneColor={color} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityLane;
