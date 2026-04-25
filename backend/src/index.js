require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');
const rateLimit = require('express-rate-limit');

const app = express();
const httpServer = createServer(app);

// Trust Railway proxy
app.set('trust proxy', 1);

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

// API Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/agents',        require('./routes/agents'));
app.use('/api/calls',         require('./routes/calls'));
app.use('/api/appointments',  require('./routes/appointments'));
app.use('/api/voicemails',    require('./routes/voicemails'));
app.use('/api/recordings',    require('./routes/recordings'));
app.use('/api/faqs',          require('./routes/faqs'));
app.use('/api/contacts',      require('./routes/contacts'));
app.use('/api/conversations',  require('./routes/conversations'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/notifications',  require('./routes/notifications'));
app.use('/api/integrations',   require('./routes/integrations'));
app.use('/api/admin',         require('./routes/admin'));

// Special routes
app.use('/setup',     require('./routes/setup'));
app.use('/webhooks',  require('./routes/webhooks'));
app.use('/voice',     require('./routes/voice'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '2.0.0', ts: new Date() }));

// Serve React frontend in production
const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  const apiPaths = ['/api', '/voice', '/webhooks', '/health', '/ws', '/setup'];
  if (!apiPaths.some(p => req.path.startsWith(p))) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

// WebSocket
const { setupWebSocket } = require('./services/websocket');
setupWebSocket(httpServer);

// Start
const { initDB } = require('./db/pool');
const PORT = process.env.PORT || 3001;

initDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 ARIA Platform v2.0 running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB init failed:', err.message);
    process.exit(1);
  });
