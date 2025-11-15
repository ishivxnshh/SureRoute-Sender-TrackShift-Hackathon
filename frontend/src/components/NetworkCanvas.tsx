import React from 'react';

const nodes = [
  { id: 'pc1', label: 'PC Pixelz 1', ip: '192.168.21.2 / 29', x: 20, y: 32, icon: '🖥️', highlight: true },
  { id: 'pc2', label: 'PC Pixelz 2', ip: '192.168.21.2 / 29', x: 72, y: 30, icon: '🖥️' },
  { id: 'router', label: 'Pixelz Router 1', ip: 'Pixel Router', x: 45, y: 45, icon: '📡', core: true },
  { id: 'wrt', label: 'WRT300N', ip: 'Internet Service Provider', x: 45, y: 13, icon: '🌐' },
  { id: 'phone', label: 'Smartphone 3', ip: '192.168.21.2 / 29', x: 30, y: 65, icon: '📱' },
  { id: 'laptop1', label: 'Laptop Pixelz 1', ip: '192.168.31.8 / 29', x: 60, y: 65, icon: '💻' },
  { id: 'laptop2', label: 'Laptop Pixelz 2', ip: '192.168.32.4 / 29', x: 45, y: 80, icon: '💻' }
];

const links = [
  ['pc1', 'router'],
  ['pc2', 'router'],
  ['wrt', 'router'],
  ['phone', 'router'],
  ['laptop1', 'router'],
  ['laptop2', 'router']
];

export default function NetworkCanvas() {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <div className="network-canvas">
      <svg className="network-canvas__lines">
        {links.map(([from, to]) => {
          const a = nodeMap[from];
          const b = nodeMap[to];
          if (!a || !b) return null;
          return (
            <line
              key={`${from}-${to}`}
              x1={`${a.x}%`}
              y1={`${a.y}%`}
              x2={`${b.x}%`}
              y2={`${b.y}%`}
              stroke="rgba(70, 132, 255, 0.6)"
              strokeWidth={2}
              strokeDasharray="4 6"
            />
          );
        })}
      </svg>
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`network-node ${node.core ? 'core' : ''} ${node.highlight ? 'highlight' : ''}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div className="network-node__icon">{node.icon}</div>
          <div className="network-node__label">{node.label}</div>
          <div className="network-node__ip">{node.ip}</div>
          {node.highlight && <div className="node-glow" />}
        </div>
      ))}
    </div>
  );
}


