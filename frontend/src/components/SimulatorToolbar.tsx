import React, { useState } from 'react';
import { setSimulator } from '../lib/api';
import { useStore } from '../store/useStore';

interface SimulatorToolbarProps {
  mode: 'realtime' | 'simulation';
  onActivateSimulation: () => void;
}

export default function SimulatorToolbar({ mode, onActivateSimulation }: SimulatorToolbarProps) {
  const addActivity = useStore((s) => s.addActivity);
  const [latency, setLatency] = useState(50);
  const [jitter, setJitter] = useState(20);
  const [loss, setLoss] = useState(0);
  const [down, setDown] = useState(false);

  async function apply() {
    await setSimulator({ latency_ms: latency, jitter_ms: jitter, packet_loss: loss, down });
    addActivity(`Simulator updated: latency=${latency}ms jitter=${jitter}ms loss=${loss} down=${down}`);
  }

  return (
    <div className="simulator-panel">
      <div className="sim-mode-hint">
        Mode: <span className={mode === 'simulation' ? 'hint-active' : ''}>{mode}</span>
      </div>
      <div className="sim-row">
        <label>Latency (ms)</label>
        <input type="number" value={latency} onChange={(e) => setLatency(Number(e.target.value))} />
      </div>
      <div className="sim-row">
        <label>Jitter (ms)</label>
        <input type="number" value={jitter} onChange={(e) => setJitter(Number(e.target.value))} />
      </div>
      <div className="sim-row">
        <label>Packet Loss</label>
        <input type="number" step="0.01" min="0" max="1" value={loss} onChange={(e) => setLoss(Number(e.target.value))} />
      </div>
      <div className="sim-row sim-row--inline">
        <label>Link Down</label>
        <input id="down" type="checkbox" checked={down} onChange={(e) => setDown(e.target.checked)} />
      </div>
      {mode === 'simulation' ? (
        <button className="pill primary w-full" onClick={apply}>
          Apply Scenario
        </button>
      ) : (
        <button className="pill primary w-full" onClick={onActivateSimulation}>
          Enable Simulation Mode
        </button>
      )}
    </div>
  );
}


