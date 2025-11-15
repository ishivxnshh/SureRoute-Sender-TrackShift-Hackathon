import React from 'react';

interface TopBarProps {
  mode: 'realtime' | 'simulation';
  onModeChange: (mode: 'realtime' | 'simulation') => void;
}

export default function TopBar({ mode, onModeChange }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar__left">
        <div className="logo-blip" />
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-400">SureRoute</div>
          <div className="text-base font-semibold text-white">Interactive Mesh</div>
        </div>
        <div className="mode-pill">
          <span>Logical</span>
          <span className="chevron">⌄</span>
        </div>
      </div>
      <div className="top-bar__center">
        <button
          className={`pill ${mode === 'realtime' ? 'active' : ''}`}
          onClick={() => onModeChange('realtime')}
        >
          Real time
        </button>
        <button
          className={`pill ${mode === 'simulation' ? 'active' : ''}`}
          onClick={() => onModeChange('simulation')}
        >
          Simulation
        </button>
      </div>
      <div className="top-bar__right">
        <div className="avatar-stack">
          {['A', 'B', 'C', 'D'].map((label) => (
            <div key={label} className="avatar">
              {label}
            </div>
          ))}
        </div>
        <div className="avatar more">+8</div>
      </div>
    </header>
  );
}


