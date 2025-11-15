import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(`${BACKEND_URL}/ws`, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function onSocket(event: string, cb: (data: any) => void) {
  const s = getSocket();
  s.on(event, cb);
  return () => s.off(event, cb);
}


