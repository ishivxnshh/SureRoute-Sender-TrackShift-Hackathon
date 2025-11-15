import express from 'express';
import { emitAgentSuggest } from '../ws.js';

const router = express.Router();

// Agents submit suggestions; UI will receive via WS
router.post('/suggest', (req, res) => {
  const body = req.body || {};
  const { agent = 'Agent', transfer_id: transferId, suggestion } = body;
  if (!transferId || !suggestion) return res.status(400).json({ error: 'missing fields' });
  emitAgentSuggest({
    type: 'agent:suggest',
    agent,
    transfer_id: transferId,
    suggestion
  });
  return res.json({ ok: true });
});

export default router;


