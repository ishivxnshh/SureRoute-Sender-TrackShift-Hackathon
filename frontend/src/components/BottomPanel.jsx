import React, { useState } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { 
  Activity, 
  Zap, 
  WifiOff, 
  Clock, 
  TrendingDown,
  Settings,
  Play,
  RotateCcw,
} from 'lucide-react';
import './BottomPanel.css';

const BottomPanel = () => {
  const { 
    transfers, 
    simulatorSettings, 
    updateSimulatorSettings, 
    environment 
  } = useStore();
  
  const [activityLog, setActivityLog] = useState([
    { id: 1, type: 'info', message: 'System initialized', time: new Date() },
    { id: 2, type: 'success', message: 'Connected to backend', time: new Date() },
  ]);
  
  const [showSimulator, setShowSimulator] = useState(true);

  const handleSimulatorUpdate = async (key, value) => {
    updateSimulatorSettings({ [key]: value });
    try {
      await api.updateSimulator({ [key]: value });
    } catch (error) {
      console.error('Failed to update simulator:', error);
    }
  };

  const triggerEvent = async (eventType) => {
    try {
      await api.triggerNetworkEvent(eventType);
      setActivityLog(prev => [
        ...prev,
        { 
          id: Date.now(), 
          type: 'warning', 
          message: `Triggered: ${eventType}`,
          time: new Date() 
        }
      ]);
    } catch (error) {
      console.error('Failed to trigger event:', error);
    }
  };

  const addLogEntry = (type, message) => {
    setActivityLog(prev => [
      ...prev,
      { id: Date.now(), type, message, time: new Date() }
    ].slice(-50)); // Keep last 50 entries
  };

  const getTotalThroughput = () => {
    return transfers
      .filter(t => t.status === 'active')
      .reduce((sum, t) => sum + (t.speed || 0), 0);
  };

  const getSuccessRate = () => {
    const completed = transfers.filter(t => t.status === 'complete').length;
    const total = transfers.length;
    return total > 0 ? (completed / total * 100).toFixed(1) : 0;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bottom-panel">
      <div className="bottom-left">
        <div className="panel-section-header">
          <Activity size={16} />
          <span>Activity Feed</span>
        </div>
        
        <div className="activity-feed scrollable">
          {activityLog.map(entry => (
            <div key={entry.id} className={`activity-entry entry-${entry.type}`}>
              <div className="activity-indicator" />
              <div className="activity-content">
                <span className="activity-message">{entry.message}</span>
                <span className="activity-time">
                  {entry.time.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-center">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <Zap size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div className="metric-info">
              <div className="metric-label">Throughput</div>
              <div className="metric-value">{formatBytes(getTotalThroughput())}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <TrendingDown size={20} style={{ color: '#4ade80' }} />
            </div>
            <div className="metric-info">
              <div className="metric-label">Success Rate</div>
              <div className="metric-value">{getSuccessRate()}%</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Activity size={20} style={{ color: '#fbbf24' }} />
            </div>
            <div className="metric-info">
              <div className="metric-label">Active Transfers</div>
              <div className="metric-value">
                {transfers.filter(t => t.status === 'active').length}
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Clock size={20} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="metric-info">
              <div className="metric-label">Avg ETA</div>
              <div className="metric-value">
                {transfers.filter(t => t.eta).length > 0
                  ? Math.round(
                      transfers
                        .filter(t => t.eta)
                        .reduce((sum, t) => sum + t.eta, 0) / 
                      transfers.filter(t => t.eta).length
                    ) + 's'
                  : '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-right">
        <div className="panel-section-header">
          <Settings size={16} />
          <span>Network Simulator</span>
          <button
            className="toggle-btn"
            onClick={() => setShowSimulator(!showSimulator)}
          >
            {showSimulator ? '▼' : '▶'}
          </button>
        </div>

        {showSimulator && environment === 'demo' && (
          <div className="simulator-controls">
            <div className="simulator-row">
              <label>
                <Clock size={14} />
                Latency: {simulatorSettings.latency}ms
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={simulatorSettings.latency}
                onChange={(e) => handleSimulatorUpdate('latency', parseInt(e.target.value))}
              />
            </div>

            <div className="simulator-row">
              <label>
                <TrendingDown size={14} />
                Packet Loss: {simulatorSettings.packetLoss}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={simulatorSettings.packetLoss}
                onChange={(e) => handleSimulatorUpdate('packetLoss', parseInt(e.target.value))}
              />
            </div>

            <div className="simulator-actions">
              <button
                className="sim-btn danger"
                onClick={() => triggerEvent('drop_connection')}
              >
                <WifiOff size={14} />
                Drop Connection
              </button>
              <button
                className="sim-btn warning"
                onClick={() => triggerEvent('degrade_quality')}
              >
                <TrendingDown size={14} />
                Degrade Quality
              </button>
              <button
                className="sim-btn"
                onClick={() => {
                  handleSimulatorUpdate('latency', 0);
                  handleSimulatorUpdate('packetLoss', 0);
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          </div>
        )}

        {environment === 'real' && (
          <div className="real-mode-indicator">
            <Play size={16} />
            <span>Real mode active - Simulator disabled</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
