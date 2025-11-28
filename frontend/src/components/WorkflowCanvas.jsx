import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, ZoomIn, ZoomOut, Maximize2, Play, Save, RefreshCw } from 'lucide-react';
import WorkflowNode from './WorkflowNode';
import NodeSidebar from './NodeSidebar';
import ConnectionLine from './ConnectionLine';
import RightPanel from './RightPanel';
import './WorkflowCanvas.css';

// Optional global default for receiver backend (can be overridden per receiver node)
const RECEIVER_BASE_URL = import.meta.env.VITE_RECEIVER_BASE_URL || '';

const WorkflowCanvas = () => {
  const {
    canvasNodes,
    canvasConnections,
    selectedNodeId,
    selectedNode,
    setSelectedNode,
    canvasZoom,
    canvasPosition,
    addCanvasNode,
    updateCanvasNode,
    selectNode,
    setCanvasZoom,
    setCanvasPosition,
    startConnection,
    addConnection,
    connectingFrom,
    cancelConnection,
    isExecuting,
    startExecution,
    stopExecution,
    executionProgress,
    activeWorkflowId,
    createWorkflow,
    updateWorkflow,
    workflows,
    saveWorkflowState,
  } = useStore();

  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSidebar, setShowSidebar] = useState(true);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempConnection, setTempConnection] = useState(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Get current workflow
  const currentWorkflow = workflows.find(w => w.id === activeWorkflowId);

  // Update workflow name when active workflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
    }
  }, [currentWorkflow?.id]);

  // Handle canvas panning
  const handleCanvasMouseDown = (e) => {
    // Allow panning on middle mouse button, spacebar + left click, or clicking empty canvas areas
    const isMiddleButton = e.button === 1;
    const isPanningClick = e.target === canvasRef.current || 
                          e.target.classList.contains('canvas-grid') || 
                          e.target.classList.contains('connections-layer') ||
                          e.target.classList.contains('nodes-layer') ||
                          e.target.classList.contains('canvas-empty-state');
    
    if (isMiddleButton || (isSpacePressed && e.button === 0) || (isPanningClick && e.button === 0)) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - canvasPosition.x,
        y: e.clientY - canvasPosition.y,
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
      setCanvasPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // Update temporary connection line
    if (connectingFrom && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnection({
        x: (e.clientX - rect.left - canvasPosition.x) / canvasZoom,
        y: (e.clientY - rect.top - canvasPosition.y) / canvasZoom,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = isSpacePressed ? 'grab' : '';
    // Don't cancel connection on canvas click - let it stay active
    // Connection is only canceled by clicking the same node or pressing escape
  };

  // Zoom controls
  const handleZoomIn = () => {
    setCanvasZoom(Math.min(canvasZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setCanvasZoom(Math.max(canvasZoom - 0.1, 0.5));
  };

  const handleResetView = () => {
    setCanvasZoom(1);
    setCanvasPosition({ x: 0, y: 0 });
  };

  // Handle node drop from sidebar
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const nodeData = JSON.parse(e.dataTransfer.getData('application/json'));
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate position accounting for zoom and pan
      const x = (e.clientX - canvasRect.left - canvasPosition.x) / canvasZoom;
      const y = (e.clientY - canvasRect.top - canvasPosition.y) / canvasZoom;

      addCanvasNode({
        id: `node_${Date.now()}`,
        type: nodeData.id,
        label: nodeData.label,
        icon: nodeData.icon,
        color: nodeData.color,
        position: { x, y },
        config: nodeData.defaultConfig || {},
      });
    } catch (error) {
      console.error('Failed to drop node:', error);
    }
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle workflow name change – updates the current workflow in Zustand + Mongo
  const handleWorkflowNameChange = (newName) => {
    setWorkflowName(newName);
    
    if (activeWorkflowId) {
      // Update in Zustand store
      updateWorkflow(activeWorkflowId, { name: newName });
      // Persist update for logged-in users
      try {
        useStore.getState().syncWorkflowsToServer();
      } catch (error) {
        console.error('Failed to sync workflow name to server:', error);
      }
    }
  };

  // Save workflow – ensures the current canvas state is reflected in the
  // active workflow and synced to MongoDB via the backend.
  const handleSaveWorkflow = () => {
    try {
      const nameToUse = workflowName || 'My Workflow';
      if (activeWorkflowId) {
        updateWorkflow(activeWorkflowId, {
          name: nameToUse,
          nodes: canvasNodes,
          connections: canvasConnections,
          canvasPosition,
          canvasZoom,
        });
      } else {
        const newId = createWorkflow(nameToUse, 'File transfer workflow');
        // Ensure new workflow has the current canvas state
        updateWorkflow(newId, {
          nodes: canvasNodes,
          connections: canvasConnections,
          canvasPosition,
          canvasZoom,
        });
      }

      // Ask store to persist to backend for logged-in users
      try {
        useStore.getState().syncWorkflowsToServer();
      } catch (err) {
        console.error('Failed to sync workflow to server:', err);
      }

      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow: ' + error.message);
    }
  };

  // Auto-arrange nodes and wires into a neat data-flow layout (left-to-right), then save it
  const handleSyncLayout = () => {
    try {
      if (!canvasNodes.length) return;

      // Build incoming/outgoing maps from connections to capture data flow
      const incomingCount = new Map();
      const outgoing = new Map();

      canvasNodes.forEach((node) => {
        incomingCount.set(node.id, 0);
        outgoing.set(node.id, []);
      });

      canvasConnections.forEach((conn) => {
        if (incomingCount.has(conn.targetId)) {
          incomingCount.set(conn.targetId, (incomingCount.get(conn.targetId) || 0) + 1);
        }
        if (outgoing.has(conn.sourceId)) {
          outgoing.get(conn.sourceId).push(conn.targetId);
        }
      });

      // Find roots (no incoming edges) - data-flow sources
      const roots = canvasNodes.filter((n) => (incomingCount.get(n.id) || 0) === 0);

      // Assign depths with a simple BFS so data flows left-to-right
      const depthMap = new Map();
      const queue = [];

      roots.forEach((n) => {
        depthMap.set(n.id, 0);
        queue.push(n.id);
      });

      while (queue.length) {
        const currentId = queue.shift();
        const currentDepth = depthMap.get(currentId) || 0;
        const children = outgoing.get(currentId) || [];

        children.forEach((childId) => {
          const existingDepth = depthMap.get(childId);
          if (existingDepth == null || existingDepth < currentDepth + 1) {
            depthMap.set(childId, currentDepth + 1);
            queue.push(childId);
          }
        });
      }

      // Any unassigned nodes (disconnected) get placed after the deepest layer
      let maxDepth = 0;
      depthMap.forEach((d) => {
        if (d > maxDepth) maxDepth = d;
      });

      canvasNodes.forEach((n) => {
        if (!depthMap.has(n.id)) {
          maxDepth += 1;
          depthMap.set(n.id, maxDepth);
        }
      });

      // Group nodes by depth/layer
      const layers = {};
      canvasNodes.forEach((n) => {
        const d = depthMap.get(n.id) || 0;
        if (!layers[d]) layers[d] = [];
        layers[d].push(n);
      });

      // Compute positions per layer – left-to-right, vertically centered within each column
      const nodeWidth = 240;
      const nodeHeight = 150;
      const hSpacing = 160;
      const vSpacing = 60;

      const newPositions = {};

      Object.keys(layers)
        .map((k) => parseInt(k, 10))
        .sort((a, b) => a - b)
        .forEach((depth) => {
          const nodesInLayer = layers[depth];
          const columnX = depth * (nodeWidth + hSpacing);

          // Center nodes vertically around 0 for this column
          const totalHeight =
            nodesInLayer.length * nodeHeight + (nodesInLayer.length - 1) * vSpacing;
          const startY = -totalHeight / 2;

          nodesInLayer.forEach((node, index) => {
            const y = startY + index * (nodeHeight + vSpacing);
            newPositions[node.id] = { x: columnX, y };
          });
        });

      // Apply new positions
      canvasNodes.forEach((node) => {
        const pos = newPositions[node.id];
        if (pos) {
          updateCanvasNode(node.id, { position: pos });
        }
      });

      // Save updated layout (nodes + connections + viewport)
      saveWorkflowState();

      console.log('✅ Layout auto-arranged and synced');
    } catch (error) {
      console.error('Failed to auto-arrange layout:', error);
      alert('Failed to auto-arrange layout: ' + error.message);
    }
  };

  // Execute workflow
  const handleExecute = async () => {
    try {
      // Find required nodes
      const senderNode = canvasNodes.find(
        (n) => n.type === 'device' && n.config?.deviceType === 'sender'
      );
      const receiverNode = canvasNodes.find(
        (n) => n.type === 'device' && n.config?.deviceType === 'receiver'
      );
      const fileSourceNode = canvasNodes.find((n) => n.type === 'file-source');

      // Transport selection – support both WiFi and Relay transport nodes
      // Node types come from NodeSidebar where ids are:
      //   - 'relay-server'   → Relay transport
      //   - 'wifi-transfer'  → Direct WiFi transport
      const transportNode = canvasNodes.find(
        (n) => n.type === 'relay-server' || n.type === 'wifi-transfer'
      );
      
      if (!senderNode || !receiverNode) {
        alert('Workflow must have both Sender and Receiver device nodes!');
        return;
      }
      
      // Start execution
      if (!isExecuting) {
        startExecution();
      }
      
      // Generate workflow ID
      const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Execute workflow on backend
      const workflowResponse = await fetch('http://localhost:5000/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflowId,
          nodes: canvasNodes,
          connections: canvasConnections,
          // Sender/receiver IPs are no longer required for external receiver API,
          // keep localhost for backward compatibility/logging only.
          senderIP: 'localhost',
          receiverIP: 'localhost'
        })
      });
      
      const { transferId } = await workflowResponse.json();
      
      // Use files from file source node configuration
      const selectedFiles = fileSourceNode?.config?.selectedFiles || [];

      if (fileSourceNode && selectedFiles.length > 0) {
        // Show progress for each node
        canvasNodes.forEach((node, index) => {
          setTimeout(() => {
            useStore.getState().updateExecutionProgress(node.id, 'running');
          }, index * 500);
        });

        // Resolve receiver API endpoint: prefer receiver device node config, then optional global default
        const receiverApiBase =
          (receiverNode.config && receiverNode.config.apiEndpoint) ||
          RECEIVER_BASE_URL;

        if (!receiverApiBase) {
          alert(
            'Receiver API endpoint is not configured.\n\n' +
            'Please select the Receiver device node and set "Receiver API Endpoint" to your backend URL.'
          );
          stopExecution();
          return;
        }

        // Sort files by priority so higher-priority files are started first
        const priorityWeight = {
          low: 0,
          medium: 1,
          auto: 1,
          high: 2,
          critical: 3,
        };

        const sortedFiles = [...selectedFiles].sort((a, b) => {
          const pa = priorityWeight[(a.priority || 'auto')] ?? 1;
          const pb = priorityWeight[(b.priority || 'auto')] ?? 1;
          return pb - pa; // highest priority first
        });

        // Loop over each selected file (highest priority first) and start a transfer for each
        for (const fileEntry of sortedFiles) {
          const fileObj = fileEntry._fileObject;
          if (!fileObj) continue;

          // Resolve file-specific priority
          const filePriority =
            fileEntry.priority ||
            fileSourceNode.config.priority ||
            'auto';

          const fileTransferId = fileEntry.transfer_id || `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const chunkSize = fileSourceNode.config.chunk_size || 1048576;
          const numChunks = Math.ceil(fileEntry.size / chunkSize);
          const chunks = fileEntry.chunks && fileEntry.chunks.length === numChunks
            ? fileEntry.chunks
            : Array.from({ length: numChunks }, (_, i) => `chunk_${i}_${fileTransferId.slice(-8)}`);

          // First, register the transfer metadata for this file
          const transferPayload = {
            workflowId,
            transferId: fileTransferId,
            fileName: fileEntry.name,
            fileSize: fileEntry.size,
            chunkSize,
            chunks,
            priority: filePriority,
            // External receiver API is used, IP/port are not required anymore
            receiverIP: 'external-receiver',
            receiverPort: 0,
            receiverBaseUrl: receiverApiBase,
            transport: transportNode?.type === 'relay-server' ? 'relay' : 'wifi',
            relayUrl: transportNode?.config?.relayUrl || 'http://localhost:5001'
          };

          console.log('Starting file transfer:', transferPayload);
            
          const metadataResponse = await fetch('http://localhost:5000/api/transfer/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transferPayload)
          });
            
          const metadataResult = await metadataResponse.json();
          
          if (metadataResult.success) {
            // Now upload the actual file
            const formData = new FormData();
            formData.append('file', fileObj);
            formData.append('transferId', fileTransferId);
            // IP/port no longer needed by external receiver API
            formData.append('receiverIP', 'external-receiver');
            formData.append('receiverPort', 0);
            formData.append('receiverBaseUrl', receiverApiBase);
            formData.append('transport', transportNode?.type === 'relay-server' ? 'relay' : 'wifi');
            formData.append('relayUrl', transportNode?.config?.relayUrl || 'http://localhost:5001');
            
            console.log('Uploading file to backend...', fileEntry.name);
            
            const uploadResponse = await fetch('http://localhost:5000/api/transfer/upload-file', {
              method: 'POST',
              body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (!uploadResult.success) {
              canvasNodes.forEach(node => {
                useStore.getState().updateExecutionProgress(node.id, 'error');
              });
              alert(`File upload failed for "${fileEntry.name}": ${uploadResult.error || 'Unknown error'}`);
              break;
            }
          } else {
            canvasNodes.forEach(node => {
              useStore.getState().updateExecutionProgress(node.id, 'error');
            });
            alert(`Transfer metadata failed for "${fileEntry.name}": ${metadataResult.error || 'Unknown error'}`);
            break;
          }
        }

        // Mark all nodes as success after queuing all files
        canvasNodes.forEach((node, index) => {
          setTimeout(() => {
            useStore.getState().updateExecutionProgress(node.id, 'success');
          }, (index + 1) * 500);
        });

        alert(`All selected files have been queued for transfer.\nTransfers will run based on their individual priority.`);

        if (isExecuting) stopExecution();
      } else if (fileSourceNode && (!selectedFiles || selectedFiles.length === 0)) {
        alert('Please select at least one file in the File Source node before executing.');
        if (isExecuting) stopExecution();
      } else {
        // Simulate execution without file
        canvasNodes.forEach((node, index) => {
          setTimeout(() => {
            useStore.getState().updateExecutionProgress(node.id, 'running');
            setTimeout(() => {
              useStore.getState().updateExecutionProgress(node.id, 'success');
            }, 500);
          }, index * 1000);
        });
        
        setTimeout(stopExecution, canvasNodes.length * 1000 + 500);
      }
    } catch (error) {
      console.error('Execution error:', error);
      alert('Execution failed: ' + error.message);
      stopExecution();
    }
  };

  // Sync selectedNode with selectedNodeId for RightPanel
  useEffect(() => {
    if (selectedNodeId) {
      const node = canvasNodes.find(n => n.id === selectedNodeId);
      if (node) {
        setSelectedNode(node);
      }
    } else {
      setSelectedNode(null);
    }
  }, [selectedNodeId, canvasNodes]);

  useEffect(() => {
    document.addEventListener('mouseup', handleCanvasMouseUp);
    return () => document.removeEventListener('mouseup', handleCanvasMouseUp);
  }, [connectingFrom]);

  // Clear temporary connection when connectingFrom changes
  useEffect(() => {
    if (!connectingFrom) {
      setTempConnection(null);
    }
  }, [connectingFrom]);

  // Handle spacebar for panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        document.body.style.cursor = 'grab';
      }
      // Cancel connection on Escape key
      if (e.code === 'Escape' && connectingFrom) {
        cancelConnection();
        setTempConnection(null);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = '';
    };
  }, [connectingFrom]);

  // Handle mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const delta = -e.deltaY;
        const zoomSpeed = 0.001;
        const newZoom = Math.max(0.1, Math.min(3, canvasZoom + delta * zoomSpeed));
        
        // Zoom towards mouse cursor
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          // Calculate the point under the mouse in canvas coordinates
          const canvasX = (mouseX - canvasPosition.x) / canvasZoom;
          const canvasY = (mouseY - canvasPosition.y) / canvasZoom;
          
          // Calculate new position to keep the point under the mouse
          const newX = mouseX - canvasX * newZoom;
          const newY = mouseY - canvasY * newZoom;
          
          setCanvasZoom(newZoom);
          setCanvasPosition({ x: newX, y: newY });
        } else {
          setCanvasZoom(newZoom);
        }
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [canvasZoom, canvasPosition]);

  return (
    <div className="workflow-canvas-container">
      {/* Top Toolbar */}
      <div className="canvas-toolbar">
        <div className="toolbar-left">
          <button
            className="toolbar-btn"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Plus size={18} />
            {showSidebar ? 'Hide' : 'Show'} Nodes
          </button>
        </div>

        <div className="toolbar-center">
          <button className="toolbar-btn" onClick={handleZoomOut}>
            <ZoomOut size={18} />
          </button>
          <span className="zoom-level">{Math.round(canvasZoom * 100)}%</span>
          <button className="toolbar-btn" onClick={handleZoomIn}>
            <ZoomIn size={18} />
          </button>
          <button className="toolbar-btn" onClick={handleResetView}>
            <Maximize2 size={18} />
          </button>
          <button className="toolbar-btn" onClick={handleSyncLayout}>
            <RefreshCw size={18} />
            Sync Layout
          </button>
        </div>

        <div className="toolbar-right">
          <button
            className={`toolbar-btn execute-btn ${isExecuting ? 'executing' : ''}`}
            onClick={handleExecute}
          >
            <Play size={18} />
            Execute
          </button>
          <button className="toolbar-btn save-btn" onClick={handleSaveWorkflow}>
            <Save size={18} />
            Save
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="canvas-content">
        {/* Node Sidebar */}
        {showSidebar && (
          <NodeSidebar onClose={() => setShowSidebar(false)} />
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`workflow-canvas ${isDragging ? 'dragging' : ''} ${connectingFrom ? 'connecting' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {/* Infinite grid background */}
          <div
            className="canvas-grid"
          />

          {/* World layer (pannable + zoomable) */}
          <div
            className="canvas-world"
            style={{
              transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Empty State */}
            {canvasNodes.length === 0 && (
              <div className="canvas-empty-state">
                <Plus size={48} />
                <h3>Start Building Your Workflow</h3>
                <p>Drag nodes from the left panel to add them to your workflow</p>
              </div>
            )}

            {/* Connection Lines */}
            <svg className="connections-layer">
              {canvasConnections.map((conn) => {
                const sourceNode = canvasNodes.find(n => n.id === conn.sourceId);
                const targetNode = canvasNodes.find(n => n.id === conn.targetId);

                if (!sourceNode || !targetNode) return null;

                return (
                  <ConnectionLine
                    key={conn.id}
                    sourceNode={sourceNode}
                    targetNode={targetNode}
                    isActive={executionProgress[sourceNode.id] === 'success'}
                    isExecuting={executionProgress[sourceNode.id] === 'running'}
                    zoom={canvasZoom}
                  />
                );
              })}

              {/* Temporary connection while dragging */}
              {connectingFrom && tempConnection && canvasNodes.find(n => n.id === connectingFrom) && (
                <ConnectionLine
                  from={{
                    x: canvasNodes.find(n => n.id === connectingFrom).position.x + 240,
                    y: canvasNodes.find(n => n.id === connectingFrom).position.y + 75,
                  }}
                  to={{
                    x: (tempConnection.x - canvasPosition.x) / canvasZoom,
                    y: (tempConnection.y - canvasPosition.y) / canvasZoom,
                  }}
                  temporary
                  zoom={canvasZoom}
                />
              )}
            </svg>

            {/* Nodes */}
            <div className="nodes-layer">
              {canvasNodes.map((node) => (
                <WorkflowNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => selectNode(node.id)}
                  onPositionChange={(position) => updateCanvasNode(node.id, { position })}
                  onConnectionStart={() => startConnection(node.id)}
                  isExecuting={executionProgress[node.id] === 'running'}
                  executionStatus={executionProgress[node.id]}
                  zoom={canvasZoom}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel for Node Settings */}
        {selectedNodeId && (
          <RightPanel />
        )}
      </div>
    </div>
  );
};

export default WorkflowCanvas;