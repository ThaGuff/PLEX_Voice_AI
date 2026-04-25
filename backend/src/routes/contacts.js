const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { limit=50, offset=0, status, search } = req.query;
    const params = [req.orgId];
    let where = 'WHERE org_id=$1';
    if (status) { params.push(status); where += ` AND status=$${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`; }
    const lp = [...params, parseInt(limit), parseInt(offset)];
    const { rows } = await pool.query(
      `SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT $${lp.length-1} OFFSET $${lp.length}`, lp
    );
    const { rows:[{count}] } = await pool.query(`SELECT COUNT(*) FROM contacts ${where}`, params);
    res.json({ contacts: rows, total: parseInt(count) });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, company, tags, status, source, notes } = req.body;
    const { rows:[contact] } = await pool.query(
      `INSERT INTO contacts(org_id,name,phone,email,company,tags,status,source,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.orgId,name,phone,email,company,tags||[],status||'new',source||'manual',notes]
    );
    res.json(contact);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['name','phone','email','company','address','city','state','zip','tags','status','pipeline_stage','notes','lead_score'];
    const sets = [], vals = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f}=$${vals.length}`); }
    });
    vals.push(req.params.id, req.orgId);
    const { rows:[c] } = await pool.query(
      `UPDATE contacts SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${vals.length-1} AND org_id=$${vals.length} RETURNING *`, vals
    );
    res.json(c);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id=$1 AND org_id=$2', [req.params.id, req.orgId]);
    res.json({ deleted: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
