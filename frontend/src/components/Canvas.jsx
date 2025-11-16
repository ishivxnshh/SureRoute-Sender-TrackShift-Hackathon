import React, { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useStore } from '../store';
import CanvasNode from './CanvasNode';
import PriorityLane from './PriorityLane';
import './Canvas.css';

const Canvas = () => {
  const { canvasNodes, addCanvasNode, setSelectedNode } = useStore();
  const canvasRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      const x = offset.x - canvasRect.left - panOffset.x;
      const y = offset.y - canvasRect.top - panOffset.y;

      const newNode = {
        type: item.type,
        label: item.label,
        color: item.color,
        x,
        y,
        config: {},
      };

      addCanvasNode(newNode);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-grid')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-grid')) {
      setSelectedNode(null);
    }
  };

  return (
    <div 
      ref={(node) => {
        canvasRef.current = node;
        drop(node);
      }}
      className={`canvas ${isOver ? 'drag-over' : ''} ${isPanning ? 'panning' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      <div className="canvas-grid" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
        {/* Canvas nodes area (top section) */}
        <div className="canvas-nodes-area">
          {canvasNodes.map((node) => (
            <CanvasNode key={node.id} node={node} />
          ))}
          
          {canvasNodes.length === 0 && (
            <div className="canvas-placeholder">
              <div className="placeholder-icon">📦</div>
              <h3>Drop components here to start</h3>
              <p>Drag nodes from the left panel and configure them</p>
            </div>
          )}
        </div>

        {/* Priority lanes (middle section) */}
        <div className="priority-lanes-container">
          <div className="lanes-header">
            <h4>Transfer Priority Channels</h4>
            <p>Drag files or nodes to lanes to assign priority</p>
          </div>
          
          <PriorityLane 
            priority="high" 
            label="🚨 High Priority (Rush)" 
            color="#ef4444"
          />
          <PriorityLane 
            priority="normal" 
            label="⚡ Normal Priority" 
            color="#3b82f6"
          />
          <PriorityLane 
            priority="low" 
            label="📦 Low Priority (Bulk)" 
            color="#64748b"
          />
        </div>
      </div>

      <div className="canvas-controls">
        <button className="canvas-control-btn" onClick={() => setPanOffset({ x: 0, y: 0 })}>
          Reset View
        </button>
        <div className="zoom-indicator">100%</div>
      </div>
    </div>
  );
};

export default Canvas;
