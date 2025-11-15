import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4600;
const root = path.join(process.cwd(), 'data');
const relayRoot = path.join(root, 'relay');
mkdirp.sync(relayRoot);

app.use((req, res, next) => {
  if (req.is('application/octet-stream')) {
    let data = [];
    req.on('data', (c) => data.push(c));
    req.on('end', () => {
      req.rawBody = Buffer.concat(data);
      next();
    });
  } else {
    next();
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/relay/:transfer_id/chunk/:index', (req, res) => {
  const transferId = req.params.transfer_id;
  const index = req.params.index;
  if (!req.rawBody) return res.status(400).json({ error: 'missing body' });
  const dir = path.join(relayRoot, transferId);
  mkdirp.sync(dir);
  const file = path.join(dir, `${index}`);
  fs.writeFileSync(file, req.rawBody);
  res.json({ ok: true });
});

app.get('/relay/:transfer_id/chunk/:index', (req, res) => {
  const transferId = req.params.transfer_id;
  const index = req.params.index;
  const file = path.join(relayRoot, transferId, `${index}`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' });
  res.setHeader('Content-Type', 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Relay listening on http://localhost:${PORT}`);
});


