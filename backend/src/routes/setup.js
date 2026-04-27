const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

router.post('/superadmin', async (req, res) => {
  const { name, email, password, secret } = req.body;
  if (!secret || secret !== process.env.SETUP_SECRET)
    return res.status(403).json({ error: 'Invalid setup secret.' });
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password required.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fix the role check constraint to include superadmin
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('superadmin','owner','admin','member'));
    `);

    // Get or create admin org
    let orgId;
    const { rows: existing } = await client.query(
      "SELECT id FROM organizations WHERE slug='plex-automation-admin' LIMIT 1"
    );
    if (existing.length) {
      orgId = existing[0].id;
    } else {
      const { rows: [org] } = await client.query(
        "INSERT INTO organizations(name,slug,plan) VALUES('PLEX Automation','plex-automation-admin','agency') RETURNING id"
      );
      orgId = org.id;
    }

    // Remove any existing superadmin
    await client.query("DELETE FROM users WHERE role='superadmin'");
    // Also remove if email already exists
    await client.query("DELETE FROM users WHERE email=$1", [email]);

    const hash = await bcrypt.hash(password, 12);
    const { rows: [user] } = await client.query(
      "INSERT INTO users(org_id,email,password_hash,name,role) VALUES($1,$2,$3,$4,'superadmin') RETURNING id,name,email,role",
      [orgId, email, hash, name]
    );

    await client.query('COMMIT');
    const token = jwt.sign({ userId: user.id, orgId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, org: { id: orgId, plan: 'agency' } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Setup error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

module.exports = router;
