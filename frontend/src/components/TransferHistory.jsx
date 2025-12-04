import React from 'react';
import { useStore } from '../store';
import { X, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const TransferHistory = ({ onClose }) => {
    const { transferHistory } = useStore();

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HistoryIcon />
                        <h2>Race Data Archive</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ padding: '0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-tertiary)', fontFamily: 'var(--font-display)' }}>
                                <tr>
                                    <th style={{ padding: '15px', borderBottom: '1px solid var(--border-primary)' }}>File</th>
                                    <th style={{ padding: '15px', borderBottom: '1px solid var(--border-primary)' }}>Size</th>
                                    <th style={{ padding: '15px', borderBottom: '1px solid var(--border-primary)' }}>Transport</th>
                                    <th style={{ padding: '15px', borderBottom: '1px solid var(--border-primary)' }}>Status</th>
                                    <th style={{ padding: '15px', borderBottom: '1px solid var(--border-primary)' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transferHistory.map((transfer) => (
                                    <tr key={transfer.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={16} color="var(--text-secondary)" />
                                            <span style={{ fontFamily: 'monospace' }}>{transfer.fileName}</span>
                                        </td>
                                        <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{formatSize(transfer.size)}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '2px',
                                                background: 'rgba(255,255,255,0.1)',
                                                fontSize: '0.8rem'
                                            }}>
                                                {transfer.transport}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {transfer.status === 'completed' ? (
                                                    <CheckCircle size={14} color="var(--success)" />
                                                ) : (
                                                    <AlertTriangle size={14} color="var(--error)" />
                                                )}
                                                <span style={{
                                                    color: transfer.status === 'completed' ? 'var(--success)' : 'var(--error)',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {transfer.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                            {formatDate(transfer.timestamp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {transferHistory.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No race data recorded yet.
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close Archive</button>
                </div>
            </div>
        </div>
    );
};

const HistoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
    </svg>
);

export default TransferHistory;
