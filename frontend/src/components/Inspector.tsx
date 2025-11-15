import React from 'react';
import { useStore } from '../store/useStore';
import { SelectedElement } from './Canvas';

interface InspectorProps {
  selected: SelectedElement;
}

export default function Inspector({ selected }: InspectorProps) {
  const transfers = useStore((s) => s.transfers);
  if (!selected) {
    return <div className="panel-placeholder">Select a node or link to inspect.</div>;
  }
  if (selected.kind === 'node') {
    const node = selected.node;
    return (
      <div>
        <div className="panel-title mb-1">Node</div>
        <div className="inspector-grid">
          <label>Label</label>
          <div>{node.data?.label}</div>
          <label>Type</label>
          <div>{node.data?.type}</div>
          <label>Stats</label>
          <div>{node.data?.stats || 'Idle'}</div>
          <label>Position</label>
          <div>
            {Math.round(node.position.x)}, {Math.round(node.position.y)}
          </div>
        </div>
        <button className="pill primary w-full mt-3">Ask AI for tuning</button>
      </div>
    );
  }
  const edge = selected.edge;
  const transfer = edge.data?.transferId ? transfers[edge.data.transferId] : null;
  return (
    <div>
      <div className="panel-title mb-1">Link</div>
      <div className="inspector-grid">
        <label>Connection</label>
        <div>
          {edge.source} → {edge.target}
        </div>
        <label>Label</label>
        <div>{edge.label || 'Untitled link'}</div>
        {transfer && (
          <>
            <label>Transfer</label>
            <div>{transfer.fileName}</div>
            <label>Progress</label>
            <div>{Math.round(transfer.progress * 100)}%</div>
            <label>Speed</label>
            <div>{Math.round(transfer.speed / 1024)} KB/s</div>
          </>
        )}
      </div>
      {!transfer && <button className="pill primary w-full mt-3">Bind Transfer</button>}
    </div>
  );
}


