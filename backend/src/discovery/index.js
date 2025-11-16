import dgram from 'dgram';
import os from 'os';

const DEFAULT_PORT = 6000;

function getLocalHostname() {
  return os.hostname();
}

export function createDiscovery({ discoveryPort = DEFAULT_PORT, servicePort = 5000, name = 'sureroute-backend', interval = 2000, peerTTL = 15000 } = {}) {
  const peers = new Map();
  const socket = dgram.createSocket('udp4');
  let broadcastTimer = null;

  function sendDiscover() {
    const payload = JSON.stringify({ type: 'DISCOVER_REQUEST', name, service_port: servicePort, hostname: getLocalHostname() });
    try {
      socket.send(Buffer.from(payload), 0, payload.length, discoveryPort, '255.255.255.255');
    } catch (err) {
      // ignore
    }
  }

  function start() {
    socket.on('error', (err) => {
      console.error('Discovery socket error:', err.message);
    });

    socket.on('message', (msg, rinfo) => {
      let data = null;
      try {
        data = JSON.parse(msg.toString('utf8'));
      } catch (err) {
        // ignore invalid JSON
        return;
      }

      if (!data || !data.type) return;

      if (data.type === 'DISCOVER_REQUEST') {
        // Another node is requesting discovery — reply with LISTENER_HERE
        const resp = JSON.stringify({ type: 'LISTENER_HERE', name, hostname: getLocalHostname(), service_port: servicePort });
        socket.send(Buffer.from(resp), 0, resp.length, rinfo.port, rinfo.address);
      } else if (data.type === 'LISTENER_HERE') {
        const key = `${rinfo.address}:${data.service_port || rinfo.port}`;
        peers.set(key, {
          id: key,
          ip: rinfo.address,
          port: data.service_port || rinfo.port,
          name: data.name || 'unknown',
          hostname: data.hostname || rinfo.address,
          lastSeen: Date.now(),
        });
      }
    });

    socket.bind(discoveryPort, () => {
      try { socket.setBroadcast(true); } catch (e) {}
      broadcastTimer = setInterval(sendDiscover, interval);
      // send one immediately
      sendDiscover();
    });

    // Peer cleanup
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of peers.entries()) {
        if (now - v.lastSeen > peerTTL) peers.delete(k);
      }
    }, peerTTL);
  }

  function stop() {
    if (broadcastTimer) clearInterval(broadcastTimer);
    try { socket.close(); } catch (e) {}
    peers.clear();
  }

  function getPeers() {
    return Array.from(peers.values()).sort((a,b) => b.lastSeen - a.lastSeen);
  }

  return { start, stop, getPeers };
}
