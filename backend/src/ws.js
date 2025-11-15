let ioRef = null;

export function initWs(io) {
  ioRef = io.of('/ws');
  ioRef.on('connection', (socket) => {
    socket.join('all');
    socket.emit('connected', { ok: true });
  });
}

export function emitTelemetry(payload) {
  if (!ioRef) return;
  ioRef.to('all').emit('telemetry', payload);
}

export function emitTransferUpdate(payload) {
  if (!ioRef) return;
  ioRef.to('all').emit('transfer:update', payload);
}

export function emitAgentSuggest(payload) {
  if (!ioRef) return;
  ioRef.to('all').emit('agent:suggest', payload);
}


