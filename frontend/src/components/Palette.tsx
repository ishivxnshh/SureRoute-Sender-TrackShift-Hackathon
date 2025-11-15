import React from 'react';
function PaletteItem({ type, label }: { type: string; label: string }) {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div className="palette-item" draggable onDragStart={onDragStart}>
      <span>{label}</span>
    </div>
  );
}

export default function Palette() {
  return (
    <div className="palette-list">
      <PaletteItem type="sender" label="Sender" />
      <PaletteItem type="receiver" label="Receiver" />
      <PaletteItem type="file" label="File" />
    </div>
  );
}


