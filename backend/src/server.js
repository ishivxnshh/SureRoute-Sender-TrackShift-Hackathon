import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import transferRouter from './routes/transfer.js';
import agentRouter from './routes/agent.js';
import { initWs } from './ws.js';
import { ensureDataDirs } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*'
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/health', (req, res) => res.json({ ok: true }));

// Static for any public assets (optional)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Init storage directories
ensureDataDirs();

// Attach Socket.IO
initWs(io);
app.set('io', io);

// Routes
app.use('/transfer', transferRouter);
app.use('/agent', agentRouter);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`SureRoute backend listening on http://localhost:${PORT}`);
});


