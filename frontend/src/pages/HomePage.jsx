import React, { useState } from 'react';
import { useStore } from '../store';
import {
  Plus,
  Folder,
  Clock,
  Trash2,
  Edit2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import './HomePage.css';
import ThreeBackground from '../components/ThreeBackground';
import AnimatedCard from '../components/AnimatedCard';

const BACKEND_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function HomePage() {
  const {
    workflows,
    createWorkflow,
    deleteWorkflow,
    setActiveWorkflow,
    setCurrentView,
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
  const [showPassword, setShowPassword] = useState(false);

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
      <ThreeBackground />
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
            {user ? (
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={20} />
                New Workflow
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => {
                  if (workflows && workflows.length > 0) {
                    setActiveWorkflow(workflows[0].id);
                  } else {
                    createWorkflow('Guest Workflow', 'Explore SureRoute as a guest');
                  }
                  setCurrentView('workflow');
                }}
              >
                Enter as guest
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth card when not logged in */}
      {!user && (
        <section className="auth-section">
          <AnimatedCard>
            <div className="auth-card">
              <div className="auth-header">
                <h2>
                  {authMode === 'login'
                    ? 'Welcome back to SureRoute'
                    : 'Create your SureRoute account'}
                </h2>
                <p>
                  Design workflows as a guest, or sign in to sync them across devices
                  and keep your presets safe.
                </p>
              </div>

              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => setAuthMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => setAuthMode('signup')}
                >
                  Sign up
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        authMode === 'signup'
                          ? 'At least 8 characters'
                          : 'Your password'
                      }
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="auth-error">
                    {authError}
                  </div>
                )}

                <button
                  className="btn-primary auth-submit-btn"
                  type="submit"
                  disabled={isAuthLoading}
                >
                  {isAuthLoading ? (
                    <span className="auth-loading">
                      <span className="auth-spinner" />
                      {authMode === 'login' ? 'Logging in…' : 'Creating account…'}
                    </span>
                  ) : authMode === 'login' ? (
                    'Log in'
                  ) : (
                    'Sign up'
                  )}
                </button>

                <div className="auth-divider">
                  <span />
                  <span>or</span>
                  <span />
                </div>

                <button
                  type="button"
                  className="auth-google-btn"
                  onClick={() => {
                    window.location.href = `${BACKEND_BASE}/../auth/google`;
                  }}
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google logo"
                  />
                  <span>Continue with Google</span>
                </button>
              </form>

              <div className="auth-footer">
                <div className="auth-mode-toggle">
                  <span>
                    {authMode === 'login'
                      ? "Don't have an account?"
                      : 'Already have an account?'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAuthMode((prev) =>
                        prev === 'login' ? 'signup' : 'login'
                      )
                    }
                  >
                    {authMode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>
                <p className="auth-guest-hint">
                  You can still explore and build workflows as a guest – they’ll
                  stay in this browser until you clear your data.
                </p>
              </div>
            </div>
          </AnimatedCard>
        </section>
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
