const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = `NOW() - INTERVAL '${days} days'`;
    const [calls, appts, vms, contacts, recovered] = await Promise.all([
      pool.query(`SELECT COUNT(*), outcome FROM calls WHERE org_id=$1 AND started_at>${since} GROUP BY outcome`, [req.orgId]),
      pool.query(`SELECT COUNT(*) FROM appointments WHERE org_id=$1 AND created_at>${since}`, [req.orgId]),
      pool.query(`SELECT COUNT(*) FROM voicemails WHERE org_id=$1 AND created_at>${since}`, [req.orgId]),
      pool.query(`SELECT COUNT(*) FROM contacts WHERE org_id=$1 AND created_at>${since}`, [req.orgId]),
      pool.query(`SELECT COUNT(*) FROM voicemails WHERE org_id=$1 AND sms_recovery_sent=true AND created_at>${since}`, [req.orgId]),
    ]);
    const byOutcome = {};
    let totalCalls = 0;
    calls.rows.forEach(r => { byOutcome[r.outcome]=parseInt(r.count); totalCalls+=parseInt(r.count); });
    const answered = byOutcome.answered||0;
    res.json({
      totalCalls, byOutcome,
      appointments: parseInt(appts.rows[0].count),
      voicemails: parseInt(vms.rows[0].count),
      newContacts: parseInt(contacts.rows[0].count),
      smsRecoveries: parseInt(recovered.rows[0].count),
      answerRate: totalCalls ? Math.round(answered/totalCalls*100) : 0,
    });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/calls-over-time', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const { rows } = await pool.query(
      `SELECT DATE_TRUNC('day', started_at) as day, COUNT(*) as total,
              COUNT(*) FILTER (WHERE outcome='answered') as answered,
              COUNT(*) FILTER (WHERE outcome='booked') as booked,
              COUNT(*) FILTER (WHERE outcome='missed') as missed
       FROM calls WHERE org_id=$1 AND started_at > NOW()-INTERVAL '${days} days'
       GROUP BY day ORDER BY day`, [req.orgId]
    );
    res.json(rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
