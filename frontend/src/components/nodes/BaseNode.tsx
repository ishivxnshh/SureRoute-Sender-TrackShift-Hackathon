import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const typeColors: Record<string, string> = {
  sender: '#5d7dff',
  receiver: '#63e0b3',
  file: '#ffb978',
  relay: '#ff71a8',
  default: '#94a3b8'
};

export default function BaseNode({ data }: NodeProps<{ label: string; type: string; stats?: string }>) {
  const color = typeColors[data.type] || typeColors.default;
  return (
    <div className="flow-node" style={{ borderColor: color }}>
      <div className="flow-node__label">{data.label}</div>
      {data.stats && <div className="flow-node__stats">{data.stats}</div>}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

