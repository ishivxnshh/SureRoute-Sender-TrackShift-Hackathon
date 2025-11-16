import React, { useState } from 'react';
import { 
  FileInput, 
  FileOutput, 
  Shuffle, 
  Filter, 
  Brain,
  Clock,
  AlertTriangle,
  Network,
  Bluetooth,
  Wifi,
  Database,
  Search
} from 'lucide-react';
import './NodeSidebar.css';

const NODE_TYPES = [
  // Core Device Nodes
  {
    id: 'device',
    label: 'Device',
    type: 'Device',
    icon: '📱',
    color: '#3b82f6',
    description: 'Configure sender or receiver device',
    defaultConfig: {
      deviceName: '',
      deviceType: 'sender', // sender, receiver, both
      // For sender we don't need network details in the UI.
      // For receiver we let the user specify an API endpoint instead of IP/port.
      apiEndpoint: '',
      protocol: 'http',
      authentication: false,
      authToken: ''
    }
  },
  
  // Data Source Nodes
  {
    id: 'file-source',
    label: 'File Source',
    type: 'Source',
    icon: '📁',
    color: '#10b981',
    description: 'Upload files from your system',
    defaultConfig: {
      selectedFiles: [],
      file_name: '',
      file_size: 0,
      chunk_size: 1048576, // 1MB chunks
      chunks: [],
        priority: 'auto', // auto, low, medium, high, critical
      transfer_id: '',
      metadata: {
        mimeType: '',
        lastModified: '',
        checksum: ''
      }
    }
  },
  
  {
    id: 'api-data',
    label: 'API Data',
    type: 'Source',
    icon: '🌐',
    color: '#06b6d4',
    description: 'Fetch data from API endpoint',
    defaultConfig: {
      url: '',
      method: 'GET', // GET, POST, PUT, DELETE, PATCH
      headers: {
        'Content-Type': 'application/json'
      },
      params: {},
      body: '',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      authentication: {
        type: 'none', // none, bearer, basic, apikey
        token: '',
        username: '',
        password: '',
        apiKey: ''
      },
      responseMapping: {
        dataPath: '',
        fileNamePath: '',
        contentPath: ''
      }
    }
  },
  
  {
    id: 'relay-server',
    label: 'Relay Server',
    type: 'Transport',
    icon: '🔄',
    color: '#8b5cf6',
    description: 'Store-and-forward relay transport',
    defaultConfig: {
      relayUrl: 'http://localhost:5001',
      transferMode: 'relay', // relay, direct, hybrid
      chunkSize: 65536, // 64KB
      maxRetries: 5,
      timeout: 60000
    }
  },
  
  {
    id: 'wifi-transfer',
    label: 'WiFi Transfer',
    type: 'Transport',
    icon: '📡',
    color: '#0ea5e9',
    description: 'Direct WiFi transfer',
    defaultConfig: {
      targetIp: '',
      targetPort: 5000,
      useEncryption: true,
      bandwidth: 'auto', // auto, 1mbps, 10mbps, 100mbps
      qosLevel: 'normal' // low, normal, high
    }
  },
  
  {
    id: 'compress',
    label: 'Compress',
    type: 'Transform',
    icon: '🗜️',
    color: '#f59e0b',
    description: 'Compress files before transfer',
    defaultConfig: {
      algorithm: 'gzip', // gzip, deflate, brotli, lz4
      compressionLevel: 6, // 1-9
      preserveMetadata: true
    }
  },
  
  {
    id: 'encrypt',
    label: 'Encrypt',
    type: 'Transform',
    icon: '🔒',
    color: '#ef4444',
    description: 'Encrypt files for secure transfer',
    defaultConfig: {
      algorithm: 'aes-256-gcm',
      key: '',
      generateKey: true,
      keyDerivation: 'pbkdf2'
    }
  },
  
  {
    id: 'output',
    label: 'Output',
    type: 'Destination',
    icon: '💾',
    color: '#84cc16',
    description: 'Save received files',
    defaultConfig: {
      destinationPath: './received',
      overwriteExisting: false,
      createDirectories: true,
      preserveStructure: true,
      notification: true
    }
  }
];

const NodeSidebar = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(NODE_TYPES.map(node => node.type))];

  const filteredNodes = NODE_TYPES.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || node.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/json', JSON.stringify(nodeType));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="node-sidebar">
      <div className="sidebar-header">
        <h3>Add Nodes</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="sidebar-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="sidebar-categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="sidebar-nodes">
        {filteredNodes.length === 0 ? (
          <div className="no-results">
            <Search size={32} />
            <p>No nodes found</p>
          </div>
        ) : (
          filteredNodes.map(node => (
            <div
              key={node.id}
              className="node-item"
              draggable
              onDragStart={(e) => handleDragStart(e, node)}
            >
              <div className="node-item-icon" style={{ background: node.color }}>
                {node.icon}
              </div>
              <div className="node-item-info">
                <div className="node-item-label">{node.label}</div>
                <div className="node-item-description">{node.description}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NodeSidebar;
