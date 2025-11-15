import { io } from 'socket.io-client';
import axios from 'axios';

const BACKEND_WS = process.env.BACKEND_WS || 'http://localhost:4000';
const BACKEND_HTTP = process.env.BACKEND_HTTP || 'http://localhost:4000';

const socket = io(`${BACKEND_WS}/ws`, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('Agent M connected to backend ws');
});

socket.on('telemetry', async (msg) => {
  try {
    if (!msg || !msg.transfer_id) return;
    const { packet_loss } = msg;
    if (typeof packet_loss === 'number' && packet_loss > 0.05) {
      await axios.post(`${BACKEND_HTTP}/agent/suggest`, {
        agent: 'Monitor',
        transfer_id: msg.transfer_id,
        suggestion: {
          action: 'reduce_chunk_size',
          value: 524288,
          reason: 'packet_loss>5%'
        }
      }, { timeout: 2000 });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Agent M error:', e.message);
  }
});

socket.on('disconnect', () => {
  // eslint-disable-next-line no-console
  console.log('Agent M disconnected.');
});


