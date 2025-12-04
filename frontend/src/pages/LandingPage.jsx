import React, { useState } from 'react';
import { useStore } from '../store';
import { Activity, Shield, Zap, Cpu, Wifi, Lock, AlertTriangle, Plus, Folder, Clock, Trash2, LogOut } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const { 
        login, 
        signup, 
        logout,
        authError, 
        isAuthLoading, 
        setCurrentView, 
        user,
        workflows,
        createWorkflow,
        deleteWorkflow,
        setActiveWorkflow
    } = useStore();
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isGuest, setIsGuest] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (authMode === 'signup') {
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            if (password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
        }

        const success = authMode === 'login' 
            ? await login(email, password)
            : await signup(email, password);

        if (success) {
            setShowAuth(false);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        }
    };

    const handleGuestMode = () => {
        setShowAuth(false);
        setIsGuest(true);
        // Guest mode just closes the modal, user can then create workflows
        // The workflows section will be visible even without login
    };

    const switchMode = () => {
        setAuthMode(authMode === 'login' ? 'signup' : 'login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-grid"></div>

                <div className="hero-content">
                    <h1 className="hero-title">SureRoute</h1>
                    <h2 className="hero-subtitle">Haas F1 Team File Transfer</h2>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">0.02s</span>
                            <span className="stat-label">Latency</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">100%</span>
                            <span className="stat-label">Integrity</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">AES-256</span>
                            <span className="stat-label">Security</span>
                        </div>
                    </div>

                    <button className="start-btn" onClick={() => setShowAuth(true)}>
                        Initialize System
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-grid">
                    <div className="feature-card">
                        <Activity className="feature-icon" size={32} />
                        <h3 className="feature-title">Real-Time Telemetry</h3>
                        <p className="feature-desc">
                            Monitor transfer speeds, packet loss, and latency in real-time with F1-grade precision.
                        </p>
                    </div>

                    <div className="feature-card">
                        <Cpu className="feature-icon" size={32} />
                        <h3 className="feature-title">Pit Crew AI</h3>
                        <p className="feature-desc">
                            Autonomous agents optimize routing and chunk sizes based on network conditions.
                        </p>
                    </div>

                    <div className="feature-card">
                        <Shield className="feature-icon" size={32} />
                        <h3 className="feature-title">Secure Transport</h3>
                        <p className="feature-desc">
                            Chunk-based verification ensures every byte arrives intact, even on unstable connections.
                        </p>
                    </div>

                    <div className="feature-card">
                        <Zap className="feature-icon" size={32} />
                        <h3 className="feature-title">Instant Failover</h3>
                        <p className="feature-desc">
                            Seamlessly switch between WiFi, Bluetooth, and Relay servers without stopping the transfer.
                        </p>
                    </div>
                </div>
            </section>

            {/* Workflows Section - Show when logged in OR in guest mode */}
            {(user || isGuest) && (
                <section className="workflows-section">
                    <div className="workflows-header">
                        <div>
                            <h2 className="workflows-title">My Workflows</h2>
                            <p className="workflows-subtitle">Design and manage your file transfer workflows</p>
                        </div>
                        <div className="workflows-header-actions">
                            {user ? (
                                <div className="user-info">
                                    <span className="user-email">{user.email}</span>
                                    <button className="logout-btn" onClick={logout}>
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            ) : isGuest ? (
                                <div className="user-info">
                                    <span className="user-email">Guest Mode</span>
                                    <button className="logout-btn" onClick={() => {
                                        setIsGuest(false);
                                        setShowAuth(true);
                                    }}>
                                        <Lock size={16} />
                                        Sign In
                                    </button>
                                </div>
                            ) : null}
                            <button className="create-workflow-btn" onClick={() => {
                                const name = prompt('Enter workflow name:');
                                if (name?.trim()) {
                                    createWorkflow(name.trim(), '');
                                }
                            }}>
                                <Plus size={20} />
                                New Workflow
                            </button>
                        </div>
                    </div>

                    <div className="workflows-grid">
                        {workflows.length === 0 ? (
                            <div className="no-workflows">
                                <Folder size={48} className="no-workflows-icon" />
                                <h3>No workflows yet</h3>
                                <p>Create your first workflow to get started</p>
                            </div>
                        ) : (
                            workflows.map(workflow => (
                                <div 
                                    key={workflow.id} 
                                    className="workflow-card"
                                    onClick={() => {
                                        setActiveWorkflow(workflow.id);
                                        setCurrentView('workflow');
                                    }}
                                >
                                    <div className="workflow-card-header">
                                        <Folder className="workflow-card-icon" size={24} />
                                        <button 
                                            className="workflow-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete workflow "${workflow.name}"?`)) {
                                                    deleteWorkflow(workflow.id);
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h3 className="workflow-card-title">{workflow.name}</h3>
                                    <p className="workflow-card-desc">{workflow.description || 'No description'}</p>
                                    <div className="workflow-card-footer">
                                        <div className="workflow-card-stat">
                                            <span className="stat-label">Nodes:</span>
                                            <span className="stat-value">{workflow.nodes?.length || 0}</span>
                                        </div>
                                        <div className="workflow-card-stat">
                                            <Clock size={14} />
                                            <span className="stat-value">
                                                {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : 'Never'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* Auth Modal */}
            {showAuth && !user && (
                <div className="login-modal-overlay" onClick={() => setShowAuth(false)}>
                    <div className="login-modal auth-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowAuth(false)}>×</button>
                        
                        {/* Auth Mode Tabs */}
                        <div className="auth-tabs">
                            <button 
                                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                                onClick={() => setAuthMode('login')}
                                type="button"
                            >
                                <Lock size={16} />
                                Login
                            </button>
                            <button 
                                className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                                onClick={() => setAuthMode('signup')}
                                type="button"
                            >
                                <Shield size={16} />
                                Sign Up
                            </button>
                        </div>

                        <h2 className="login-title">
                            {authMode === 'login' ? 'Pit Wall Access' : 'Join the Crew'}
                        </h2>

                        {authError && (
                            <div className="auth-error">
                                <AlertTriangle size={16} />
                                {authError}
                            </div>
                        )}

                        <form className="login-form" onSubmit={handleAuth}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="engineer@haas-f1.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={isAuthLoading}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={isAuthLoading}
                                    required
                                />
                            </div>

                            {authMode === 'signup' && (
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        disabled={isAuthLoading}
                                        required
                                    />
                                </div>
                            )}

                            <button type="submit" className="login-btn" disabled={isAuthLoading}>
                                {isAuthLoading ? (
                                    <span className="loading-spinner">●</span>
                                ) : (
                                    authMode === 'login' ? 'Enter Pit Wall' : 'Create Account'
                                )}
                            </button>

                            <div className="auth-footer">
                                {authMode === 'login' ? (
                                    <p>
                                        New to the team?{' '}
                                        <button type="button" className="auth-switch-btn" onClick={switchMode}>
                                            Sign up here
                                        </button>
                                    </p>
                                ) : (
                                    <p>
                                        Already have access?{' '}
                                        <button type="button" className="auth-switch-btn" onClick={switchMode}>
                                            Login here
                                        </button>
                                    </p>
                                )}
                            </div>

                            <div className="oauth-divider">
                                <span>OR</span>
                            </div>

                            <a href="http://localhost:5000/auth/google" className="google-auth-btn">
                                <svg width="18" height="18" viewBox="0 0 18 18">
                                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                                </svg>
                                Continue with Google
                            </a>

                            <div className="guest-mode-section">
                                <button type="button" className="guest-mode-btn" onClick={handleGuestMode}>
                                    <Wifi size={18} />
                                    Continue as Guest
                                    <span className="guest-badge">Test Mode</span>
                                </button>
                                <p className="guest-note">
                                    Guest mode allows you to explore the platform without an account. 
                                    Your workflows won't be saved.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
