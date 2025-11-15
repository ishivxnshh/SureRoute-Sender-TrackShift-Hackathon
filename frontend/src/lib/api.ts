const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function getStatus(transferId: string) {
  const res = await fetch(`${BACKEND_URL}/transfer/${transferId}/status`);
  return res.json();
}

export async function setSimulator(params: { latency_ms?: number; jitter_ms?: number; packet_loss?: number; down?: boolean }) {
  const SIM_URL = (import.meta as any).env.VITE_SIMULATOR_URL || 'http://localhost:4500';
  await fetch(`${SIM_URL}/conditions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
}

export async function postManifest(manifest: any) {
  const res = await fetch(`${BACKEND_URL}/transfer/manifest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(manifest)
  });
  return res.json();
}


