// calls.js
const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { limit = 50, offset = 0, outcome, type } = req.query;
  let where = 'WHERE c.org_id=$1';
  const params = [req.orgId];
  if (outcome) { params.push(outcome); where += ` AND c.outcome=$${params.length}`; }
  if (type) { params.push(type); where += ` AND c.call_type=$${params.length}`; }
  params.push(parseInt(limit), parseInt(offset));
  const { rows } = await pool.query(
    `SELECT c.*, r.url as recording_url FROM calls c
     LEFT JOIN recordings r ON r.call_id=c.id
     ${where} ORDER BY c.started_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  );
  const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) FROM calls ${where}`, params.slice(0,-2));
  res.json({ calls: rows, total: parseInt(count) });
});

router.get('/:id', requireAuth, async (req, res) => {
  const { rows: [call] } = await pool.query(
    `SELECT c.*, r.url as recording_url, r.transcript FROM calls c
     LEFT JOIN recordings r ON r.call_id=c.id
     WHERE c.id=$1 AND c.org_id=$2`, [req.params.id, req.orgId]
  );
  if (!call) return res.status(404).json({ error: 'Not found' });
  res.json(call);
});

module.exports = router;
