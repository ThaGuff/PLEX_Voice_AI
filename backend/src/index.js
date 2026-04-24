require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { setupWebSocket } = require('./services/websocket');
const { initDB } = require('./db/pool');

const app = express();
const httpServer = createServer(app);

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/agents',       require('./routes/agents'));
app.use('/api/calls',        require('./routes/calls'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/voicemails',   require('./routes/voicemails'));
app.use('/api/recordings',   require('./routes/recordings'));
app.use('/api/faqs',         require('./routes/faqs'));
app.use('/api/crm',          require('./routes/crm'));
app.use('/api/analytics',    require('./routes/analytics'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/setup',            require('./routes/setup'));
app.use('/webhooks',         require('./routes/webhooks'));
app.use('/voice',            require('./routes/voice'));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  const skip = ['/api', '/webhooks', '/voice', '/health', '/ws', '/setup'];
  if (!skip.some(p => req.path.startsWith(p))) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

setupWebSocket(httpServer);

const PORT = process.env.PORT || 3001;
initDB().then(() => {
  httpServer.listen(PORT, () => console.log(`🚀 ARIA running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
