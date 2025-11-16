import SimplePeer from 'simple-peer';
import { EventEmitter } from 'events';

/**
 * WebRTC Manager for peer-to-peer connections
 * Handles SimplePeer instances and data channels
 */
class WebRTCManager extends EventEmitter {
  constructor() {
    super();
    this.peers = new Map(); // peerId -> SimplePeer instance
    this.dataChannels = new Map(); // peerId -> data channel info
    this.localPeerId = null;
    this.isInitialized = false;
  }

  /**
   * Initialize WebRTC manager with local peer ID
   */
  initialize(localPeerId) {
    this.localPeerId = localPeerId;
    this.isInitialized = true;
    console.log('🔗 WebRTC Manager initialized:', localPeerId);
  }

  /**
   * Create a new peer connection (initiator)
   */
  createConnection(remotePeerId, initiator = true) {
    if (this.peers.has(remotePeerId)) {
      console.log('⚠️  Connection already exists to peer:', remotePeerId);
      return this.peers.get(remotePeerId);
    }

    console.log(`🤝 Creating ${initiator ? 'initiator' : 'receiver'} connection to:`, remotePeerId);

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      },
    });

    // Handle signaling data (to be sent via signaling server)
    peer.on('signal', (data) => {
      console.log('📡 Generated signal for', remotePeerId);
      this.emit('signal', {
        to: remotePeerId,
        signal: data,
      });
    });

    // Handle connection establishment
    peer.on('connect', () => {
      console.log('✅ WebRTC connection established with', remotePeerId);
      this.dataChannels.set(remotePeerId, {
        connected: true,
        bandwidth: 0,
        lastActivity: Date.now(),
      });
      this.emit('connected', remotePeerId);
    });

    // Handle incoming data
    peer.on('data', (data) => {
      console.log('📥 Received data from', remotePeerId, data.length, 'bytes');
      
      // Update channel info
      const channel = this.dataChannels.get(remotePeerId);
      if (channel) {
        channel.lastActivity = Date.now();
      }
      
      this.emit('data', {
        from: remotePeerId,
        data,
      });
    });

    // Handle errors
    peer.on('error', (err) => {
      console.error('❌ WebRTC error with', remotePeerId, ':', err.message);
      this.emit('error', {
        peerId: remotePeerId,
        error: err,
      });
    });

    // Handle close
    peer.on('close', () => {
      console.log('🔌 Connection closed with', remotePeerId);
      this.peers.delete(remotePeerId);
      this.dataChannels.delete(remotePeerId);
      this.emit('disconnected', remotePeerId);
    });

    this.peers.set(remotePeerId, peer);
    return peer;
  }

  /**
   * Handle incoming signal from remote peer
   */
  handleSignal(remotePeerId, signal) {
    let peer = this.peers.get(remotePeerId);

    // If we don't have a peer connection, create one as receiver
    if (!peer) {
      peer = this.createConnection(remotePeerId, false);
    }

    try {
      peer.signal(signal);
      console.log('✅ Processed signal from', remotePeerId);
    } catch (err) {
      console.error('❌ Failed to process signal:', err.message);
    }
  }

  /**
   * Send data to a peer
   */
  async sendData(remotePeerId, data) {
    const peer = this.peers.get(remotePeerId);
    
    if (!peer) {
      throw new Error(`No connection to peer: ${remotePeerId}`);
    }

    if (!peer.connected) {
      throw new Error(`Peer not connected: ${remotePeerId}`);
    }

    return new Promise((resolve, reject) => {
      try {
        // Convert to Buffer if needed
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        
        peer.send(buffer);
        
        // Update channel stats
        const channel = this.dataChannels.get(remotePeerId);
        if (channel) {
          channel.lastActivity = Date.now();
        }
        
        resolve({ success: true, bytes: buffer.length });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send file chunk to peer
   */
  async sendChunk(remotePeerId, chunkData, metadata) {
    const peer = this.peers.get(remotePeerId);
    
    if (!peer || !peer.connected) {
      throw new Error(`Cannot send chunk - peer not connected: ${remotePeerId}`);
    }

    // Send metadata first
    const metadataStr = JSON.stringify({
      type: 'chunk-metadata',
      ...metadata,
    });
    
    await this.sendData(remotePeerId, metadataStr);
    
    // Wait a bit for the peer to prepare
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Send chunk data
    await this.sendData(remotePeerId, chunkData);
    
    console.log(`📤 Sent chunk ${metadata.chunkIndex} to ${remotePeerId}`);
    
    return { success: true };
  }

  /**
   * Close connection to peer
   */
  closeConnection(remotePeerId) {
    const peer = this.peers.get(remotePeerId);
    
    if (peer) {
      peer.destroy();
      this.peers.delete(remotePeerId);
      this.dataChannels.delete(remotePeerId);
      console.log('🔌 Closed connection to', remotePeerId);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(remotePeerId) {
    const peer = this.peers.get(remotePeerId);
    const channel = this.dataChannels.get(remotePeerId);
    
    return {
      exists: !!peer,
      connected: peer?.connected || false,
      lastActivity: channel?.lastActivity || null,
    };
  }

  /**
   * Get all active connections
   */
  getActiveConnections() {
    const connections = [];
    
    for (const [peerId, peer] of this.peers.entries()) {
      const channel = this.dataChannels.get(peerId);
      connections.push({
        peerId,
        connected: peer.connected,
        lastActivity: channel?.lastActivity,
      });
    }
    
    return connections;
  }

  /**
   * Cleanup all connections
   */
  cleanup() {
    console.log('🧹 Cleaning up WebRTC connections...');
    
    for (const [peerId, peer] of this.peers.entries()) {
      peer.destroy();
    }
    
    this.peers.clear();
    this.dataChannels.clear();
    
    console.log('✅ WebRTC cleanup complete');
  }
}

// Export singleton instance
export const webrtcManager = new WebRTCManager();
