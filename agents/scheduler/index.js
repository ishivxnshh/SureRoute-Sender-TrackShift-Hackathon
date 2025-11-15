import { io } from 'socket.io-client';
import axios from 'axios';

const BACKEND_WS = process.env.BACKEND_WS || 'http://localhost:4000';
const BACKEND_HTTP = process.env.BACKEND_HTTP || 'http://localhost:4000';

const socket = io(`${BACKEND_WS}/ws`, {
  transports: ['websocket', 'polling']
});

const stalls = new Map(); // transferId -> last progress timestamp

socket.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('Agent S connected to backend ws');
});

socket.on('transfer:update', async (msg) => {
  try {
    if (!msg || !msg.transfer_id) return;
    const t = msg.transfer_id;
    const prev = stalls.get(t) || { progress: 0, ts: Date.now() };
    const now = Date.now();
    if (msg.progress > prev.progress) {
      stalls.set(t, { progress: msg.progress, ts: now });
    } else {
      // unchanged progress
      if (now - prev.ts > 5000) {
        // stalled > 5s, suggest using relay
        await axios.post(`${BACKEND_HTTP}/agent/suggest`, {
          agent: 'Scheduler',
          transfer_id: t,
          suggestion: {
            action: 'use_relay',
            reason: 'transfer stalled > 5s'
          }
        }, { timeout: 2000 });
        stalls.set(t, { progress: msg.progress, ts: now }); // reset timer
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Agent S error:', e.message);
  }
});

socket.on('disconnect', () => {
  // eslint-disable-next-line no-console
  console.log('Agent S disconnected.');
});


