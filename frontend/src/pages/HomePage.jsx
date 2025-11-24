import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Folder, Clock, Trash2, Edit2 } from 'lucide-react';
import './HomePage.css';

const BACKEND_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';

function HomePage() {
  const { 
    workflows, 
    createWorkflow, 
    deleteWorkflow, 
    setActiveWorkflow, 
    theme, 
    toggleTheme,
    user,
    signup,
    login,
    logout,
    authError,
    isAuthLoading,
  } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateWorkflow = () => {
    if (newWorkflowName.trim()) {
      createWorkflow(newWorkflowName, newWorkflowDesc);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      setShowCreateModal(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (authMode === 'login') {
      await login(email, password);
    } else {
      await signup(email, password);
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
      {/* Header */}
      <div className="home-header">
        <div className="home-header-content">
          <div className="home-title-section">
            <Folder className="home-icon" size={32} />
            <div>
              <h1>SureRoute Workflows</h1>
              <p>Design and manage resilient SureRoute file transfer workflows</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--card-bg)',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  fontSize: '13px',
                }}
              >
                <span style={{ opacity: 0.8 }}>Signed in as</span>
                <span style={{ fontWeight: 600 }}>{user.email}</span>
                <button
                  onClick={logout}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Logout
                </button>
              </div>
            )}
            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={20} />
              New Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Auth card when not logged in */}
      {!user && (
        <div
          style={{
            maxWidth: '420px',
            margin: '0 auto 24px',
            padding: '20px 24px',
            borderRadius: '16px',
            background: 'var(--card-bg)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '18px' }}>
            {authMode === 'login' ? 'Log in to save your workflows' : 'Create an account'}
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '13px', opacity: 0.8 }}>
            You can build workflows as a guest, but they will only be saved to your profile and available across sessions once you log in or create an account.
          </p>
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {authError && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#ff6b6b',
                  marginTop: '4px',
                }}
              >
                {authError}
              </div>
            )}
            <button
              className="btn-primary"
              type="submit"
              disabled={isAuthLoading}
              style={{ marginTop: '8px' }}
            >
              {isAuthLoading
                ? authMode === 'login'
                  ? 'Logging in...'
                  : 'Signing up...'
                : authMode === 'login'
                ? 'Log In'
                : 'Sign Up'}
            </button>
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${BACKEND_BASE}/auth/google`;
                }}
                style={{
                  borderRadius: '999px',
                  padding: '8px 14px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  style={{ width: 16, height: 16 }}
                />
                <span>Continue with Google</span>
              </button>
            </div>
          </form>
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() =>
                setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'))
              }
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      )}

      {/* Workflows Grid */}
      <div className="workflows-container">
        {workflows.length === 0 ? (
          <div className="empty-state">
            <Folder size={64} className="empty-icon" />
            <h2>No workflows yet</h2>
            <p>
              {user
                ? 'Create your first file transfer workflow to get started.'
                : 'Start building a workflow as a guest. To save it to your profile for later, create an account or log in.'}
            </p>
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
