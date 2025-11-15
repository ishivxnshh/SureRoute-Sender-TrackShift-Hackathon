import React from 'react';

const items = [
  { label: 'Select', icon: '🖱️' },
  { label: 'Zoom', icon: '🔍' },
  { label: 'Inspect', icon: '🧭' },
  { label: 'Link', icon: '🪢' },
  { label: 'Files', icon: '🗂️' },
  { label: 'Notes', icon: '📝' },
  { label: 'Cloud', icon: '☁️' }
];

export default function SideToolbar() {
  return (
    <aside className="side-toolbar">
      {items.map((item) => (
        <button key={item.label} className="side-toolbar__btn" title={item.label}>
          <span>{item.icon}</span>
        </button>
      ))}
    </aside>
  );
}


