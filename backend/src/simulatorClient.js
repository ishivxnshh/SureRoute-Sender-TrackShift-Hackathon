import fetch from 'node-fetch';

const DEFAULT_URL = process.env.SIMULATOR_URL || 'http://localhost:4500';

let lastFetch = 0;
let cached = {
  latency_ms: 0,
  jitter_ms: 0,
  packet_loss: 0,
  down: false
};

export async function getConditions() {
  const now = Date.now();
  if (now - lastFetch < 500) {
    return cached;
  }
  try {
    const res = await fetch(`${DEFAULT_URL}/conditions`);
    if (!res.ok) throw new Error('simulator fetch failed');
    const json = await res.json();
    cached = {
      latency_ms: Number(json.latency_ms || 0),
      jitter_ms: Number(json.jitter_ms || 0),
      packet_loss: Number(json.packet_loss || 0),
      down: Boolean(json.down)
    };
    lastFetch = now;
  } catch (e) {
    // keep last cached
  }
  return cached;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


