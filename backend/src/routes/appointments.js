const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, c.email as contact_email FROM appointments a
       LEFT JOIN contacts c ON c.id=a.contact_id
       WHERE a.org_id=$1 ORDER BY a.scheduled_at ASC`, [req.orgId]
    );
    res.json(rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { contact_name,contact_phone,contact_email,service_type,scheduled_at,duration_minutes,notes,booked_via,title } = req.body;
    const { rows:[appt] } = await pool.query(
      `INSERT INTO appointments(org_id,contact_name,contact_phone,contact_email,service_type,scheduled_at,duration_minutes,notes,booked_via,title,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'confirmed') RETURNING *`,
      [req.orgId,contact_name,contact_phone,contact_email,service_type,scheduled_at,duration_minutes||60,notes,booked_via||'manual',title||service_type]
    );
    res.json(appt);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, scheduled_at, notes } = req.body;
    const { rows:[appt] } = await pool.query(
      `UPDATE appointments SET status=COALESCE($1,status), scheduled_at=COALESCE($2,scheduled_at),
       notes=COALESCE($3,notes), updated_at=NOW() WHERE id=$4 AND org_id=$5 RETURNING *`,
      [status, scheduled_at, notes, req.params.id, req.orgId]
    );
    res.json(appt);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
