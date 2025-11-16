import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(url = 'http://localhost:5000') {
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connection:status', 'connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('connection:status', 'disconnected');
    });

    this.socket.on('transfer-started', (data) => {
      this.emit('transfer-started', data);
    });

    this.socket.on('transfer:update', (data) => {
      this.emit('transfer:update', data);
    });

    this.socket.on('telemetry', (data) => {
      this.emit('telemetry', data);
    });

    this.socket.on('agent:suggest', (data) => {
      this.emit('agent:suggest', data);
    });

    this.socket.on('chunk:update', (data) => {
      this.emit('chunk:update', data);
    });

    this.socket.on('transport:change', (data) => {
      this.emit('transport:change', data);
    });

    return this.socket;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => callback(data));
  }

  send(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new WebSocketService();
