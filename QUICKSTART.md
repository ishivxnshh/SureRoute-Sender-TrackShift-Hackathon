# Quick Start Guide

## Installation

```powershell
# Install all dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd relay-server && npm install && cd ..
```

## Start Development

```powershell
# Start all services at once
npm run dev
```

Or individually:

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Relay
cd relay-server
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Relay Server**: http://localhost:5001

## First-Time Setup

1. Open http://localhost:3000
2. Verify green connection status in top bar
3. Drag "Sender Node" from left panel to canvas
4. Drag "File Selector" to canvas
5. Configure and start your first transfer!

## Demo Mode

The system starts in **Demo Mode** by default with network simulator enabled.

To switch to **Real Mode** for actual device transfers:
1. Click "Real Mode" toggle in top bar
2. Update frontend API URL if connecting to remote backend
3. Ensure devices are on same network

## Common Issues

**Port already in use:**
```powershell
# Find and kill process on port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Dependencies not installing:**
```powershell
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

**Backend not connecting:**
- Check if backend is running (http://localhost:5000/health)
- Check firewall settings
- Verify WebSocket connection in browser console

## Demo Script

See `DEMO_SCRIPT.md` for complete 3-minute judge presentation.

## Documentation

See `README.md` for comprehensive documentation.
