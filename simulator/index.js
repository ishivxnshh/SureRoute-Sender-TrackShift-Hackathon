import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4500;

const conditions = {
  latency_ms: 50,
  jitter_ms: 20,
  packet_loss: 0.0,
  down: false
};

app.get('/conditions', (req, res) => {
  res.json(conditions);
});

app.post('/conditions', (req, res) => {
  const body = req.body || {};
  if (typeof body.latency_ms === 'number') conditions.latency_ms = Math.max(0, body.latency_ms);
  if (typeof body.jitter_ms === 'number') conditions.jitter_ms = Math.max(0, body.jitter_ms);
  if (typeof body.packet_loss === 'number') {
    conditions.packet_loss = Math.min(1, Math.max(0, body.packet_loss));
  }
  if (typeof body.down === 'boolean') conditions.down = body.down;
  res.json({ ok: true, conditions });
});

app.post('/down/:state', (req, res) => {
  const state = req.params.state;
  conditions.down = state === 'on';
  res.json({ ok: true, down: conditions.down });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Simulator listening on http://localhost:${PORT}`);
});


