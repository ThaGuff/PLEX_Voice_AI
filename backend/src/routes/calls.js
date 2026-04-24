const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, outcome, type } = req.query;
    const params = [req.orgId];
    let filter = '';
    if (outcome) { params.push(outcome); filter += ` AND c.outcome=$${params.length}`; }
    if (type)    { params.push(type);    filter += ` AND c.call_type=$${params.length}`; }
    const countParams = [...params];
    params.push(parseInt(limit), parseInt(offset));
    const { rows } = await pool.query(
      `SELECT c.*, r.url as recording_url FROM calls c
       LEFT JOIN recordings r ON r.call_id = c.id
       WHERE c.org_id=$1${filter}
       ORDER BY c.started_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM calls c WHERE c.org_id=$1${filter}`,
      countParams
    );
    res.json({ calls: rows, total: parseInt(count) });
  } catch (err) {
    console.error('GET /calls error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: [call] } = await pool.query(
      `SELECT c.*, r.url as recording_url, r.transcript FROM calls c
       LEFT JOIN recordings r ON r.call_id = c.id
       WHERE c.id=$1 AND c.org_id=$2`,
      [req.params.id, req.orgId]
    );
    if (!call) return res.status(404).json({ error: 'Not found' });
    res.json(call);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
