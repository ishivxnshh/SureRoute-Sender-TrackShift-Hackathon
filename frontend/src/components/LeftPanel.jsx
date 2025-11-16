import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { 
  Server, 
  Laptop, 
  File, 
  Radio, 
  Download, 
  Database,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import './LeftPanel.css';

const ComponentItem = ({ type, icon: Icon, label, color }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: { type, label, color },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`component-item ${isDragging ? 'dragging' : ''}`}
      style={{ borderLeftColor: color }}
    >
      <div className="component-icon" style={{ color }}>
        <Icon size={20} />
      </div>
      <div className="component-info">
        <div className="component-label">{label}</div>
        <div className="component-hint">Drag to canvas</div>
      </div>
    </div>
  );
};

const COMPONENTS = [
  { type: 'sender', icon: Server, label: 'Sender Node', color: '#3b82f6' },
  { type: 'receiver', icon: Laptop, label: 'Receiver Node', color: '#10b981' },
  { type: 'file-selector', icon: File, label: 'File Selector', color: '#8b5cf6' },
  { type: 'realtime-push', icon: Radio, label: 'Realtime Push', color: '#f59e0b' },
  { type: 'api-fetch', icon: Download, label: 'API Fetch', color: '#06b6d4' },
  { type: 'data-source', icon: Database, label: 'Data Source', color: '#ec4899' },
  { type: 'processor', icon: Cpu, label: 'Processor', color: '#84cc16' },
];

const LeftPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = COMPONENTS.filter(comp =>
    comp.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="left-panel">
      <div className="panel-header">
        <h3>Components</h3>
        <button className="btn-icon" data-tooltip="Need help?">
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="components-list scrollable">
        <div className="component-category">
          <div className="category-title">Nodes & Sources</div>
          {filteredComponents.map((comp) => (
            <ComponentItem
              key={comp.type}
              type={comp.type}
              icon={comp.icon}
              label={comp.label}
              color={comp.color}
            />
          ))}
        </div>

        <div className="component-category">
          <div className="category-title">Quick Actions</div>
          <div className="quick-action-item">
            <File size={16} />
            <span>Browse Local Files</span>
          </div>
          <div className="quick-action-item">
            <Server size={16} />
            <span>Scan Network</span>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <div className="tips-box">
          <div className="tips-icon">💡</div>
          <div className="tips-text">
            <strong>Tip:</strong> Drag components to the canvas and configure them by clicking
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
