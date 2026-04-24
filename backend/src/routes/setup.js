const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

router.post('/superadmin', async (req, res) => {
  const { name, email, password, secret } = req.body;
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Invalid setup secret' });
  }
  const { rows: existing } = await pool.query("SELECT id FROM users WHERE role='superadmin' LIMIT 1");
  if (existing.length) return res.status(409).json({ error: 'Super admin already exists. Please login.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [org] } = await client.query(
      `INSERT INTO organizations(name, slug, plan) VALUES('PLEX Automation','plex-automation-admin','agency')
       ON CONFLICT(slug) DO UPDATE SET name='PLEX Automation' RETURNING *`
    );
    const hash = await bcrypt.hash(password, 12);
    const { rows: [user] } = await client.query(
      `INSERT INTO users(org_id,email,password_hash,name,role) VALUES($1,$2,$3,$4,'superadmin') RETURNING *`,
      [org.id, email, hash, name]
    );
    await client.query('COMMIT');
    const token = jwt.sign({ userId: user.id, orgId: org.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, org });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
