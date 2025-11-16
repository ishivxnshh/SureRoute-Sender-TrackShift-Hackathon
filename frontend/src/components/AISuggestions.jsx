import React from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { Brain, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './AISuggestions.css';

const AISuggestions = () => {
  const { aiSuggestions, removeAISuggestion, automationLevel, setAutomationLevel } = useStore();

  const handleAccept = async (suggestion) => {
    try {
      await api.acceptSuggestion(suggestion.id);
      removeAISuggestion(suggestion.id);
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    }
  };

  const handleReject = async (suggestion) => {
    try {
      await api.rejectSuggestion(suggestion.id);
      removeAISuggestion(suggestion.id);
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'reduce_chunk_size':
      case 'increase_concurrency':
      case 'decrease_concurrency':
        return '⚙️';
      case 'use_relay':
      case 'switch_transport':
        return '🔄';
      case 'pause_low_priority':
        return '⏸️';
      default:
        return '💡';
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      reduce_chunk_size: 'Reduce Chunk Size',
      increase_concurrency: 'Increase Concurrency',
      decrease_concurrency: 'Decrease Concurrency',
      use_relay: 'Use Relay Server',
      switch_transport: 'Switch Transport',
      pause_low_priority: 'Pause Low Priority',
    };
    return labels[action] || action;
  };

  return (
    <div className="ai-suggestions-container">
      <div className="suggestions-header">
        <div className="header-title">
          <Brain size={18} style={{ color: '#8b5cf6' }} />
          <span>AI Suggestions</span>
        </div>
        
        <select
          value={automationLevel}
          onChange={(e) => setAutomationLevel(e.target.value)}
          className="automation-select"
        >
          <option value="manual">Manual</option>
          <option value="assistive">Assistive</option>
          <option value="autonomous">Autonomous</option>
        </select>
      </div>

      {automationLevel === 'manual' && (
        <div className="automation-hint">
          <AlertTriangle size={14} />
          <span>AI suggestions require manual approval</span>
        </div>
      )}

      {automationLevel === 'autonomous' && (
        <div className="automation-hint autonomous">
          <CheckCircle size={14} />
          <span>AI suggestions are auto-applied</span>
        </div>
      )}

      <div className="suggestions-list">
        {aiSuggestions.length === 0 ? (
          <div className="no-suggestions">
            <div className="no-suggestions-icon">🤖</div>
            <p>No AI suggestions at the moment</p>
            <span>System is monitoring...</span>
          </div>
        ) : (
          aiSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="suggestion-card">
              <div className="suggestion-icon">
                {getActionIcon(suggestion.action)}
              </div>
              
              <div className="suggestion-content">
                <div className="suggestion-agent">
                  Agent {suggestion.agent.charAt(0)}
                </div>
                <div className="suggestion-action">
                  {getActionLabel(suggestion.action)}
                </div>
                <div className="suggestion-reason">
                  {suggestion.reason}
                </div>
                <div className="suggestion-time">
                  {new Date(suggestion.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {automationLevel !== 'autonomous' && (
                <div className="suggestion-actions">
                  <button
                    className="suggestion-btn accept"
                    onClick={() => handleAccept(suggestion)}
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    className="suggestion-btn reject"
                    onClick={() => handleReject(suggestion)}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}

              {automationLevel === 'autonomous' && (
                <div className="auto-applied-badge">
                  <CheckCircle size={14} />
                  Auto-Applied
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AISuggestions;
