import React, { useState } from 'react';
import { useStore } from '../store';
import ChunkMap from './ChunkMap';
import TelemetryGraph from './TelemetryGraph';
import AISuggestions from './AISuggestions';
import { 
  X, 
  Settings, 
  Activity, 
  Grid, 
  TrendingUp,
  HelpCircle,
  Upload,
  FileText,
  Trash2,
} from 'lucide-react';
import './RightPanel.css';

const RightPanel = () => {
  const { 
    selectedNode, 
    activeTransfer, 
    setSelectedNode, 
    setActiveTransfer,
    updateCanvasNode,
  } = useStore();
  
  const [activeTab, setActiveTab] = useState('details');
  const [nodeConfig, setNodeConfig] = useState({});

  const handleClose = () => {
    setSelectedNode(null);
    setActiveTransfer(null);
  };

  const handleNodeConfigChange = (key, value, parentKey = null) => {
    let updatedConfig;
    
    if (parentKey) {
      updatedConfig = {
        ...nodeConfig,
        [parentKey]: {
          ...nodeConfig[parentKey],
          [key]: value
        }
      };
    } else {
      updatedConfig = { ...nodeConfig, [key]: value };
    }
    
    // Recalculate chunks if chunk_size changes and file_size exists
    if (key === 'chunk_size' && updatedConfig.file_size > 0) {
      const numChunks = Math.ceil(updatedConfig.file_size / value);
      const transferId = updatedConfig.transfer_id || '';
      updatedConfig.chunks = Array.from({ length: numChunks }, (_, i) => 
        `chunk_${i}_${transferId.slice(-8)}`
      );
      console.log(`Chunk size changed to ${value}, recalculated ${numChunks} chunks`);
    }
    
    setNodeConfig(updatedConfig);
    if (selectedNode) {
      updateCanvasNode(selectedNode.id, { config: updatedConfig });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      const chunkSize = nodeConfig.chunk_size || 1048576;

      const fileData = files.map(f => {
        const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const numChunks = Math.ceil(f.size / chunkSize);
        const chunks = Array.from({ length: numChunks }, (_, i) => `chunk_${i}_${transferId.slice(-8)}`);

        return {
          name: f.name,
          size: f.size,
          type: f.type,
          lastModified: f.lastModified,
          priority: nodeConfig.priority || 'auto',
          transfer_id: transferId,
          chunks,
          _fileObject: f,
        };
      });

      const first = fileData[0];

      // Update all fields at once (keep top-level fields for backward compatibility, using first file)
      const updatedConfig = {
        ...nodeConfig,
        selectedFiles: fileData,
        file_name: first.name,
        file_size: first.size,
        transfer_id: first.transfer_id,
        chunks: first.chunks,
        metadata: {
          mimeType: first.type,
          lastModified: new Date(first.lastModified).toISOString(),
          checksum: ''
        },
        _fileObject: first._fileObject // Store first file for any legacy paths
      };
      
      setNodeConfig(updatedConfig);
      if (selectedNode) {
        updateCanvasNode(selectedNode.id, { config: updatedConfig });
      }
      
      console.log('Files selected:', fileData.map(f => ({
        name: f.name,
        size: f.size,
        chunks: f.chunks.length,
        transferId: f.transfer_id
      })));
    }
  };

  const clearFiles = () => {
    const clearedConfig = {
      ...nodeConfig,
      selectedFiles: [],
      file_name: '',
      file_size: 0,
      chunks: [],
      transfer_id: '',
      metadata: {
        mimeType: '',
        lastModified: '',
        checksum: ''
      },
      _fileObject: null
    };
    
    setNodeConfig(clearedConfig);
    if (selectedNode) {
      updateCanvasNode(selectedNode.id, { config: clearedConfig });
    }
    
    // Reset file input element
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFilePriorityChange = (index, newPriority) => {
    const updatedFiles = Array.isArray(nodeConfig.selectedFiles)
      ? [...nodeConfig.selectedFiles]
      : [];

    if (!updatedFiles[index]) return;

    updatedFiles[index] = {
      ...updatedFiles[index],
      priority: newPriority,
    };

    const updatedConfig = {
      ...nodeConfig,
      selectedFiles: updatedFiles,
    };

    setNodeConfig(updatedConfig);
    if (selectedNode) {
      updateCanvasNode(selectedNode.id, { config: updatedConfig });
    }
  };

  // Initialize config from selected node
  React.useEffect(() => {
    if (selectedNode) {
      setNodeConfig(selectedNode.config || {});
    }
  }, [selectedNode?.id]);

  // Don't render anything if nothing is selected
  if (!selectedNode && !activeTransfer) {
    return null;
  }

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h3>
          {selectedNode && <Settings size={18} />}
          {activeTransfer && <Activity size={18} />}
          <span>{selectedNode ? 'Node Configuration' : 'Transfer Inspector'}</span>
        </h3>
        <button className="btn-icon" onClick={handleClose}>
          <X size={18} />
        </button>
      </div>

      <div className="inspector-tabs">
        <button
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Grid size={16} />
          Details
        </button>
        {activeTransfer && (
          <>
            <button
              className={`tab ${activeTab === 'chunks' ? 'active' : ''}`}
              onClick={() => setActiveTab('chunks')}
            >
              <Grid size={16} />
              Chunks
            </button>
            <button
              className={`tab ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              <TrendingUp size={16} />
              Telemetry
            </button>
          </>
        )}
      </div>

      <div className="inspector-content scrollable">
        {activeTab === 'details' && selectedNode && (
          <div className="config-section">
            <div className="section-title">{selectedNode.label} Configuration</div>
            
            {/* File Upload for file-source node */}
            {selectedNode.type === 'file-source' && (
              <div className="form-group file-upload-group">
                <label>Select Files</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-upload-input"
                />
                <label htmlFor="file-upload-input" className="file-upload-button">
                  <Upload size={16} />
                  Choose Files
                </label>
                
                {Array.isArray(nodeConfig.selectedFiles) && nodeConfig.selectedFiles.length > 0 && (
                  <div className="selected-files-list">
                    {nodeConfig.selectedFiles.map((file, idx) => (
                      <div key={idx} className="file-item">
                        <FileText size={14} />
                        <span>{file.name}</span>
                        <span className="file-size">
                          {(file.size / 1024).toFixed(2)} KB
                        </span>
                        <select
                          className="file-priority-select"
                          value={file.priority || 'auto'}
                          onChange={(e) => handleFilePriorityChange(idx, e.target.value)}
                        >
                          <option value="auto">Auto (ML)</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    ))}
                    <button className="btn-clear-files" onClick={clearFiles}>
                      <Trash2 size={14} />
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Render other config fields */}
            {Object.keys(selectedNode.config || {}).length > 0 ? (
              Object.entries(selectedNode.config)
                .filter(([key]) => {
                  // Hide IP/Port for device nodes – we use an API endpoint instead
                  if (selectedNode.type === 'device' && (key === 'ipAddress' || key === 'port')) {
                    return false;
                  }
                  return !['selectedFiles', 'metadata'].includes(key);
                })
                .map(([key, value]) => {
                const fieldType = typeof value;
                const displayKey = key.replace(/([A-Z_])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                // Make auto-generated fields read-only and disabled for file-source
                if (selectedNode.type === 'file-source' && ['file_name', 'file_size', 'transfer_id'].includes(key)) {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey} {key === 'transfer_id' ? '(Auto-generated)' : ''}</label>
                      <input
                        type="text"
                        value={
                          key === 'file_size' && nodeConfig[key] 
                            ? `${(nodeConfig[key] / (1024 * 1024)).toFixed(2)} MB (${nodeConfig[key].toLocaleString()} bytes)`
                            : nodeConfig[key] ?? value
                        }
                        disabled
                        readOnly
                        style={{ 
                          background: 'var(--bg-tertiary)', 
                          cursor: 'not-allowed', 
                          opacity: 0.7,
                          color: 'var(--text-secondary)'
                        }}
                      />
                    </div>
                  );
                }
                
                // Display chunks array in a formatted way for file-source
                if (selectedNode.type === 'file-source' && key === 'chunks' && Array.isArray(value)) {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey} (Auto-generated)</label>
                      <textarea
                        value={JSON.stringify(nodeConfig[key] ?? value, null, 2)}
                        disabled
                        readOnly
                        rows="6"
                        style={{ 
                          background: 'var(--bg-tertiary)', 
                          cursor: 'not-allowed', 
                          opacity: 0.7,
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: 'var(--text-secondary)'
                        }}
                      />
                    </div>
                  );
                }
                
                // Device-specific handling: receiver API endpoint instead of IP/port
                if (selectedNode.type === 'device' && key === 'apiEndpoint') {
                  const isReceiver = (nodeConfig.deviceType || selectedNode.config.deviceType) === 'receiver';
                  if (!isReceiver) {
                    // Only show API endpoint when this device acts as a receiver
                    return null;
                  }

                  const protocol = 'https://';
                  const suffix = '.com';
                  const fullValue = nodeConfig[key] ?? value ?? '';
                  let middleValue = '';

                  if (fullValue.startsWith(protocol) && fullValue.endsWith(suffix)) {
                    middleValue = fullValue.slice(protocol.length, fullValue.length - suffix.length);
                  }

                  const handleMiddleChange = (val) => {
                    const trimmed = val.trim();
                    const assembled = trimmed ? `${protocol}${trimmed}${suffix}` : '';
                    handleNodeConfigChange(key, assembled);
                  };

                  return (
                    <div className="form-group" key={key}>
                      <label>Receiver API Endpoint</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <input
                          type="text"
                          value={protocol}
                          readOnly
                          style={{
                            width: '80px',
                            textAlign: 'right',
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          }}
                        />
                        <input
                          type="text"
                          value={middleValue}
                          onChange={(e) => handleMiddleChange(e.target.value)}
                          placeholder="your-domain"
                          style={{
                            flex: 1,
                            borderRadius: 0,
                          }}
                        />
                        <input
                          type="text"
                          value={suffix}
                          readOnly
                          style={{
                            width: '70px',
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                          }}
                        />
                      </div>
                      <small style={{ fontSize: '11px', color: '#888', marginTop: '4px', display: 'block' }}>
                        Full URL of the receiver backend. Only edit the middle part; it will be saved as "https://your-domain.com".
                      </small>
                    </div>
                  );
                }

                // Handle different field types
                if (fieldType === 'boolean') {
                  return (
                    <div className="form-group" key={key}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={nodeConfig[key] ?? value}
                          onChange={(e) => handleNodeConfigChange(key, e.target.checked)}
                        />
                        <span>{displayKey}</span>
                      </label>
                    </div>
                  );
                }
                
                // Special handling for chunk_size: show value in MB, store in bytes
                if (fieldType === 'number' && selectedNode.type === 'file-source' && key === 'chunk_size') {
                  const bytesValue = nodeConfig[key] ?? value ?? 1048576;
                  const mbValue = bytesValue ? (bytesValue / (1024 * 1024)) : 1;

                  return (
                    <div className="form-group" key={key}>
                      <label>Chunk Size (MB)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={mbValue}
                        onChange={(e) => {
                          const mb = parseFloat(e.target.value) || 1;
                          const bytes = Math.max(1, Math.round(mb * 1024 * 1024));
                          handleNodeConfigChange(key, bytes);
                        }}
                        placeholder="Enter chunk size in MB"
                      />
                    </div>
                  );
                }

                if (fieldType === 'number') {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey}</label>
                      <input
                        type="number"
                        value={nodeConfig[key] ?? value}
                        onChange={(e) => handleNodeConfigChange(key, parseFloat(e.target.value) || 0)}
                        placeholder={`Enter ${displayKey}`}
                      />
                    </div>
                  );
                }
                
                // Handle dropdowns
                if (key === 'deviceType') {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey}</label>
                      <select value={nodeConfig[key] ?? value} onChange={(e) => handleNodeConfigChange(key, e.target.value)}>
                        <option value="sender">Sender</option>
                        <option value="receiver">Receiver</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  );
                }
                
                if (key === 'method') {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey}</label>
                      <select value={nodeConfig[key] ?? value} onChange={(e) => handleNodeConfigChange(key, e.target.value)}>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                  );
                }
                
                if (key === 'priority') {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey}</label>
                      <select value={nodeConfig[key] ?? value} onChange={(e) => handleNodeConfigChange(key, e.target.value)}>
                        <option value="auto">Auto (ML-based)</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  );
                }
                
                if (key === 'protocol') {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey}</label>
                      <select value={nodeConfig[key] ?? value} onChange={(e) => handleNodeConfigChange(key, e.target.value)}>
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                        <option value="ws">WebSocket</option>
                        <option value="wss">Secure WebSocket</option>
                      </select>
                    </div>
                  );
                }
                
                // Handle objects (show as expandable JSON)
                if (fieldType === 'object' && value !== null && !Array.isArray(value)) {
                  return (
                    <div className="form-group nested-group" key={key}>
                      <label className="nested-label">{displayKey}</label>
                      <textarea
                        value={JSON.stringify(nodeConfig[key] ?? value, null, 2)}
                        onChange={(e) => {
                          try {
                            handleNodeConfigChange(key, JSON.parse(e.target.value));
                          } catch (err) {
                            // Invalid JSON
                          }
                        }}
                        rows="4"
                        className="json-textarea"
                      />
                    </div>
                  );
                }
                
                // Handle arrays
                if (Array.isArray(value)) {
                  return (
                    <div className="form-group" key={key}>
                      <label>{displayKey}</label>
                      <div className="array-display">
                        {value.length > 0 ? (
                          <code>{value.length} items</code>
                        ) : (
                          <span className="empty-array">Empty array</span>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // Default text input
                return (
                  <div className="form-group" key={key}>
                    <label>{displayKey}</label>
                    <input
                      type="text"
                      value={nodeConfig[key] ?? value}
                      onChange={(e) => handleNodeConfigChange(key, e.target.value)}
                      placeholder={`Enter ${displayKey}`}
                    />
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                No configuration options available for this node.
              </p>
            )}
            
            {/* Transfer Info Display for file-source */}
            {selectedNode.type === 'file-source' && nodeConfig.transfer_id && (
              <div className="transfer-info-box" style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Transfer Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Transfer ID:</span>
                    <code style={{ fontSize: '11px' }}>{nodeConfig.transfer_id}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Chunks:</span>
                    <code>{nodeConfig.chunks?.length || 0}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Priority:</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: '600', color: nodeConfig.priority === 'high' ? '#f59e0b' : '#10b981' }}>
                      {nodeConfig.priority}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && activeTransfer && (
          <div className="config-section">
            <div className="section-title">Transfer Details</div>
            
            <div className="detail-row">
              <span className="detail-label">File Name:</span>
              <span className="detail-value">{activeTransfer.fileName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">File Size:</span>
              <span className="detail-value">
                {(activeTransfer.fileSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Priority:</span>
              <span className={`badge badge-${activeTransfer.priority}`}>
                {activeTransfer.priority}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`badge badge-${activeTransfer.status}`}>
                {activeTransfer.status}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Progress:</span>
              <span className="detail-value">
                {(activeTransfer.progress * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {activeTab === 'chunks' && activeTransfer && (
          <ChunkMap transfer={activeTransfer} />
        )}

        {activeTab === 'telemetry' && activeTransfer && (
          <TelemetryGraph transferId={activeTransfer.id} />
        )}

        <AISuggestions />
      </div>

      <div className="panel-footer">
        <button className="btn btn-ghost" style={{ width: '100%' }}>
          <HelpCircle size={16} />
          Ask AI for Help
        </button>
      </div>
    </div>
  );
};

export default RightPanel;
