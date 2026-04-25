const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { limit=50, offset=0, outcome, type } = req.query;
    const params = [req.orgId];
    let where = 'WHERE c.org_id=$1';
    if (outcome) { params.push(outcome); where += ` AND c.outcome=$${params.length}`; }
    if (type)    { params.push(type);    where += ` AND c.call_type=$${params.length}`; }
    const lp = [...params, parseInt(limit), parseInt(offset)];
    const { rows } = await pool.query(
      `SELECT c.*, co.name as contact_name_resolved FROM calls c
       LEFT JOIN contacts co ON co.id=c.contact_id
       ${where} ORDER BY c.started_at DESC
       LIMIT $${lp.length-1} OFFSET $${lp.length}`, lp
    );
    const { rows:[{count}] } = await pool.query(`SELECT COUNT(*) FROM calls c ${where}`, params);
    res.json({ calls: rows, total: parseInt(count) });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows:[call] } = await pool.query(
      `SELECT c.*, r.url as recording_url, r.transcript as recording_transcript
       FROM calls c LEFT JOIN recordings r ON r.call_id=c.id
       WHERE c.id=$1 AND c.org_id=$2`, [req.params.id, req.orgId]
    );
    if (!call) return res.status(404).json({ error: 'Not found' });
    res.json(call);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
