import React, { useState } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { Play, Square, Wifi, WifiOff, Bluetooth, AlertTriangle, HelpCircle, Moon, Sun, Home } from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
  const { 
    connectionStatus, 
    environment, 
    setEnvironment,
    activeTransports,
    transfers,
    theme,
    toggleTheme,
    setCurrentView,
    activeWorkflowId,
    workflows,
    updateWorkflow,
    updateTransfer,
  } = useStore();

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const handleNameClick = () => {
    if (activeWorkflow) {
      setEditedName(activeWorkflow.name);
      setIsEditingName(true);
    }
  };

  const handleNameChange = (e) => {
    setEditedName(e.target.value);
  };

  const handleNameBlur = () => {
    if (activeWorkflow && editedName.trim()) {
      // Update in store
      updateWorkflow(activeWorkflowId, { name: editedName.trim() });
      
      // Update in localStorage
      try {
        const savedWorkflows = JSON.parse(localStorage.getItem('sureroute_workflows') || '[]');
        const updatedWorkflows = savedWorkflows.map(w => {
          if (w.name === activeWorkflow.name) {
            return { ...w, name: editedName.trim(), savedAt: new Date().toISOString() };
          }
          return w;
        });
        localStorage.setItem('sureroute_workflows', JSON.stringify(updatedWorkflows));
      } catch (error) {
        console.error('Failed to update workflow name:', error);
      }
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <div className="status-indicator status-connected" />;
      case 'degraded':
        return <div className="status-indicator status-degraded" />;
      default:
        return <div className="status-indicator status-disconnected" />;
    }
  };

  const handleStartAll = () => {
    transfers.forEach(transfer => {
      if (transfer.status === 'paused' || transfer.status === 'ready') {
        // Start transfer logic
        console.log('Starting transfer:', transfer.id);
      }
    });
  };

  const handleStopAll = async () => {
    try {
      // Optimistically update UI
      transfers.forEach((t) => {
        if (t.status === 'active' || t.status === 'ready' || t.status === 'initiated' || t.status === 'transferring') {
          updateTransfer(t.id, { status: 'cancelled' });
        }
      });

      await api.cancelAllTransfers();
    } catch (error) {
      console.error('Failed to stop all transfers:', error);
    }
  };

  const hasActiveTransfers = transfers.some(t => t.status === 'active');

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button className="home-btn" onClick={() => setCurrentView('landing')} title="Back to Workflows">
          <Home size={20} />
        </button>
        <div className="project-name">
          <div className="logo-icon">⚡</div>
          <div className="project-info">
            {activeWorkflow ? (
              <input
                type="text"
                className="workflow-name-input-topbar"
                value={editedName || activeWorkflow.name}
                onChange={(e) => {
                  setEditedName(e.target.value);
                  if (e.target.value.trim()) {
                    updateWorkflow(activeWorkflowId, { name: e.target.value.trim() });
                    try {
                      const savedWorkflows = JSON.parse(localStorage.getItem('sureroute_workflows') || '[]');
                      const updatedWorkflows = savedWorkflows.map(w => {
                        if (w.name === activeWorkflow.name) {
                          return { ...w, name: e.target.value.trim(), savedAt: new Date().toISOString() };
                        }
                        return w;
                      });
                      localStorage.setItem('sureroute_workflows', JSON.stringify(updatedWorkflows));
                    } catch (error) {
                      console.error('Failed to update workflow name:', error);
                    }
                  }
                }}
                placeholder="Untitled Workflow"
                size={Math.max(15, (editedName || activeWorkflow.name).length + 2)}
              />
            ) : (
              <h1>SureRoute</h1>
            )}
            {activeWorkflow && <span className="workflow-name">Workflow Editor</span>}
          </div>
        </div>
      </div>

      <div className="top-bar-center">
        <div className="connection-status">
          {getStatusIcon()}
          <span className="status-text">
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'degraded' && 'Degraded'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
          </span>
        </div>

        <div className="transport-indicators">
          {activeTransports.includes('wifi') && (
            <div className="transport-badge" data-tooltip="WiFi Active">
              <Wifi size={16} />
            </div>
          )}
          {activeTransports.includes('bluetooth') && (
            <div className="transport-badge" data-tooltip="Bluetooth Active">
              <Bluetooth size={16} />
            </div>
          )}
          {activeTransports.includes('relay') && (
            <div className="transport-badge relay" data-tooltip="Relay Active">
              <AlertTriangle size={16} />
            </div>
          )}
        </div>
      </div>

      <div className="top-bar-right">
        <div className="environment-toggle">
          <button
            className={`env-btn ${environment === 'demo' ? 'active' : ''}`}
            onClick={() => setEnvironment('demo')}
          >
            Demo Mode
          </button>
          <button
            className={`env-btn ${environment === 'real' ? 'active' : ''}`}
            onClick={() => setEnvironment('real')}
          >
            Real Mode
          </button>
        </div>

        <div className="control-buttons">
          <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {!hasActiveTransfers ? (
            <button className="btn btn-success" onClick={handleStartAll}>
              <Play size={16} />
              Start All
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleStopAll}>
              <Square size={16} />
              Stop All
            </button>
          )}
        </div>

        <button className="btn btn-ghost ask-ai-btn" data-tooltip="Ask AI Anything">
          <HelpCircle size={18} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
