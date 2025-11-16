# 🚀 SureRoute - Complete Setup & Run Guide

## ⚡ Quick Start (Fastest Way)

### Windows Users:
1. **Double-click `setup.bat`** - Installs all dependencies
2. **Double-click `start-all.bat`** - Starts all services
3. **Open browser to http://localhost:3000**

### Mac/Linux Users:
```bash
# Install dependencies
npm run install-all

# Start all services
npm run dev
```

---

## 📋 Step-by-Step Setup

### 1️⃣ Install Dependencies

**Option A - Automated (Windows):**
```powershell
.\setup.bat
```

**Option B - Manual:**
```powershell
# Root
npm install

# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
cd ..

# Relay Server
cd relay-server
npm install
cd ..
```

### 2️⃣ Start the Application

**Option A - All at once (Windows):**
```powershell
.\start-all.bat
```

**Option B - All at once (Mac/Linux):**
```bash
npm run dev
```

**Option C - Individual terminals:**
```powershell
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

### 3️⃣ Access the Application

Open your browser to: **http://localhost:3000**

Verify:
- ✅ Green connection status in top bar
- ✅ Left panel shows components
- ✅ Center canvas is interactive
- ✅ Right panel says "No Selection"

---

## 🎯 First Transfer Demo

### Quick 30-Second Test:

1. **Drag "Sender Node"** from left panel → drop on canvas
2. **Drag "File Selector"** → drop on canvas  
3. **Click File Selector** → Configure → Browse file
4. **Drag file** → Drop on **High Priority (Red)** lane
5. **Click "Start All"** in top bar
6. **Watch magic happen!** ✨

---

## 🎬 3-Minute Judge Demo

Follow the complete script in **`DEMO_SCRIPT.md`** which includes:
- Basic transfer visualization
- Network resilience demonstration  
- AI intelligence showcase
- Multi-priority management
- Real-world use cases

---

## 🔧 Troubleshooting

### ❌ "Port already in use"
```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### ❌ "Cannot connect to backend"
1. Check backend is running (http://localhost:5000/health)
2. Check for error messages in backend terminal
3. Verify firewall isn't blocking ports 5000-5001
4. Try restarting backend: `cd backend && npm run dev`

### ❌ "Chunks not uploading"
1. Check browser console for errors (F12)
2. Verify storage directory exists (creates automatically)
3. Check disk space
4. Try smaller file first (<10MB)

### ❌ "AI suggestions not appearing"
1. Start a transfer to generate telemetry
2. Use Network Simulator to create conditions (latency, packet loss)
3. Check Automation Level is not "Manual"
4. Look in backend console for agent output

### ❌ Dependencies won't install
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules frontend/node_modules backend/node_modules relay-server/node_modules

# Reinstall
npm run install-all
```

---

## 🌐 Multi-Device Real Demo

### Setup for Real Transfer Between Computers:

**On Computer A (Sender):**
1. Get your IP address:
   ```powershell
   ipconfig
   # Note the IPv4 address, e.g., 192.168.1.100
   ```

2. Start SureRoute normally:
   ```powershell
   npm run dev
   ```

3. Ensure firewall allows connections on ports 5000-5001

**On Computer B (Receiver):**
1. Edit `frontend/.env` (create if doesn't exist):
   ```
   VITE_API_URL=http://192.168.1.100:5000
   ```

2. Start only frontend:
   ```powershell
   cd frontend
   npm run dev
   ```

3. Open http://localhost:3000

**Test Connection:**
- Computer B should show green connection status
- Try starting a transfer from Computer A
- Both should see synchronized progress

---

## 📱 Mobile/Tablet Access

Access from any device on same network:

1. Get computer's IP (e.g., 192.168.1.100)
2. Open on mobile: `http://192.168.1.100:3000`
3. UI is responsive and touch-friendly

---

## 🎨 Demo Mode vs Real Mode

### Demo Mode (Default):
- Simulated network conditions
- Network simulator enabled
- Perfect for presentations
- No actual file transfer needed
- AI suggestions based on simulated telemetry

**Use for:** Hackathon demos, judge presentations, testing

### Real Mode:
- Actual device connections
- Real file transfers over network
- Multi-transport failover (WiFi/Bluetooth)
- No simulation - real metrics

**Use for:** Production testing, real-world validation

**To switch:** Click "Real Mode" toggle in top bar

---

## 🎓 Understanding the System

### Architecture:
```
Frontend (React) ←→ Backend (Express) ←→ Relay (Store-Forward)
     ↓                    ↓
  WebSocket          AI Agents
   Updates         (Monitor/Scheduler/Recovery)
```

### Data Flow:
1. User drops file → Manifest created
2. File split into chunks (1MB each)
3. Each chunk hashed (SHA-256)
4. Chunks uploaded in parallel
5. Backend verifies each chunk
6. AI monitors and optimizes
7. File reassembled when complete

### AI Agents:
- **Monitor**: Watches RTT, packet loss, bandwidth
- **Scheduler**: Manages priorities and concurrency
- **Recovery**: Tracks failures, triggers failover

---

## 🎤 Talking Points for Demo

### Problem Statement:
"Traditional file transfers fail completely when networks drop. You lose progress and start over."

### Our Solution:
"SureRoute uses AI-powered chunked transfers with automatic failover. Network drops? No problem - we resume right where we left off."

### Key Differentiators:
1. ✅ **Resilient**: Resume from any interruption
2. 🤖 **Intelligent**: AI optimizes automatically
3. 🔄 **Multi-transport**: WiFi/Bluetooth/Relay fallback
4. 📊 **Transparent**: See every chunk, every metric
5. 🎯 **Priority-aware**: Critical transfers go first

### Use Cases:
- 🏥 **Healthcare**: Hospital → Hospital patient data
- 💼 **Enterprise**: Remote workers, unstable VPNs
- 🌐 **IoT**: Edge devices to cloud
- 🎓 **Education**: Large course materials
- 🎬 **Media**: Video production files

---

## 📊 Performance Benchmarks

### Optimal Settings:

**Fast Network (>10 Mbps):**
- Chunk size: 2-4 MB
- Concurrency: 8-16
- Priority: Normal

**Moderate Network (1-10 Mbps):**
- Chunk size: 1 MB (default)
- Concurrency: 4-6
- Priority: Normal or High

**Slow/Unstable Network:**
- Chunk size: 256-512 KB
- Concurrency: 1-2
- Priority: High (for small files)
- Consider: Enable relay fallback

---

## 🔐 Security Notes

- All chunks verified with SHA-256
- Optional: Add encryption (extend the code)
- Transport layer can use TLS
- Relay doesn't decrypt chunks
- No authentication by default (add for production)

---

## 📚 Additional Resources

- **README.md** - Full documentation
- **DEMO_SCRIPT.md** - 3-minute presentation guide
- **QUICKSTART.md** - Basic setup guide
- **/backend/src/agents.js** - AI agent code
- **/frontend/src/components/** - UI components

---

## 🆘 Need Help?

1. **Check documentation** - README.md has detailed info
2. **Check console** - Browser F12 and terminal logs
3. **Use "Ask AI"** - Built into the app (top-right button)
4. **Check GitHub issues** - Common problems and solutions

---

## ✅ Pre-Demo Checklist

- [ ] All dependencies installed
- [ ] All services starting without errors
- [ ] Browser shows SureRoute UI
- [ ] Connection status is green
- [ ] Can drag components to canvas
- [ ] Test file ready (100MB+ recommended)
- [ ] Network simulator works (demo mode)
- [ ] Reviewed DEMO_SCRIPT.md
- [ ] Screenshots taken (backup)
- [ ] Backup slides ready (if demo fails)

---

## 🎉 You're Ready!

Everything is set up. Now:

1. **Practice the demo 2-3 times**
2. **Test with small file first**
3. **Then test with large file**
4. **Try all simulator features**
5. **Familiarize yourself with AI suggestions**
6. **Have fun presenting!**

---

**Good luck with your demo! 🚀**

*SureRoute - Resilient transfers, powered by AI* ⚡
