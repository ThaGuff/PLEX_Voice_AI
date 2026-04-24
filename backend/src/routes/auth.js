const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, orgName } = req.body;
  if (!name || !email || !password || !orgName)
    return res.status(400).json({ error: 'All fields required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check email taken
    const { rows: existing } = await client.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    // Create org
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now();
    const { rows: [org] } = await client.query(
      'INSERT INTO organizations(name, slug) VALUES($1,$2) RETURNING *',
      [orgName, slug]
    );

    // Create default agent
    await client.query(
      `INSERT INTO agents(org_id, name, greeting, after_hours_msg, business_hours, features)
       VALUES($1,'ARIA','Thank you for calling! This is ARIA, your AI assistant. How can I help you today?',
       'Our office is currently closed. I can take your information and have someone reach out first thing tomorrow.',
       $2, $3)`,
      [org.id,
       JSON.stringify({ mon_fri: { open: '08:00', close: '18:00' }, sat: { open: '09:00', close: '16:00' }, sun: 'closed' }),
       JSON.stringify({ faq: true, booking: true, voicemail: true, transfer: true, sms: true, email: true, crm: true, summary: true })
      ]
    );

    // Create user
    const hash = await bcrypt.hash(password, 12);
    const { rows: [user] } = await client.query(
      'INSERT INTO users(org_id, email, password_hash, name, role) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [org.id, email, hash, name, 'owner']
    );

    await client.query('COMMIT');

    const token = jwt.sign({ userId: user.id, orgId: org.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, org });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT u.*, o.name as org_name, o.slug, o.plan FROM users u JOIN organizations o ON u.org_id=o.id WHERE u.email=$1',
    [email]
  );
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id, orgId: user.org_id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    org: { id: user.org_id, name: user.org_name, slug: user.slug, plan: user.plan }
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const { rows: [org] } = await pool.query('SELECT * FROM organizations WHERE id=$1', [req.orgId]);
  res.json({ user: req.user, org });
});

// PUT /api/auth/org — update org settings
router.put('/org', requireAuth, async (req, res) => {
  const { twilio_account_sid, twilio_auth_token, twilio_phone_number, ghl_api_key, ghl_location_id,
          notification_email, notification_sms } = req.body;
  const { rows: [org] } = await pool.query(
    `UPDATE organizations SET
       twilio_account_sid=COALESCE($1, twilio_account_sid),
       twilio_auth_token=COALESCE($2, twilio_auth_token),
       twilio_phone_number=COALESCE($3, twilio_phone_number),
       ghl_api_key=COALESCE($4, ghl_api_key),
       ghl_location_id=COALESCE($5, ghl_location_id),
       notification_email=COALESCE($6, notification_email),
       notification_sms=COALESCE($7, notification_sms),
       updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [twilio_account_sid, twilio_auth_token, twilio_phone_number, ghl_api_key, ghl_location_id,
     notification_email, notification_sms, req.orgId]
  );
  res.json(org);
});

module.exports = router;
