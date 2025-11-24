# SureRoute - Resilient File Transfer System

![SureRoute](https://img.shields.io/badge/SureRoute-v1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**SureRoute** is an advanced file transfer system featuring AI-powered optimization, multi-transport failover (WiFi/Bluetooth/Relay), and a sophisticated drag-and-drop canvas UI for managing resilient transfers.

## 🌟 Key Features

### 🎨 Advanced UI/UX
- **3-Panel Drag-and-Drop Canvas** - Intuitive layout with component library, transfer canvas, and inspector
- **Priority Channels** - High/Normal/Low priority lanes for intelligent transfer scheduling
- **Real-time Visualization** - Chunk maps, telemetry graphs, and live progress indicators
- **Network Simulator** - Built-in tools to test resilience (latency injection, packet loss, connection drops)

### 🤖 AI-Powered Intelligence
- **Monitor Agent** - Analyzes network telemetry and detects anomalies
- **Scheduler Agent** - Optimizes concurrency and manages priority queues
- **Recovery Agent** - Tracks failures and suggests failover strategies
- **Automation Levels** - Manual, Assistive, or Autonomous AI control

### 🔄 Multi-Transport Resilience
- **Automatic Failover** - WiFi → Bluetooth → Relay Server
- **Seamless Switching** - Transfers continue without interruption
- **Configurable Delay Tolerance** - Set custom thresholds for transport switching

### 📦 Robust Transfer Engine
- **Chunked Transfers** - Configurable chunk sizes with SHA-256 verification
- **Resume Capability** - Survive network interruptions and resume seamlessly
- **Concurrent Uploads** - Adaptive parallelism based on network conditions
- **Progress Tracking** - Real-time speed, ETA, and completion metrics

### 🌐 Real Device Support
- **P2P Mode** - Connect actual devices over local network
- **Demo Mode** - Simulate transfers with network conditions
- **Device Discovery** - Automatic peer detection and pairing

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **Windows, macOS, or Linux**
- For real-device demo: Multiple computers on the same network

## 🚀 Quick Start

### 1. Installation

```powershell
# Clone or navigate to the project directory
cd d:\KKY_Brothers\Codes\Advanced_ML_Projects\SureRoute

# Install all dependencies
npm run install-all
```

This will install dependencies for:
- Root workspace
- Frontend (React + Vite)
- Backend (Express + Socket.IO)
- Relay Server

### 2. Start the System

```powershell
# Start all services (frontend, backend, relay)
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Relay Server**: http://localhost:5001

Or start services individually:

```powershell
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Relay Server
npm run dev:relay

# Terminal 3 - Frontend
npm run dev:frontend
```

### 3. Open the Application

Navigate to **http://localhost:3000** in your browser.

## 🔐 Google OAuth 2.0 Authentication

SureRoute supports login with **Google OAuth 2.0**, but once a user is verified by Google we
switch to **our own JWT-based auth**. This keeps Google out of the hot path for every request
while still giving you a simple “Sign in with Google” UX.

### Backend OAuth Architecture

- **Routes**
  - `GET /auth/google`  
    Redirects the browser to the Google OAuth 2.0 consent screen.
  - `GET /auth/google/callback`  
    Google redirects back here with `?code=...`. The backend:
    1. Exchanges the code for `access_token` + `id_token`.
    2. Decodes the `id_token` to get the Google profile (sub, email, name, picture).
    3. Upserts the user into our JSON “database” (`storage/users.json`) with fields:
       - `oauth_provider` (`google`)
       - `oauth_id` (Google `sub`)
       - `name`
       - `email`
       - `profile_image`
       - `created_at` / `updated_at`
    4. Generates a **SureRoute JWT** and redirects to the frontend with  
       `/?authToken=<our-jwt>`.

- **Where user info is stored**
  - Backend keeps users in `storage/users.json` via the `models/user.js` model
    (in a real deployment this would be a proper DB).
  - We **do not** persist Google access/refresh tokens; we only store the identity
    fields we need to recognise the user later.

- **Why we store users in our own DB**
  - Lets SureRoute have a stable internal user ID (`id`) regardless of auth provider.
  - Enables additional auth methods (email/password, future providers) with a unified model.
  - Keeps all app-level permissions, settings and workflows under our control instead
    of round-tripping to Google.

- **Session / JWT**
  - JWTs are created by `backend/src/utils/jwt.js` with:
    - `sub`: internal SureRoute user ID
    - `email`
    - `provider` (`google` or `local`)
  - Protected routes (`/api/workflows`, `/api/auth/me`, `/auth/me`) use
    `authMiddleware` to verify the JWT on every request.

### Required Environment Variables

Create `backend/.env` with:

```bash
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

FRONTEND_BASE_URL=http://localhost:3000

JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=7d
```

> Never commit real secrets to Git. Keep `.env` excluded via `.gitignore`.

### Frontend OAuth Flow

- On the **Home** page login card there is a **“Continue with Google”** button.
  - Clicking it sends the browser to `http://localhost:5000/auth/google`.
- After successful Google login, the backend redirects back to the frontend:
  - `http://localhost:3000/?authToken=<sureRouteJwt>`
- `frontend/src/main.jsx`:
  - Reads `authToken` from the URL query string on first load.
  - Calls `useStore().setAuthFromToken(token)` which:
    1. Sets the `Authorization: Bearer <token>` header for Axios.
    2. Calls `/api/auth/me` to fetch the current user.
    3. Stores the user + token in the global store and loads that user’s workflows.
  - Cleans `authToken` from the URL using `history.replaceState` so it does not stay
    in the address bar or browser history.

### Google Cloud Console Setup

1. Go to **Google Cloud Console** and create (or select) a project.
2. Navigate to **APIs & Services → Credentials**.
3. Click **Create Credentials → OAuth client ID**.
4. Choose **Web application** and set:
   - **Authorized JavaScript origins**
     - `http://localhost:3000`
   - **Authorized redirect URIs**
     - `http://localhost:5000/auth/google/callback`
5. Save and copy the **Client ID** and **Client Secret** into `backend/.env`.

### Testing the OAuth Flow Locally

1. **Start the backend**
   ```bash
   cd backend
   npm install        # ensure dotenv + jsonwebtoken are installed
   npm run dev
   ```
2. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.
4. In the login card on the Home page, click **“Continue with Google”**.
5. Complete the Google sign-in:
   - You should be redirected back to the SureRoute UI.
   - The header chip will show you as logged in with your Google email.
   - Any workflows you create are now associated with your SureRoute user record.


## 🎯 Demo Script (3-Minute Judge Presentation)

### Setup (30 seconds)
1. Open SureRoute in browser
2. Verify connection status (green indicator in top bar)
3. Show the 3-panel layout: Components (left) | Canvas (center) | Inspector (right)

### Part 1: Basic Transfer with Visualization (60 seconds)
1. **Drag "File Selector"** node from left panel to canvas
2. Click node → Configure → Browse and select a file (or use demo file)
3. **Drag the file** onto **High Priority** lane (red lane)
4. Click **Start** in top bar
5. **Watch real-time progress**:
   - Chunk map filling in (green = complete)
   - Progress ring updating
   - Speed and ETA calculations
   - Right panel shows telemetry graphs

### Part 2: Network Resilience Demo (90 seconds)
1. **Start a large transfer** (drag file to Normal priority lane)
2. **Open Simulator** (bottom-right panel)
3. **Inject network issues**:
   - Set latency to 500ms → Watch AI suggest "Reduce chunk size"
   - Set packet loss to 15% → AI suggests "Decrease concurrency"
   - Click "Drop Connection" button
4. **Show resilience**:
   - Connection indicator turns red
   - Transfer pauses but **state is saved**
   - Connection auto-recovers (green)
   - Transfer **resumes from last chunk**
   - Final checksum verification ✓

### Part 3: Multi-Priority & AI Intelligence (40 seconds)
1. **Start low-priority transfer** (5GB file in Bulk lane)
2. **Drop small high-priority file** onto Rush lane
3. **Show preemption**:
   - AI Scheduler suggests "Pause low priority"
   - High-priority transfer gets more resources
   - Completes first despite being added later
4. **AI Suggestion Demo**:
   - Monitor Agent detects high packet loss
   - Suggests "Use Relay Server"
   - Click **Accept** → Transfer routes through relay
   - Show in activity log: "Switched to relay transport"

### Bonus Features to Highlight
- **"Ask AI" button** - Click anywhere and get contextual help
- **Chunk-level control** - Click individual chunks to resend
- **Forensic report** - Export transfer statistics
- **Automation levels** - Switch between Manual/Assistive/Autonomous

## 🖥️ Real Multi-Device Demo

### Setup for Real Transfer

1. **On Sender Device (Computer A)**:
```powershell
cd d:\KKY_Brothers\Codes\Advanced_ML_Projects\SureRoute
npm run dev
```

2. **On Receiver Device (Computer B)**:
```powershell
# Set backend URL to sender's IP
# Edit frontend/.env
VITE_API_URL=http://192.168.1.100:5000

npm run dev
```

3. **Configure Network**:
   - Ensure both devices on same WiFi/network
   - Note sender's IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update frontend API URL with sender's IP

4. **Start Transfer**:
   - On Computer A: Set up sender node with file
   - On Computer B: View transfer progress in real-time
   - Both see synchronized updates via WebSocket

### Testing Failover on Real Devices

1. **Start transfer with WiFi**
2. **Disable WiFi** on sender device
3. **System automatically switches to Bluetooth** (if available) or relay
4. **Transfer continues** without manual intervention
5. Re-enable WiFi → switches back seamlessly

## 📁 Project Structure

```
SureRoute/
├── frontend/               # React + Vite UI
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── TopBar.jsx
│   │   │   ├── LeftPanel.jsx
│   │   │   ├── Canvas.jsx
│   │   │   ├── RightPanel.jsx
│   │   │   ├── BottomPanel.jsx
│   │   │   ├── PriorityLane.jsx
│   │   │   ├── TransferCard.jsx
│   │   │   ├── ChunkMap.jsx
│   │   │   ├── TelemetryGraph.jsx
│   │   │   └── AISuggestions.jsx
│   │   ├── services/      # API & WebSocket
│   │   ├── store.js       # State management
│   │   └── App.jsx
│   └── package.json
├── backend/               # Express + Socket.IO
│   ├── src/
│   │   ├── server.js     # Main server
│   │   └── agents.js     # AI agents
│   └── package.json
├── relay-server/          # Store-and-forward relay
│   ├── src/
│   │   └── relay.js
│   └── package.json
├── package.json           # Root workspace
└── README.md
```

## 🎨 UI Components Guide

### Left Panel - Component Library
- **Drag nodes** (Sender, Receiver, File Selector, etc.) to canvas
- **Search** components with filter
- **Quick actions** for common tasks

### Center Canvas
- **Canvas Area** - Drop and configure nodes
- **Priority Lanes**:
  - 🚨 **High Priority (Rush)** - Red, maximum resources
  - ⚡ **Normal Priority** - Blue, balanced allocation
  - 📦 **Low Priority (Bulk)** - Gray, background transfers

### Right Panel - Inspector
- **Details Tab** - Node/transfer configuration
- **Chunks Tab** - Visual chunk map with hover details
- **Telemetry Tab** - Real-time network graphs
- **AI Suggestions** - Smart recommendations

### Bottom Panel
- **Left**: Activity feed with timestamped events
- **Center**: Global metrics (throughput, success rate)
- **Right**: Network simulator (demo mode only)

## ⚙️ Configuration

### Node Configuration
Click any canvas node to configure:
- **Transport Method**: WiFi, Bluetooth, Relay, or Auto
- **Concurrency**: 1-16 parallel chunks
- **Chunk Size**: 256KB - 4MB
- **Delay Tolerance**: Seconds before transport switch

### Simulator Settings
Adjust network conditions (demo mode):
- **Latency**: 0-1000ms
- **Packet Loss**: 0-50%
- **Connection Drops**: Simulate disconnections
- **Quick Actions**: Drop connection, degrade quality, reset

### AI Automation Levels
- **Manual**: All suggestions require approval
- **Assistive**: AI suggests, user accepts/rejects
- **Autonomous**: AI applies suggestions automatically

## 🔧 API Endpoints

### Transfer Operations
- `POST /api/transfer/create` - Create new transfer
- `POST /api/manifest/check` - Check missing chunks (resume)
- `POST /api/upload/:transferId/:chunkIndex` - Upload chunk
- `POST /api/transfer/:id/pause` - Pause transfer
- `POST /api/transfer/:id/resume` - Resume transfer
- `POST /api/transfer/:id/cancel` - Cancel transfer

### AI & Agents
- `POST /api/agent/accept/:suggestionId` - Accept AI suggestion
- `POST /api/agent/reject/:suggestionId` - Reject AI suggestion
- `POST /api/agent/automation` - Set automation level
- `POST /api/ai/ask` - Ask AI assistant

### Transport & Simulation
- `POST /api/transport/set` - Configure transport
- `GET /api/transport/available` - List available transports
- `POST /api/simulator/update` - Update simulator settings
- `POST /api/simulator/event` - Trigger network event

### Relay Operations
- `POST /relay/store/:transferId/:chunkIndex` - Store chunk on relay
- `GET /relay/fetch/:transferId/:chunkIndex` - Fetch chunk from relay
- `GET /relay/chunks/:transferId` - List relay chunks

## 🔌 WebSocket Events

### Client → Server
- None (client-initiated actions via REST API)

### Server → Client
- `connection:status` - Connection state changed
- `transfer:update` - Transfer progress/status update
- `telemetry` - Network telemetry data
- `agent:suggest` - AI agent suggestion
- `chunk:update` - Chunk status changed
- `transport:change` - Active transport changed

## 🐛 Troubleshooting

### Frontend won't start
```powershell
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Backend connection failed
- Check if backend is running on port 5000
- Verify firewall allows connections
- Check browser console for CORS errors

### File transfer stuck
- Check chunk map for failed chunks (red)
- Click failed chunks to manually resend
- Try switching transport method
- Check AI suggestions for recommendations

### Real-device connection issues
- Verify both devices on same network
- Update frontend API URL with correct IP
- Check firewall settings
- Ensure ports 5000-5001 are open

## 📊 Performance Tips

1. **Optimize Chunk Size**: 
   - Fast network (>10 Mbps): 2-4MB chunks
   - Moderate network: 1MB chunks (default)
   - Slow/unstable: 256-512KB chunks

2. **Adjust Concurrency**:
   - High bandwidth: 8-16 concurrent
   - Moderate: 4-6 concurrent (default)
   - Limited: 1-2 concurrent

3. **Use Priority Wisely**:
   - High priority for small, urgent files
   - Normal for regular transfers
   - Low for large background transfers

## 🎓 Architecture Highlights

### AI Agents
- **Monitor Agent**: Analyzes RTT, packet loss, bandwidth trends
- **Scheduler Agent**: Manages priority queues and resource allocation
- **Recovery Agent**: Tracks failures, suggests relay/transport changes

### Transfer Engine
- SHA-256 chunk verification
- Atomic chunk writes with temp storage
- Final file assembly with integrity check
- State persistence for resume capability

### Multi-Transport Layer
- WiFi: Primary, fastest
- Bluetooth: Fallback for local proximity
- Relay: Cloud store-and-forward for difficult networks

## 📝 License

MIT License - See LICENSE file for details

## 👥 Team & Credits

**Developed by**: KKY Brothers  
**Project**: Advanced ML Projects  
**Demo**: Hackathon/Judge Presentation Ready

## 🆘 Support

For questions or issues:
1. Check the troubleshooting section
2. Review API documentation
3. Use "Ask AI" feature in the app
4. Check browser console for errors

---

**⚡ Ready to demo resilient file transfers with AI intelligence!**