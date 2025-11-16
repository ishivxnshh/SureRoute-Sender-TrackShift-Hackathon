# 🌐 SureRoute Relay Server Guide

## What is the Relay Server?

The **Relay Server** is a **store-and-forward** intermediate server that acts as a fallback when **direct WiFi or P2P connections fail**. It's running on `http://localhost:5001`.

## How It Works

```
Sender Device → Relay Server (stores chunks) → Receiver Device (retrieves chunks)
```

### Process Flow:

1. **Sender** uploads file chunks to relay server
2. **Relay** stores chunks in `relay-storage/` directory  
3. **Receiver** downloads chunks from relay when ready
4. Chunks are reassembled into complete file

## When to Use Relay Server?

✅ **USE RELAY SERVER WHEN:**
- Devices are on **different networks** (not same WiFi)
- Direct P2P connection fails (NAT/firewall issues)
- You want **asynchronous** transfer (receiver offline, downloads later)
- Network is unstable (chunks stored safely on relay)

❌ **DON'T USE RELAY IF:**
- Both devices on **same WiFi** → Use direct WiFi transfer (faster!)
- Both devices support **WebRTC P2P** → Use P2P (no server needed)
- You need maximum speed → Relay adds latency

## Current Status

### ✅ Relay Server IS Working!

Your relay server at `localhost:5001` is active and provides:

**Endpoints:**
- `POST /relay/store/:transferId/:chunkIndex` - Store a chunk
- `POST /relay/retrieve/:transferId` - Retrieve and assemble file
- `GET /relay/status/:transferId` - Check transfer status
- `GET /relay/health` - Server health check

**Storage:**
- Location: `relay-server/relay-storage/`
- Chunks stored by `transferId`
- Auto-cleanup after successful retrieval

## How to Use in Workflow

### Step 1: Create Workflow with Relay Transport

```
1. Add "Device" node → Set as "Sender"
2. Add "File Source" node → Connect to Device
3. Add "Relay Transport" node → Set URL: http://localhost:5001
4. Connect to another "Device" node → Set as "Receiver"
```

### Step 2: Configure Relay Transport Node

In the **Relay Transport** node properties:
- **Relay URL**: `http://localhost:5001`
- **Timeout**: `60000` (60 seconds)
- **Auto-retry**: `true`

### Step 3: Execute Transfer

1. Click **Execute** button
2. Select file in **File Source** dialog
3. File chunks uploaded to relay
4. Receiver automatically downloads from relay
5. File saved to: `backend/storage/files/`

## Real-World Example

### Scenario: Transfer file between home and office

**Without Relay** (Won't Work):
```
Home PC (192.168.1.10) ❌ Office PC (192.168.50.20)
```
*Different networks, direct connection impossible*

**With Relay** (Works!):
```
Home PC → Relay Server (Cloud/VPS) → Office PC
```

### Setup:
1. Deploy relay server on public VPS/cloud
2. Change relay URL to: `http://your-server.com:5001`
3. Both home and office connect to relay
4. Transfer works seamlessly!

## Advantages of Relay Server

### 1. **Reliability**
- Chunks stored safely even if sender disconnects
- Receiver can download when available
- No need for both devices online simultaneously

### 2. **NAT Traversal**
- Works across firewalls and NATs
- No port forwarding needed
- No complex network configuration

### 3. **Fallback Safety**
- AI agents detect connection failures
- Automatically switch to relay transport
- Ensures transfer completion

## Performance Comparison

| Transport | Speed | Latency | Works Across Networks | Requires Server |
|-----------|-------|---------|----------------------|-----------------|
| WiFi Direct | ⚡⚡⚡ Fastest | 1-5ms | ❌ Same network only | ❌ No |
| P2P WebRTC | ⚡⚡ Fast | 10-30ms | ✅ Yes (with STUN) | ⚠️ STUN server |
| **Relay** | ⚡ Moderate | 50-100ms | ✅ Always works | ✅ Yes |
| Bluetooth | 🐌 Slow | 100ms+ | ❌ Short range | ❌ No |

## Monitoring Relay Activity

### Check if relay is working:

**Test endpoint:**
```bash
curl http://localhost:5001/relay/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "activeTransfers": 0,
  "totalChunksStored": 0
}
```

### Watch logs:
```
📦 Relay storing chunk 0 for transfer abc-123
📦 Relay storing chunk 1 for transfer abc-123
📥 Relay retrieving transfer abc-123
✅ File assembled: example.pdf (2.5 MB)
```

## Real File Transfer Setup

### Complete Workflow Example:

**Nodes to Add:**
```
1. Device (Sender) 
   └─ deviceType: "sender"
   └─ ipAddress: "localhost"
   
2. File Source
   └─ filePath: (user selects via dialog)
   
3. Relay Transport
   └─ relayUrl: "http://localhost:5001"
   
4. Device (Receiver)
   └─ deviceType: "receiver"  
   └─ ipAddress: "localhost"
```

**Connections:**
```
Device(Sender) → File Source → Relay Transport → Device(Receiver)
```

**Execution Flow:**
1. Click Execute
2. File picker opens (from File Source node)
3. Select file (e.g., `document.pdf`)
4. Transfer starts:
   - File split into 64KB chunks
   - Each chunk uploaded to relay
   - Progress shown: `Chunk 1/50 (2%)`
5. Receiver downloads from relay
6. File saved: `backend/storage/files/document.pdf`

## Troubleshooting

### Problem: "Relay server not responding"

**Solution:**
```bash
cd relay-server
npm start
```
Check: `http://localhost:5001/relay/health`

### Problem: "Transfer stuck at 50%"

**Check relay storage:**
```bash
ls relay-server/relay-storage/
```

**Restart relay:**
```bash
# Kill process
pkill -f "relay"

# Restart
cd relay-server && npm start
```

### Problem: "File not received"

**Check receiver is listening:**
- Open **Receiver Panel**
- Click **Start Listening**
- Verify status: "Listening for transfers"

## Advanced: Multi-Transport Failover

The AI agents automatically switch between transports:

**Priority Order:**
1. **WiFi Direct** (fastest, same network)
2. **P2P WebRTC** (fast, works across networks)
3. **Relay Server** (reliable fallback)
4. **Bluetooth** (last resort, slow)

**Auto-failover triggers:**
- Packet loss > 5%
- Latency > 200ms
- Connection timeout
- Network error

## Summary

### ✅ Relay Server Status: **ACTIVE & WORKING**

- **Port**: 5001
- **Storage**: `relay-server/relay-storage/`
- **Role**: Fallback transport for failed direct connections
- **Use Case**: Cross-network transfers, asynchronous delivery

### Quick Start:

1. **Receiver**: Click "Open Receiver" → "Start Listening"
2. **Sender**: Build workflow → Add relay transport → Execute
3. **Transfer**: Select file → Chunks via relay → File delivered!

**The relay server is your safety net for reliable file transfers! 🚀**
