const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const orgConnections = new Map(); // orgId -> Set<ws>

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) { ws.close(4001, 'No token'); return; }

    let orgId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      orgId = decoded.orgId;
    } catch {
      ws.close(4001, 'Invalid token'); return;
    }

    // Register connection
    if (!orgConnections.has(orgId)) orgConnections.set(orgId, new Set());
    orgConnections.get(orgId).add(ws);

    ws.send(JSON.stringify({ type: 'connected', orgId }));

    ws.on('close', () => {
      orgConnections.get(orgId)?.delete(ws);
    });

    ws.on('error', () => {
      orgConnections.get(orgId)?.delete(ws);
    });
  });

  console.log('✅ WebSocket server ready');
}

function broadcastEvent(orgId, payload) {
  const conns = orgConnections.get(orgId);
  if (!conns?.size) return;
  const msg = JSON.stringify({ ...payload, ts: Date.now() });
  conns.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

module.exports = { setupWebSocket, broadcastEvent };
