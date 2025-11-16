import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { MoreVertical, Play, Check, X, AlertCircle, Trash2 } from 'lucide-react';
import './WorkflowNode.css';

const WorkflowNode = ({
  node,
  isSelected,
  onSelect,
  onPositionChange,
  onConnectionStart,
  isExecuting,
  executionStatus,
  zoom,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const nodeRef = useRef(null);
  const { connectingFrom, addConnection, cancelConnection, deleteCanvasNode } = useStore();

  const handleMouseDown = (e) => {
    // Don't start dragging if clicking on handles or their children
    if (e.target.classList.contains('node-handle') || 
        e.target.classList.contains('handle-dot') ||
        e.target.closest('.node-handle')) {
      return;
    }
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX / zoom - node.position.x,
      y: e.clientY / zoom - node.position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX / zoom - dragStart.x;
      const newY = e.clientY / zoom - dragStart.y;
      onPositionChange({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOutputClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!connectingFrom) {
      // Start a new connection from this node
      setIsDraggingConnection(true);
      onConnectionStart();
    } else if (connectingFrom && connectingFrom !== node.id) {
      // Complete a connection to this node (allow ending on either side)
      addConnection({
        sourceId: connectingFrom,
        targetId: node.id,
      });
      setIsDraggingConnection(false);
    } else if (connectingFrom && connectingFrom === node.id) {
      // Clicking the same node cancels the connection
      cancelConnection();
      setIsDraggingConnection(false);
    }
  };

  const handleOutputMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!connectingFrom) {
      setIsDraggingConnection(true);
      onConnectionStart();
    }
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (connectingFrom && connectingFrom !== node.id) {
      // Complete a connection to this node
      addConnection({
        sourceId: connectingFrom,
        targetId: node.id,
      });
      setIsDraggingConnection(false);
    } else if (!connectingFrom) {
      // Start a new connection from this node's input (bidirectional start)
      setIsDraggingConnection(true);
      onConnectionStart();
    } else if (connectingFrom && connectingFrom === node.id) {
      // Clicking the same node cancels the connection
      cancelConnection();
      setIsDraggingConnection(false);
    }
  };

  const handleInputMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!connectingFrom) {
      setIsDraggingConnection(true);
      onConnectionStart();
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingConnection) {
        setIsDraggingConnection(false);
      }
    };

    if (isDraggingConnection) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDraggingConnection]);

  const getStatusIcon = () => {
    if (isExecuting) return <Play size={14} className="status-icon executing" />;
    if (executionStatus === 'success') return <Check size={14} className="status-icon success" />;
    if (executionStatus === 'error') return <X size={14} className="status-icon error" />;
    return null;
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    deleteCanvasNode(node.id);
  };

  return (
    <div
      ref={nodeRef}
      className={`workflow-node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${executionStatus || ''}`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        borderColor: node.color || 'var(--border-primary)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Input Handle */}
      <div
        className="node-handle input-handle"
      onClick={handleInputClick}
      onMouseDown={handleInputMouseDown}
        title="Input"
      >
        <div className="handle-dot" />
      </div>

      {/* Node Header */}
      <div
        className="node-header"
        style={{ background: node.color || 'var(--accent-primary)' }}
      >
        <div className="node-icon">
          {node.icon || '📦'}
        </div>
        <div className="node-title">{node.label}</div>
        {getStatusIcon()}
        <button
          type="button"
          className="node-delete-btn"
          onClick={handleDeleteClick}
          title="Delete node"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Node Body */}
      <div className="node-body">
        <div className="node-type">
          {node.type === 'device' ? (
            <>
              <span className="device-name">
                {node.config?.deviceName?.trim() || 'Unnamed Device'}
              </span>
              {node.config?.deviceType && (
                <span className={`device-type-pill device-type-${node.config.deviceType}`}>
                  {node.config.deviceType}
                </span>
              )}
            </>
          ) : (
            node.type
          )}
        </div>
        {node.config && Object.keys(node.config).length > 0 && (
          <div className="node-config-indicator">
            <MoreVertical size={14} />
          </div>
        )}
      </div>

      {/* Output Handle */}
      <div
        className="node-handle output-handle"
        onClick={handleOutputClick}
        onMouseDown={handleOutputMouseDown}
        title="Output"
      >
        <div className="handle-dot" />
      </div>

      {/* Execution Status Indicator */}
      {executionStatus && (
        <div className={`execution-indicator ${executionStatus}`} />
      )}
    </div>
  );
};

export default WorkflowNode;
