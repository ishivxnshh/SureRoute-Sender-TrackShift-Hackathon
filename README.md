# Smart File Transfer System — "SureRoute"

SureRoute is a hackathon-ready, resumable, priority-aware file transfer system for unstable networks. It features a drag-and-drop UI with three priority pipelines (High/Medium/Low), realtime telemetry via WebSockets, chunk maps, and lightweight rule-based agents that provide suggestions.

Note: This project is implemented without Docker for local and multi-machine demos.

## Features

- Resumable, chunked uploads with per-chunk SHA-256 and final checksum.
- Priority-aware scheduler with preemption and transport fallback (wifi/cell/bluetooth).
- WebSocket telemetry: transfer progress, speeds, ETA, network metrics.
- Drag-and-drop canvas UI with three pipelines and an inspector panel.
- Rule-based agents (Monitor, Scheduler) emit suggestions to optimize transfers.
- Network simulator service (latency, jitter, packet loss, and link down).
- Relay microservice for store-and-forward (fallback path).
- CLI/test scripts for end-to-end upload and resume validation.

## Monorepo Layout

```
backend/       - Node/Express server with REST + Socket.IO, chunk store
frontend/      - React + TypeScript + Vite + Tailwind UI
agents/        - Monitor and Scheduler agents (rule-based)
relay/         - HTTP relay (store-and-forward)
simulator/     - Network simulator service (latency/loss/down)
tests/         - CLI/test scripts for integration
demo/          - Demo docs and helper scripts
```

## Quickstart

1) Install Node.js LTS (>=18).

2) Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../agents/monitor && npm install
cd ../agents/scheduler && npm install
cd ../relay && npm install
cd ../simulator && npm install
cd ../tests && npm install
```

3) Start services (in separate terminals):

```bash
# Terminal 1 - Simulator (port 4500)
cd simulator && npm start

# Terminal 2 - Backend (port 4000)
cd backend && npm start

# Terminal 3 - Relay (port 4600)
cd relay && npm start

# Terminal 4 - Agents (connect to backend ws)
cd agents/monitor && npm start
cd agents/scheduler && npm start

# Terminal 5 - Frontend (port 5173 by default)
cd frontend && npm run dev
```

4) Open the UI at http://localhost:5173/

5) Run a test upload from CLI:

```bash
cd tests
node send_file.js --file ./sample.data --sizeMB 5 --backend http://localhost:4000
```

This will generate a sample file (if not present), compute manifest + chunk hashes, resume if needed, upload chunks, and verify final checksum.

## Backend API

- POST `/transfer/manifest` -> `{ transfer_id, missing_chunks: number[] }`
- POST `/transfer/:transfer_id/chunk/:index` (binary body, header `X-Chunk-Hash`)
- GET  `/transfer/:transfer_id/status`
- POST `/transfer/:transfer_id/complete`
- POST `/agent/suggest` (agents submit suggestions)

Socket.IO namespace `/ws` emits:

```
transfer:update
telemetry
agent:suggest
```

## Simulator API (port 4500)

- GET `/conditions` -> current conditions
- POST `/conditions` with `{ latency_ms, jitter_ms, packet_loss, down }` to set

## Relay API (port 4600)

- POST `/relay/:transfer_id/chunk/:index` (binary)
- GET `/relay/:transfer_id/chunk/:index`

## Security

This is a hackathon-grade demo. For production, add authentication, authorization, TLS, storage hardening, and stricter validation.

## License

MIT
