import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { useStore } from '../store';
import { X, Settings, Play } from 'lucide-react';
import './CanvasNode.css';

const CanvasNode = ({ node }) => {
  const { updateCanvasNode, removeCanvasNode, setSelectedNode, selectedNode } = useStore();
  const [position, setPosition] = useState({ x: node.x, y: node.y });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CANVAS_NODE',
    item: { id: node.id, x: position.x, y: position.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const newX = Math.round(position.x + delta.x);
        const newY = Math.round(position.y + delta.y);
        setPosition({ x: newX, y: newY });
        updateCanvasNode(node.id, { x: newX, y: newY });
      }
    },
  }));

  const isSelected = selectedNode?.id === node.id;

  const handleClick = (e) => {
    e.stopPropagation();
    setSelectedNode(node);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    removeCanvasNode(node.id);
  };

  return (
    <div
      ref={drag}
      className={`canvas-node ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        borderColor: node.color,
      }}
      onClick={handleClick}
    >
      <div className="node-header" style={{ background: `${node.color}20` }}>
        <div className="node-title" style={{ color: node.color }}>
          {node.label}
        </div>
        <div className="node-actions">
          <button className="node-action-btn" onClick={handleClick}>
            <Settings size={14} />
          </button>
          <button className="node-action-btn danger" onClick={handleRemove}>
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="node-body">
        <div className="node-status">
          <div className="status-dot" style={{ background: node.color }}></div>
          <span>Ready</span>
        </div>
      </div>

      <div className="node-connection-points">
        <div className="connection-point input" data-tooltip="Input"></div>
        <div className="connection-point output" data-tooltip="Output"></div>
      </div>
    </div>
  );
};

export default CanvasNode;
