import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import TopBar from './components/TopBar';
import Palette from './components/Palette';
import Canvas, { SelectedElement } from './components/Canvas';
import Inspector from './components/Inspector';
import ActivityLog from './components/ActivityLog';
import SimulatorToolbar from './components/SimulatorToolbar';
import { onSocket } from './lib/socket';
import { useStore } from './store/useStore';

interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export default function App() {
  const upsert = useStore((s) => s.upsertTransfer);
  const addActivity = useStore((s) => s.addActivity);
  const transfers = useStore((s) => Object.values(s.transfers));
  const activity = useStore((s) => s.activity);
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'realtime' | 'simulation'>('realtime');

  useEffect(() => {
    const off1 = onSocket('transfer:update', (msg) => {
      upsert({
        transferId: msg.transfer_id,
        progress: msg.progress,
        speed: msg.speed,
        etaSecs: msg.eta_secs,
        priority: msg.priority,
        transport: msg.transport
      });
    });
    const off2 = onSocket('telemetry', (msg) => {
      addActivity(`T ${msg.transfer_id} speed=${Math.round((msg.speed || 0) / 1024)}KB/s loss=${msg.packet_loss ?? 0}`);
    });
    const off3 = onSocket('agent:suggest', (msg) => {
      addActivity(`Agent ${msg.agent} suggests: ${msg.suggestion.action}${msg.suggestion.value ? `=${msg.suggestion.value}` : ''}`);
    });
    return () => {
      off1(); off2(); off3();
    };
  }, [upsert, addActivity]);

  const completedCount = transfers.filter((t) => t.progress >= 1).length;
  const latestActivity = activity[0] || 'Waiting for telemetry...';
  const activeWorkflow = useMemo(
    () => workflows.find((wf) => wf.id === activeWorkflowId) || null,
    [workflows, activeWorkflowId]
  );

  const createWorkflow = () => {
    const id = `wf-${Date.now()}`;
    const wf: Workflow = { id, name: `Workflow ${workflows.length + 1}`, nodes: [], edges: [] };
    setWorkflows((prev) => [...prev, wf]);
    setActiveWorkflowId(id);
  };

  const handleWorkflowChange = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (!activeWorkflow) return;
      setWorkflows((prev) =>
        prev.map((wf) => (wf.id === activeWorkflow.id ? { ...wf, nodes, edges } : wf))
      );
    },
    [activeWorkflow]
  );

  return (
    <div className="app-shell">
      <TopBar mode={mode} onModeChange={setMode} />
      <div className="workspace">
        <div className="workspace__canvas">
          <div className="workflow-tabs">
            <div className="workflow-tabs__list">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  className={`workflow-tab ${wf.id === activeWorkflowId ? 'active' : ''}`}
                  onClick={() => setActiveWorkflowId(wf.id)}
                >
                  {wf.name}
                </button>
              ))}
            </div>
            <button className="pill primary" onClick={createWorkflow}>
              + New Workflow
            </button>
          </div>
          {activeWorkflow ? (
            <div className="canvas-grid">
              <div className="palette-panel glass-panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Palette</div>
                    <div className="panel-subtitle">Drag nodes onto the canvas</div>
                  </div>
                </div>
                <Palette />
              </div>
              <div className="canvas-panel glass-panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">{activeWorkflow.name}</div>
                    <div className="panel-subtitle">Connect senders, relays, receivers</div>
                  </div>
                  <div className="pill primary">{transfers.length} active</div>
                </div>
                <div className="pipelines-wrapper">
                  <Canvas
                    workflow={activeWorkflow}
                    onChange={handleWorkflowChange}
                    onSelect={setSelectedElement}
                    transfers={transfers}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="workspace-placeholder glass-panel">
              <h2>Create your first workflow</h2>
              <p>Drop senders, relays, and receivers onto the canvas to orchestrate SureRoute flows.</p>
              <button className="pill primary" onClick={createWorkflow}>
                + New Workflow
              </button>
            </div>
          )}
          <div className="workspace__footer">
            <div>
              <div className="footer-label">Active Transfers</div>
              <div className="footer-value">{transfers.length}</div>
            </div>
            <div>
              <div className="footer-label">Completed</div>
              <div className="footer-value">{completedCount}</div>
            </div>
            <div>
              <div className="footer-label">Latest Signal</div>
              <div className="footer-value footer-value--truncate">{latestActivity}</div>
            </div>
          </div>
        </div>
        <div className="workspace__panel">
          <div className="panel-block">
            <Inspector selected={selectedElement} />
          </div>
          <div className="panel-block">
            <div className="panel-header panel-header--small">
              <div>
                <div className="panel-title">Activity Log</div>
                <div className="panel-subtitle">Realtime telemetry + agent hints</div>
              </div>
            </div>
            <ActivityLog />
          </div>
          <div className="panel-block">
            <div className="panel-header panel-header--small">
              <div>
                <div className="panel-title">Simulator Controls</div>
                <div className="panel-subtitle">Inject latency, jitter, loss</div>
              </div>
            </div>
            <SimulatorToolbar mode={mode} onActivateSimulation={() => setMode('simulation')} />
          </div>
        </div>
      </div>
    </div>
  );
}

