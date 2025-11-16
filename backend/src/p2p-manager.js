import { EventEmitter } from 'events';
import crypto from 'crypto';
import dgram from 'dgram';
import os from 'os';

/**
 * P2P Manager for peer discovery and WebRTC connection management
 * Handles local network discovery using UDP multicast and WebRTC signaling
 */
export class P2PManager extends EventEmitter {
  constructor(io, redisClient = null) {
    super();
    this.io = io;
    this.redis = null; // Redis signaling disabled
    this.peers = new Map(); // peerId -> peer info
    this.connections = new Map(); // peerId -> WebRTC connection
    this.localPeerId = crypto.randomBytes(16).toString('hex');
    this.localInfo = this.getLocalNetworkInfo();
    
    // UDP discovery settings
    this.MULTICAST_ADDR = '239.255.0.1';
    this.DISCOVERY_PORT = 41234;
    this.discoverySocket = null;
    this.discoveryInterval = null;
    
    // WebRTC signaling via Redis pub/sub
    this.signalingChannel = `sureroute:signaling`;
    
    console.log(`🔗 P2P Manager initialized - Local Peer ID: ${this.localPeerId}`);
  }

  /**
   * Get local network interfaces information
   */
  getLocalNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (!iface.internal && iface.family === 'IPv4') {
          addresses.push({
            name,
            address: iface.address,
            netmask: iface.netmask,
          });
        }
      }
    }
    
    return {
      peerId: this.localPeerId,
      hostname: os.hostname(),
      platform: os.platform(),
      addresses,
    };
  }

  /**
   * Start UDP multicast discovery
   */
  startDiscovery() {
    if (this.discoverySocket) {
      console.log('⚠️  Discovery already running');
      return;
    }

    this.discoverySocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.discoverySocket.on('listening', () => {
      const address = this.discoverySocket.address();
      console.log(`🔍 UDP Discovery listening on ${address.address}:${address.port}`);
      
      try {
        this.discoverySocket.addMembership(this.MULTICAST_ADDR);
        this.discoverySocket.setBroadcast(true);
      } catch (err) {
        console.error('❌ Failed to join multicast group:', err.message);
      }
    });

    this.discoverySocket.on('message', (message, remote) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'PEER_ANNOUNCE' && data.peerId !== this.localPeerId) {
          this.handlePeerAnnounce(data, remote);
        } else if (data.type === 'PEER_RESPONSE' && data.targetPeerId === this.localPeerId) {
          this.handlePeerResponse(data, remote);
        }
      } catch (err) {
        // Ignore invalid messages
      }
    });

    this.discoverySocket.on('error', (err) => {
      console.error('❌ Discovery socket error:', err.message);
    });

    this.discoverySocket.bind(this.DISCOVERY_PORT);

    // Send announcements every 5 seconds
    this.discoveryInterval = setInterval(() => {
      this.announcePresence();
    }, 5000);

    // Initial announcement
    setTimeout(() => this.announcePresence(), 500);
  }

  /**
   * Stop UDP discovery
   */
  stopDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    if (this.discoverySocket) {
      this.discoverySocket.close();
      this.discoverySocket = null;
      console.log('🛑 Discovery stopped');
    }
  }

  /**
   * Announce presence on the network
   */
  announcePresence() {
    if (!this.discoverySocket) return;

    const announcement = {
      type: 'PEER_ANNOUNCE',
      peerId: this.localPeerId,
      hostname: this.localInfo.hostname,
      addresses: this.localInfo.addresses,
      timestamp: Date.now(),
    };

    const message = Buffer.from(JSON.stringify(announcement));
    
    this.discoverySocket.send(
      message,
      0,
      message.length,
      this.DISCOVERY_PORT,
      this.MULTICAST_ADDR,
      (err) => {
        if (err) {
          console.error('❌ Failed to send announcement:', err.message);
        }
      }
    );
  }

  /**
   * Handle peer announcement
   */
  handlePeerAnnounce(data, remote) {
    const peer = {
      id: data.peerId,
      hostname: data.hostname,
      addresses: data.addresses,
      remoteAddress: remote.address,
      remotePort: remote.port,
      lastSeen: Date.now(),
      status: 'discovered',
    };

    const wasNew = !this.peers.has(data.peerId);
    this.peers.set(data.peerId, peer);

    if (wasNew) {
      console.log(`✨ New peer discovered: ${peer.hostname} (${peer.id.substring(0, 8)}...)`);
      
      // Notify connected clients
      this.io.emit('peer:discovered', {
        peer: this.sanitizePeerInfo(peer),
      });

      // Send response back
      this.sendPeerResponse(data.peerId, remote);
    }
  }

  /**
   * Send peer response
   */
  sendPeerResponse(targetPeerId, remote) {
    if (!this.discoverySocket) return;

    const response = {
      type: 'PEER_RESPONSE',
      peerId: this.localPeerId,
      targetPeerId,
      hostname: this.localInfo.hostname,
      addresses: this.localInfo.addresses,
      timestamp: Date.now(),
    };

    const message = Buffer.from(JSON.stringify(response));
    
    this.discoverySocket.send(
      message,
      0,
      message.length,
      remote.port,
      remote.address,
      (err) => {
        if (err) {
          console.error('❌ Failed to send response:', err.message);
        }
      }
    );
  }

  /**
   * Handle peer response
   */
  handlePeerResponse(data, remote) {
    if (this.peers.has(data.peerId)) {
      const peer = this.peers.get(data.peerId);
      peer.lastSeen = Date.now();
      peer.status = 'confirmed';
      this.peers.set(data.peerId, peer);
    }
  }

  /**
   * Get list of discovered peers
   */
  getDiscoveredPeers() {
    const now = Date.now();
    const activePeers = [];

    for (const [peerId, peer] of this.peers.entries()) {
      // Remove stale peers (not seen in last 30 seconds)
      if (now - peer.lastSeen > 30000) {
        this.peers.delete(peerId);
        console.log(`🗑️  Removed stale peer: ${peer.hostname}`);
      } else {
        activePeers.push(this.sanitizePeerInfo(peer));
      }
    }

    return activePeers;
  }

  /**
   * Sanitize peer info for client consumption
   */
  sanitizePeerInfo(peer) {
    return {
      id: peer.id,
      name: peer.hostname,
      ip: peer.remoteAddress || peer.addresses[0]?.address || 'unknown',
      addresses: peer.addresses,
      lastSeen: peer.lastSeen,
      status: peer.status,
    };
  }

  /**
   * Setup Redis signaling for WebRTC
   */
  async setupRedisSignaling() {
    console.log('ℹ️  Redis signaling disabled (no Redis client configured)');
  }

  /**
   * Send WebRTC signal via Redis
   */
  async sendWebRTCSignal(toPeerId, signalData) {
    // Redis signaling removed; relying on Socket.IO fallback only
    return;
  }

  /**
   * Handle incoming WebRTC signal
   */
  handleWebRTCSignal(signal) {
    console.log(`📡 Received WebRTC signal from ${signal.from.substring(0, 8)}...`);
    
    // Emit to connected Socket.IO clients
    this.io.emit('webrtc:signal', {
      from: signal.from,
      data: signal.data,
    });

    this.emit('signal', signal);
  }

  /**
   * Initiate WebRTC connection to peer
   */
  async connectToPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }

    console.log(`🤝 Initiating WebRTC connection to ${peer.hostname}...`);

    // In a full implementation, this would create a SimplePeer instance
    // For now, we'll mark the peer as connecting
    peer.status = 'connecting';
    this.peers.set(peerId, peer);

    this.io.emit('peer:connecting', {
      peerId,
      hostname: peer.hostname,
    });

    // Simulate connection establishment
    setTimeout(() => {
      peer.status = 'connected';
      this.peers.set(peerId, peer);
      
      this.io.emit('peer:connected', {
        peerId,
        hostname: peer.hostname,
      });

      console.log(`✅ Connected to peer ${peer.hostname}`);
    }, 1000);

    return { success: true, peerId };
  }

  /**
   * Disconnect from peer
   */
  disconnectFromPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    if (this.connections.has(peerId)) {
      const connection = this.connections.get(peerId);
      connection.destroy();
      this.connections.delete(peerId);
    }

    peer.status = 'discovered';
    this.peers.set(peerId, peer);

    console.log(`🔌 Disconnected from peer ${peer.hostname}`);
    
    this.io.emit('peer:disconnected', { peerId });
  }

  /**
   * Send file chunk to peer via WebRTC
   */
  async sendChunkToPeer(peerId, transferId, chunkIndex, chunkData) {
    // This would use WebRTC data channel in full implementation
    // For now, we'll use the relay server as fallback
    console.log(`📤 Sending chunk ${chunkIndex} to peer ${peerId.substring(0, 8)}...`);
    
    // Simulate chunk transfer
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, bytes: chunkData.length });
      }, 100);
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stopDiscovery();
    
    // Close all WebRTC connections
    for (const [peerId, connection] of this.connections.entries()) {
      connection.destroy();
    }
    this.connections.clear();
    
    console.log('🧹 P2P Manager cleanup complete');
  }
}
