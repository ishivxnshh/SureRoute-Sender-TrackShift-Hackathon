<div align="center">

# 🏎️ SureRoute

### *Haas F1 Team File Transfer System*

[![Version](https://img.shields.io/badge/version-1.0.0-E6002B?style=for-the-badge&logo=git&logoColor=white)](https://github.com/ishivxnshh/SureRoute-Sender-TrackShift-Hackathon)
[![License](https://img.shields.io/badge/license-MIT-00D2BE?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**Race-grade file transfer system with AI-powered optimization, multi-transport failover, and F1-inspired engineering precision.**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-project-structure) • [🎯 Demo](#-demo-script) • [🏁 Features](#-key-features)

</div>

---

## 🏁 Overview

**SureRoute** brings Formula 1 precision to file transfers. Built with the same reliability standards as Haas F1 Team's pit wall communications, SureRoute ensures your data arrives intact - even when connections fail mid-transfer.

### The Challenge
Traditional file transfer fails completely when networks drop. SureRoute never stops - it seamlessly switches between WiFi, Bluetooth, and relay servers, resuming exactly where it left off.

### The Solution
- **0.02s latency** monitoring with F1-grade telemetry
- **100% integrity** guarantee with chunk-level SHA-256 verification  
- **AES-256 security** for encrypted data transport
- **AI Pit Crew** - autonomous agents optimize routing in real-time

## 🏁 Key Features

<table>
<tr>
<td width="50%">

### 🎨 **Pit Wall Interface**
- **F1-Inspired Dashboard** - Haas red accent colors with racing typography (Orbitron + Titillium Web)
- **Workflow Canvas** - Drag-and-drop nodes for complex transfer pipelines
- **Real-Time Telemetry** - Live speed, latency, packet loss visualization
- **3D Grid Animation** - Futuristic landing page with racing aesthetics

### 🔐 **Authentication**
- **Google OAuth 2.0** - One-click sign-in with Google
- **JWT Sessions** - Secure token-based authentication
- **Guest Mode** - Explore without account (workflows not saved)
- **Persistent Login** - Stay logged in across page refreshes

</td>
<td width="50%">

### 🤖 **AI Pit Crew**
- **Monitor Agent** - Analyzes network telemetry, detects anomalies
- **Scheduler Agent** - Optimizes chunk sizes and concurrency
- **Recovery Agent** - Suggests failover strategies on connection loss
- **Autonomous Mode** - AI makes decisions without approval

### 🔄 **Instant Failover**
- **Multi-Transport** - WiFi → Bluetooth → Relay Server
- **Zero Data Loss** - Resume from exact byte on reconnect
- **Adaptive Routing** - AI picks best transport based on conditions
- **Configurable Thresholds** - Set delay tolerance per transfer

</td>
</tr>
<tr>
<td width="50%">

### 📦 **Transfer Engine**
- **Chunk Verification** - SHA-256 hash validation per chunk
- **Resume Capability** - Survive crashes, network drops, power loss
- **Parallel Uploads** - 1-16 concurrent chunks based on bandwidth
- **Priority Queues** - High/Normal/Low priority lanes

</td>
<td width="50%">

### 🌐 **Real Device Support**
- **P2P Mode** - Direct device-to-device over LAN
- **WebRTC Signaling** - NAT traversal with STUN servers
- **Bluetooth Manager** - Local proximity transfers
- **Demo Mode** - Simulate network conditions for testing

</td>
</tr>
</table>

## 📋 Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | v18.0+ | JavaScript runtime |
| **npm** | v9.0+ | Package manager |
| **OS** | Windows/macOS/Linux | Cross-platform support |
| **Browser** | Chrome/Edge/Firefox | Modern web browser |
| **Network** | LAN (for P2P demo) | Multi-device testing |

## 🚀 Quick Start

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/ishivxnshh/SureRoute-Sender-TrackShift-Hackathon.git
cd SureRoute-Sender-TrackShift-Hackathon

# Install dependencies for all services
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../relay-server && npm install
cd ..
```

### 2️⃣ Configure Google OAuth (Optional)

Create `backend/.env`:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Frontend URL
FRONTEND_BASE_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
```

> 💡 **Tip**: You can skip this and use guest mode to test the application.

<details>
<summary>📖 How to get Google OAuth credentials</summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

</details>

### 3️⃣ Start Services

**Option A: Start All Services**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Relay Server  
cd relay-server
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

**Option B: Using Concurrently (Recommended)**
```bash
# Install concurrently globally
npm install -g concurrently

# Start all services at once
concurrently "cd backend && npm run dev" "cd relay-server && npm run dev" "cd frontend && npm run dev"
```

### 4️⃣ Access Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main SureRoute UI |
| **Backend API** | http://localhost:5000 | REST API & WebSocket |
| **Relay Server** | http://localhost:5001 | Store-and-forward relay |

🎉 **You're ready!** Open http://localhost:3000 and click **"Initialize System"**

## 🔐 Google OAuth 2.0 Authentication

### How It Works
1. User clicks **"Continue with Google"** on landing page
2. Backend redirects to Google OAuth consent screen
3. Google returns authorization code to `/auth/google/callback`
4. Backend exchanges code for user profile (email, name, picture)
5. SureRoute creates/updates user in database and generates JWT
6. Frontend receives JWT via URL parameter `?authToken=xxx`
7. JWT stored in localStorage for persistent sessions

### Setup OAuth Credentials
<details>
<summary>Click to expand setup instructions</summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:5000/auth/google/callback`
6. Copy **Client ID** and **Client Secret** to `backend/.env`

</details>

### Authentication Flow Diagram
```
┌─────────┐    Click Login    ┌─────────┐    Redirect    ┌────────┐
│ Frontend├───────────────────>│ Backend ├───────────────>│ Google │
└────┬────┘                    └─────────┘                └───┬────┘
     │                                                         │
     │                         ┌─────────┐    Profile         │
     │      JWT + User         │ Backend │<───────────────────┘
     │<────────────────────────┤         │
     │                         └─────────┘
     │
     └──> Store in localStorage
```
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


## 🎯 Demo Script

### 🏁 **3-Minute Judge Presentation**

#### **Phase 1: Landing & Authentication** (30 sec)
1. Open http://localhost:3000
2. Show **Haas F1 themed landing page** with:
   - 3D animated grid background
   - Hero stats (0.02s latency, 100% integrity, AES-256)
   - Feature cards (Real-Time Telemetry, Pit Crew AI, Secure Transport, Instant Failover)
3. Click **"Initialize System"**
4. Demonstrate auth options:
   - **Login/Signup** with tabs
   - **Google OAuth** (one-click sign-in)
   - **Guest Mode** (instant access)

#### **Phase 2: Workflow Creation** (45 sec)
1. After login, show **My Workflows** section
2. Click **"New Workflow"** → Enter name: "Race Day Transfer"
3. Navigate to **Workflow Canvas**
4. Show **F1-inspired interface**:
   - Top bar with connection status (green ●)
   - Left panel: Component library
   - Center: Workflow canvas with grid
   - Right panel: Node inspector

#### **Phase 3: Transfer Demo** (90 sec)
1. **Drag nodes to canvas**:
   - File Source → Configure file selection
   - Transform → Set chunk size (1MB)
   - Destination → Configure target
2. **Connect nodes** (drag between connection points)
3. **Click Execute** (red button in top bar)
4. **Show real-time telemetry**:
   - Transfer speed graph
   - Chunk completion map
   - Progress percentage
   - ETA countdown

#### **Phase 4: Resilience Test** (45 sec)
1. **Simulate network failure** (bottom panel simulator)
   - Set packet loss to 20%
   - Inject 500ms latency
2. **Show AI response**:
   - Monitor Agent detects degradation
   - Suggests "Switch to relay server"
   - Auto-failover activates
3. **Transfer continues seamlessly**
   - Chunk map updates with relay chunks (different color)
   - Zero data loss
   - Completion checkmark ✓

### 🎬 **Key Talking Points**
- ✅ "Unlike traditional FTP, SureRoute **never fails mid-transfer**"
- ✅ "AI agents make split-second decisions like an F1 pit crew"
- ✅ "Chunk-level verification means 100% data integrity"
- ✅ "Built with the same standards as Haas F1 Team communications"

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
SureRoute-Sender-TrackShift-Hackathon/
│
├── frontend/                      # React 18 + Vite 4 Frontend
│   ├── src/
│   │   ├── components/           # UI Components
│   │   │   ├── TopBar.jsx       # Navigation & controls
│   │   │   ├── LeftPanel.jsx    # Node library
│   │   │   ├── Canvas.jsx       # Workflow canvas
│   │   │   ├── WorkflowCanvas.jsx
│   │   │   ├── WorkflowNode.jsx
│   │   │   ├── RightPanel.jsx   # Inspector panel
│   │   │   ├── BottomPanel.jsx  # Activity feed
│   │   │   ├── TransferCard.jsx
│   │   │   ├── ChunkMap.jsx
│   │   │   ├── TelemetryGraph.jsx
│   │   │   ├── AISuggestions.jsx
│   │   │   └── ThreeBackground.jsx  # 3D grid animation
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx  # Hero + Features + Workflows
│   │   │   └── HomePage.jsx     # Workflow list (legacy)
│   │   ├── services/
│   │   │   ├── api.js           # Axios HTTP client
│   │   │   ├── websocket.js     # Socket.IO client
│   │   │   └── webrtc.js        # P2P connections
│   │   ├── store.js             # Zustand state management
│   │   ├── App.jsx              # Root component
│   │   ├── index.css            # Haas F1 design tokens
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                       # Node.js + Express Backend
│   ├── src/
│   │   ├── server.js            # Main Express server
│   │   ├── agents.js            # AI agent logic
│   │   ├── workflows.js         # Workflow execution
│   │   ├── bluetooth-manager.js # Bluetooth transport
│   │   ├── p2p-manager.js       # WebRTC P2P
│   │   ├── controllers/
│   │   │   └── authController.js # Auth logic
│   │   ├── models/
│   │   │   └── user.js          # User model
│   │   ├── utils/
│   │   │   ├── googleOAuth.js   # Google OAuth flow
│   │   │   └── jwt.js           # JWT generation
│   │   └── db/
│   │       └── mongo.js         # MongoDB connection
│   ├── storage/                 # File storage
│   │   ├── chunks/              # Temporary chunks
│   │   ├── files/               # Completed files
│   │   └── uploads/             # Upload staging
│   ├── .env.example             # Environment template
│   └── package.json
│
├── relay-server/                  # Store-and-Forward Relay
│   ├── src/
│   │   └── relay.js             # Relay server logic
│   ├── relay-storage/           # Relay chunk cache
│   └── package.json
│
├── client/                        # Original design reference
│   └── src/                     # (Used for UI/UX migration)
│
├── README.md                      # This file
├── LICENSE                        # MIT License
└── package.json                   # Root workspace config
```

### 🎨 **Design System**

**Colors (Haas F1 Palette)**
```css
--haas-red: #E6002B          /* Primary accent */
--haas-black: #15151E        /* Backgrounds */
--haas-grey: #7B868C         /* Secondary text */
--bg-primary: #0a0a0f        /* Main background */
--bg-secondary: #15151E      /* Cards */
--bg-tertiary: #1e1e2a       /* Elevated surfaces */
```

**Typography**
```css
--font-display: 'Orbitron'       /* Headings */
--font-primary: 'Titillium Web'  /* Body text */
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

### Common Issues

<details>
<summary><b>❌ Frontend won't start</b></summary>

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Check:**
- Node.js version >= 18
- Port 3000 not in use
- Run `npm list react` to verify React 18+

</details>

<details>
<summary><b>❌ Backend connection failed</b></summary>

```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check logs
cd backend
npm run dev  # Should show "Server running on port 5000"
```

**Check:**
- Port 5000 not blocked by firewall
- `.env` file exists in backend folder
- MongoDB running (if using database)

</details>

<details>
<summary><b>❌ Google OAuth not working</b></summary>

**Checklist:**
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in `backend/.env`
- [ ] Redirect URI exactly matches: `http://localhost:5000/auth/google/callback`
- [ ] Google Cloud Console → Credentials → OAuth consent screen configured
- [ ] Try clearing browser cookies and cache

</details>

<details>
<summary><b>❌ Page refresh logs out user</b></summary>

**Solution:** Authentication should persist via localStorage. If it doesn't:
```bash
# Check browser console for errors
# Verify localStorage has 'sureroute_auth_token'

# Force clear and re-login
localStorage.clear()
# Then login again
```

</details>

<details>
<summary><b>❌ Workflows not saving</b></summary>

**Check:**
- User is logged in (not guest mode)
- Backend `/api/workflows` endpoint responding
- Browser console for API errors
- Network tab shows POST requests to backend

</details>

## 📚 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Redirect to Google OAuth |
| `GET` | `/auth/google/callback` | OAuth callback handler |
| `POST` | `/api/auth/signup` | Create account with email/password |
| `POST` | `/api/auth/login` | Login with email/password |
| `GET` | `/api/auth/me` | Get current user (requires JWT) |
| `POST` | `/api/auth/logout` | Logout current session |

### Workflow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workflows` | List user workflows |
| `POST` | `/api/workflows` | Create new workflow |
| `PUT` | `/api/workflows/:id` | Update workflow |
| `DELETE` | `/api/workflows/:id` | Delete workflow |
| `POST` | `/api/workflows/:id/execute` | Execute workflow |

### Transfer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transfer/create` | Initiate file transfer |
| `POST` | `/api/upload/:transferId/:chunkIndex` | Upload chunk |
| `GET` | `/api/manifest/:transferId` | Get chunk manifest |
| `POST` | `/api/transfer/:id/pause` | Pause transfer |
| `POST` | `/api/transfer/:id/resume` | Resume transfer |
| `POST` | `/api/transfer/:id/cancel` | Cancel transfer |

### Relay Server Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/relay/store/:transferId/:chunkIndex` | Store chunk on relay |
| `GET` | `/relay/fetch/:transferId/:chunkIndex` | Fetch chunk from relay |
| `GET` | `/relay/chunks/:transferId` | List available chunks |

### WebSocket Events

**Client → Server**
- *None* (client uses REST API for actions)

**Server → Client**
| Event | Payload | Description |
|-------|---------|-------------|
| `connection:status` | `{ status: 'connected' \| 'degraded' \| 'disconnected' }` | Connection state changed |
| `transfer:update` | `{ transferId, progress, speed, eta }` | Transfer progress |
| `telemetry` | `{ rtt, packetLoss, bandwidth }` | Network metrics |
| `agent:suggest` | `{ agent, suggestion, confidence }` | AI suggestion |
| `chunk:update` | `{ transferId, chunkIndex, status }` | Chunk status |
| `transport:change` | `{ from, to, reason }` | Transport switched |

## 🎓 Architecture & Technical Details

### Tech Stack

**Frontend**
- React 18.2 with Hooks
- Vite 4.3 (build tool)
- Zustand (state management)
- Socket.IO Client (WebSocket)
- Axios (HTTP client)
- React DnD (drag-and-drop)
- Lucide React (icons)
- Recharts (telemetry graphs)

**Backend**
- Node.js 18+ / Express 4
- Socket.IO (real-time events)
- Multer (file uploads)
- JWT (authentication)
- Google OAuth 2.0
- SHA-256 (chunk verification)

**Infrastructure**
- WebRTC (P2P connections)
- Bluetooth Web API
- Store-and-forward relay
- STUN servers (NAT traversal)

### How Transfers Work

1. **Chunking**: File split into configurable chunks (default 1MB)
2. **Hashing**: Each chunk gets SHA-256 hash
3. **Upload**: Chunks sent in parallel (adaptive concurrency)
4. **Verification**: Server validates hash per chunk
5. **Assembly**: All chunks combined into final file
6. **Checksum**: Final file integrity verification

### AI Agent Architecture

```
┌─────────────────────────────────────────────┐
│           AI Pit Crew System                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Monitor    │  │  Scheduler   │        │
│  │    Agent     │  │    Agent     │        │
│  │              │  │              │        │
│  │ • RTT        │  │ • Priority   │        │
│  │ • PacketLoss │  │ • Queues     │        │
│  │ • Bandwidth  │  │ • Resources  │        │
│  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                │
│         └────────┬────────┘                │
│                  │                         │
│         ┌────────▼────────┐                │
│         │   Recovery      │                │
│         │     Agent       │                │
│         │                 │                │
│         │ • Failover      │                │
│         │ • Retry Logic   │                │
│         │ • Transport     │                │
│         └─────────────────┘                │
│                                             │
└─────────────────────────────────────────────┘
```

### Multi-Transport Failover

```
WiFi (Primary)
  └─> Latency spike detected
      └─> Switch to Bluetooth (Local)
          └─> Bluetooth unavailable
              └─> Switch to Relay Server
                  └─> Transfer completes
```

**Decision Criteria:**
- WiFi: RTT < 100ms, Packet loss < 5%
- Bluetooth: Distance < 10m, RTT < 200ms
- Relay: Fallback for all other cases

## 📝 License & Credits

### License
This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 SureRoute Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Credits & Acknowledgments

**Developed by:** [Shivansh](https://github.com/ishivxnshh)  
**Project:** TrackShift Hackathon  
**Design Inspiration:** Haas F1 Team  

**Technologies:**
- React Team (Facebook/Meta)
- Node.js Foundation
- Socket.IO Contributors
- Google OAuth Team

**Fonts:**
- Orbitron by Matt McInerney
- Titillium Web by Accademia di Belle Arti di Urbino

---

<div align="center">

### 🏁 Built with F1 precision. Tested for reliability. Ready for production.

**Star ⭐ this repo if you find it useful!**

[![GitHub stars](https://img.shields.io/github/stars/ishivxnshh/SureRoute-Sender-TrackShift-Hackathon?style=social)](https://github.com/ishivxnshh/SureRoute-Sender-TrackShift-Hackathon)
[![GitHub forks](https://img.shields.io/github/forks/ishivxnshh/SureRoute-Sender-TrackShift-Hackathon?style=social)](https://github.com/ishivxnshh/SureRoute-Sender-TrackShift-Hackathon/fork)

**[⬆ Back to Top](#-sureroute)**

</div>