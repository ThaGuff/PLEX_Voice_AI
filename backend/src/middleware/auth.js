const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT u.*, o.name as org_name, o.plan as org_plan, o.slug as org_slug,
              o.twilio_phone_number, o.features
       FROM users u JOIN organizations o ON u.org_id = o.id
       WHERE u.id = $1`,
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    req.orgId = rows[0].org_id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') return res.status(403).json({ error: 'Super admin required' });
  next();
}

module.exports = { requireAuth, requireSuperAdmin };
