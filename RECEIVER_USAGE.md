# Receiver Usage Guide

## How File Transfer Works

The file transfer system now uses **Socket.IO** for real-time communication between sender and receiver.

### Architecture Flow

```
Sender (Workflow) → Backend Server → Socket.IO → Receiver Panel
```

### Current Implementation

#### 1. **Device Node IP/Port Fields**
- The IP address and port fields in device nodes are **displayed** in the UI
- For **WiFi transfer**: Currently uses Socket.IO broadcast (all connected clients receive)
- For **Relay transfer**: Files are stored on relay server and receiver can fetch them

#### 2. **Transfer Methods**

**Method A: WiFi Transfer (Socket.IO)**
- File is uploaded to backend
- Backend emits `file-chunk` events via Socket.IO
- **All connected receivers** get the chunks (broadcast mode)
- Receiver assembles chunks and saves file
- ✅ Works: File transfer completes
- ⚠️ Limitation: Not targeted to specific receiver IP (broadcast to all)

**Method B: Relay Transfer**
- File is uploaded to backend
- Backend sends chunks to relay server at `http://localhost:5001`
- Relay stores chunks in `relay-storage/` directory
- Backend emits `file-received` event when complete
- Receiver can fetch chunks from relay server
- ✅ Works: Chunks stored on relay
- ⚠️ Limitation: Receiver needs to poll/fetch from relay

### How to Use Receiver Panel

1. **Open Receiver Panel** (button in top toolbar)
2. **Click "Start Listening"**
   - Connects to backend via Socket.IO
   - Status changes to "Listening for transfers"
3. **Execute Workflow** from main canvas
   - Select a file in file-source node
   - Connect nodes: Device → File Source → Transport → Device
   - Click Execute
4. **Monitor Receiver Panel**
   - Real-time progress shown as chunks arrive
   - File appears in "Received Files" list when complete

### Socket.IO Events

**Emitted by Backend:**
- `file-chunk`: Individual chunk with base64 data
- `file-received`: Transfer complete notification
- `transfer-progress`: Progress percentage updates
- `transfer-completed`: Final completion event
- `transfer-started`: Transfer initiated

**Listened by Receiver:**
- All of the above events
- Updates UI in real-time
- Adds files to `receivedFiles` state

### Current Limitations

1. **WiFi Transfer**: Uses Socket.IO broadcast, not targeted to specific IP
   - All connected receivers get all files
   - Device node IP/port not used for actual networking

2. **No Direct IP Communication**: 
   - Backend doesn't make HTTP requests to receiver IP:port
   - Everything goes through Socket.IO websocket connection

3. **Relay Fetch Not Implemented**:
   - Relay stores chunks but receiver doesn't fetch them
   - Receiver only listens to Socket.IO events

### Future Enhancements

**Option A: HTTP-Based Transfer**
```javascript
// Backend sends to specific receiver
await fetch(`http://${receiverIP}:${port}/api/receive-chunk`, {
  method: 'POST',
  body: JSON.stringify({ chunk, chunkIndex })
});
```

**Option B: Socket.IO Rooms**
```javascript
// Receiver joins room by IP
socket.join(`receiver_${deviceIP}`);

// Backend emits to specific room
io.to(`receiver_${deviceIP}`).emit('file-chunk', data);
```

**Option C: Relay Polling**
```javascript
// Receiver periodically fetches from relay
const response = await fetch(`http://localhost:5001/relay/chunks/${transferId}`);
```

## Testing the Current Implementation

### Test WiFi Transfer:

1. Start all servers:
   ```bash
   npm run dev        # Frontend (port 3000)
   npm run backend    # Backend (port 5000)
   npm run relay      # Relay (port 5001)
   ```

2. Open browser to `http://localhost:3000`

3. Open Receiver Panel and click "Start Listening"
   - Check browser console: "✅ Receiver connected to backend"

4. Create workflow:
   - Device node (sender)
   - File source node → upload a file
   - WiFi transfer node → transport: wifi
   - Device node (receiver)

5. Click Execute

6. **Expected Result**:
   - Backend console: "📤 Starting file transfer..."
   - Backend console: "📶 WiFi transfer to local..."
   - Backend console: "✅ Transfer completed via WiFi"
   - Receiver panel: File appears in "Received Files"

### Test Relay Transfer:

Same as above, but:
- In WiFi transfer node → select transport: "relay"
- Backend uploads chunks to relay server
- Relay console: "📦 Relay storing chunk X..."
- Receiver gets `file-received` event when complete

## Troubleshooting

**Receiver shows 0 files:**
- ✅ Check Socket.IO connection (browser console)
- ✅ Verify backend is emitting events (backend console)
- ✅ Check receivedFiles state updates (React DevTools)
- ✅ Ensure "Start Listening" was clicked before execute

**Transfer completes but no file in receiver:**
- Check backend console for `file-received` event
- Check receiver component is listening to correct events
- Verify Socket.IO connection not dropped

**Relay chunks not received:**
- Check relay server is running on port 5001
- Check backend can reach relay (network logs)
- Verify chunks stored in `relay-storage/` directory

## Backend Logs to Watch

```
📤 Starting file transfer: test.pdf
   Receiver: localhost
   Transport: relay
   Relay URL: http://localhost:5001
   Size: 2.45 MB

📡 Uploading to relay server: http://localhost:5001
   Chunk 1/40 uploaded to relay
   Chunk 2/40 uploaded to relay
   ...
   
✅ Transfer completed via relay: test.pdf
   Saved to: backend/storage/files/test.pdf
```

## Summary

**What Works:**
- ✅ File upload from frontend to backend
- ✅ Chunking and progress tracking
- ✅ Socket.IO communication
- ✅ Real-time receiver updates
- ✅ Relay server chunk storage

**What Doesn't Work (Yet):**
- ❌ Direct HTTP to receiver IP:port
- ❌ Targeted delivery to specific receiver
- ❌ Relay fetch by receiver
- ❌ Actual network-based device-to-device transfer

**Current Status:**
The system works as a **local simulation** where all devices connect to a central backend via Socket.IO. It demonstrates the workflow, UI, and file processing but doesn't implement actual device-to-device networking yet.
