import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Folder, Clock, Play, Trash2, Edit2, Copy } from 'lucide-react';
import './HomePage.css';

function HomePage() {
  const { workflows, createWorkflow, deleteWorkflow, setActiveWorkflow, theme, toggleTheme } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');


  console.log('=== HomePage Render ===');
  console.log('Workflows:', workflows);
  console.log('Current theme:', theme);
  console.log('=======================');

  const handleCreateWorkflow = () => {
    if (newWorkflowName.trim()) {
      createWorkflow(newWorkflowName, newWorkflowDesc);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      setShowCreateModal(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="home-page">
      {/* Theme Toggle Button - Always Visible */}
      <button 
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--accent-primary)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {/* Header */}
      <div className="home-header">
        <div className="home-header-content">
          <div className="home-title-section">
            <Folder className="home-icon" size={32} />
            <div>
              <h1>Your Workflows</h1>
              <p>Build and manage resilient file transfer workflows</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={20} />
              New Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="workflows-container">
        {workflows.length === 0 ? (
          <div className="empty-state">
            <Folder size={64} className="empty-icon" />
            <h2>No workflows yet</h2>
            <p>Create your first file transfer workflow to get started</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={20} />
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="workflows-grid">
            {workflows.map((workflow) => (
              <div 
                key={workflow.id} 
                className="workflow-card"
                onClick={() => setActiveWorkflow(workflow.id)}
              >
                <div className="workflow-card-header">
                  <div className="workflow-card-icon">
                    <Folder size={24} />
                  </div>
                  <div className="workflow-card-actions">
                    <button 
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit workflow name
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this workflow?')) {
                          deleteWorkflow(workflow.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="workflow-card-body">
                  <h3>{workflow.name}</h3>
                  <p className="workflow-description">{workflow.description || 'No description'}</p>
                  
                  <div className="workflow-meta">
                    <div className="workflow-stat">
                      <span className="stat-label">Nodes:</span>
                      <span className="stat-value">{workflow.nodes?.length || 0}</span>
                    </div>
                    <div className="workflow-stat">
                      <span className="stat-label">Status:</span>
                      <span className={`status-badge status-${workflow.status}`}>
                        {workflow.status}
                      </span>
                    </div>
                  </div>

                  <div className="workflow-footer">
                    <div className="workflow-date">
                      <Clock size={14} />
                      <span>{formatDate(workflow.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Workflow</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Workflow Name</label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g., File Transfer Pipeline"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={newWorkflowDesc}
                  onChange={(e) => setNewWorkflowDesc(e.target.value)}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
              >
                <Plus size={18} />
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default HomePage;
