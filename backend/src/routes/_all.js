// appointments.js
const { Router } = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { sendSMSNotification } = require('../services/notifications');

const apptRouter = Router();
apptRouter.use(requireAuth);

apptRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM appointments WHERE org_id=$1 ORDER BY scheduled_at ASC',
    [req.orgId]
  );
  res.json(rows);
});

apptRouter.post('/', async (req, res) => {
  const { contact_name, contact_phone, service_type, scheduled_at, notes, booked_via } = req.body;
  const { rows: [appt] } = await pool.query(
    `INSERT INTO appointments(org_id, contact_name, contact_phone, service_type, scheduled_at, notes, booked_via, status)
     VALUES($1,$2,$3,$4,$5,$6,$7,'confirmed') RETURNING *`,
    [req.orgId, contact_name, contact_phone, service_type, scheduled_at, notes, booked_via || 'manual']
  );
  // SMS confirmation
  const { rows: [org] } = await pool.query('SELECT * FROM organizations WHERE id=$1', [req.orgId]);
  if (org?.twilio_phone_number) {
    const d = new Date(scheduled_at);
    await sendSMSNotification(org, contact_phone,
      `Hi ${contact_name}! Your ${service_type} appointment is confirmed for ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. – ${org.name}`
    );
    await pool.query('UPDATE appointments SET sms_sent=true WHERE id=$1', [appt.id]);
  }
  res.json(appt);
});

apptRouter.put('/:id', async (req, res) => {
  const { status, scheduled_at, notes } = req.body;
  const { rows: [appt] } = await pool.query(
    `UPDATE appointments SET status=COALESCE($1,status), scheduled_at=COALESCE($2,scheduled_at),
     notes=COALESCE($3,notes), updated_at=NOW() WHERE id=$4 AND org_id=$5 RETURNING *`,
    [status, scheduled_at, notes, req.params.id, req.orgId]
  );
  res.json(appt);
});

apptRouter.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM appointments WHERE id=$1 AND org_id=$2', [req.params.id, req.orgId]);
  res.json({ deleted: true });
});

// ── Agents ────────────────────────────────────────────────────────────────────
const agentRouter = Router();
agentRouter.use(requireAuth);

agentRouter.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM agents WHERE org_id=$1', [req.orgId]);
  res.json(rows);
});

agentRouter.put('/:id', async (req, res) => {
  const { name, voice_style, greeting, after_hours_msg, business_hours, features, transfer_number } = req.body;
  const { rows: [agent] } = await pool.query(
    `UPDATE agents SET name=COALESCE($1,name), voice_style=COALESCE($2,voice_style),
     greeting=COALESCE($3,greeting), after_hours_msg=COALESCE($4,after_hours_msg),
     business_hours=COALESCE($5,business_hours), features=COALESCE($6,features),
     transfer_number=COALESCE($7,transfer_number), updated_at=NOW()
     WHERE id=$8 AND org_id=$9 RETURNING *`,
    [name, voice_style, greeting, after_hours_msg,
     business_hours ? JSON.stringify(business_hours) : null,
     features ? JSON.stringify(features) : null,
     transfer_number, req.params.id, req.orgId]
  );
  res.json(agent);
});

// ── FAQs ──────────────────────────────────────────────────────────────────────
const faqRouter = Router();
faqRouter.use(requireAuth);

faqRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM faqs WHERE org_id=$1 ORDER BY usage_count DESC', [req.orgId]
  );
  res.json(rows);
});

faqRouter.post('/', async (req, res) => {
  const { question, answer, category } = req.body;
  const { rows: [faq] } = await pool.query(
    'INSERT INTO faqs(org_id, question, answer, category) VALUES($1,$2,$3,$4) RETURNING *',
    [req.orgId, question, answer, category || 'general']
  );
  res.json(faq);
});

faqRouter.put('/:id', async (req, res) => {
  const { question, answer, category } = req.body;
  const { rows: [faq] } = await pool.query(
    'UPDATE faqs SET question=COALESCE($1,question), answer=COALESCE($2,answer), category=COALESCE($3,category) WHERE id=$4 AND org_id=$5 RETURNING *',
    [question, answer, category, req.params.id, req.orgId]
  );
  res.json(faq);
});

faqRouter.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM faqs WHERE id=$1 AND org_id=$2', [req.params.id, req.orgId]);
  res.json({ deleted: true });
});

// ── Analytics ─────────────────────────────────────────────────────────────────
const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get('/summary', async (req, res) => {
  const { days = 30 } = req.query;
  const since = `NOW() - INTERVAL '${parseInt(days)} days'`;
  const [calls, appts, vms, recovered] = await Promise.all([
    pool.query(`SELECT COUNT(*), outcome FROM calls WHERE org_id=$1 AND started_at > ${since} GROUP BY outcome`, [req.orgId]),
    pool.query(`SELECT COUNT(*) FROM appointments WHERE org_id=$1 AND created_at > ${since}`, [req.orgId]),
    pool.query(`SELECT COUNT(*) FROM voicemails WHERE org_id=$1 AND created_at > ${since}`, [req.orgId]),
    pool.query(`SELECT COUNT(*) FROM voicemails WHERE org_id=$1 AND sms_recovery_sent=true AND created_at > ${since}`, [req.orgId]),
  ]);

  const callsByOutcome = {};
  calls.rows.forEach(r => { callsByOutcome[r.outcome] = parseInt(r.count); });
  const totalCalls = Object.values(callsByOutcome).reduce((a, b) => a + b, 0);

  res.json({
    totalCalls,
    callsByOutcome,
    appointments: parseInt(appts.rows[0].count),
    voicemails: parseInt(vms.rows[0].count),
    smsRecoveries: parseInt(recovered.rows[0].count),
    answerRate: totalCalls ? Math.round((callsByOutcome.answered || 0) / totalCalls * 100) : 0,
  });
});

analyticsRouter.get('/calls-over-time', async (req, res) => {
  const { days = 14 } = req.query;
  const { rows } = await pool.query(
    `SELECT DATE_TRUNC('day', started_at) as day, COUNT(*) as count
     FROM calls WHERE org_id=$1 AND started_at > NOW() - INTERVAL '${parseInt(days)} days'
     GROUP BY day ORDER BY day ASC`,
    [req.orgId]
  );
  res.json(rows);
});

// ── Notifications ─────────────────────────────────────────────────────────────
const notifRouter = Router();
notifRouter.use(requireAuth);

notifRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE org_id=$1 ORDER BY created_at DESC LIMIT 50',
    [req.orgId]
  );
  const { rows: [{ count }] } = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE org_id=$1 AND is_read=false', [req.orgId]
  );
  res.json({ notifications: rows, unread: parseInt(count) });
});

notifRouter.put('/read-all', async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=true WHERE org_id=$1', [req.orgId]);
  res.json({ ok: true });
});

// ── Voicemails ────────────────────────────────────────────────────────────────
const vmRouter = Router();
vmRouter.use(requireAuth);

vmRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM voicemails WHERE org_id=$1 ORDER BY created_at DESC',
    [req.orgId]
  );
  res.json(rows);
});

vmRouter.put('/:id/read', async (req, res) => {
  const { rows: [vm] } = await pool.query(
    'UPDATE voicemails SET is_read=true WHERE id=$1 AND org_id=$2 RETURNING *',
    [req.params.id, req.orgId]
  );
  res.json(vm);
});

// ── Recordings ────────────────────────────────────────────────────────────────
const recRouter = Router();
recRouter.use(requireAuth);

recRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*, c.caller_phone, c.caller_name, c.call_type, c.outcome
     FROM recordings r JOIN calls c ON c.id=r.call_id
     WHERE r.org_id=$1 ORDER BY r.created_at DESC`,
    [req.orgId]
  );
  res.json(rows);
});

// ── CRM ───────────────────────────────────────────────────────────────────────
const crmRouter = Router();
crmRouter.use(requireAuth);

crmRouter.post('/sync-call/:callId', async (req, res) => {
  const { rows: [call] } = await pool.query('SELECT * FROM calls WHERE id=$1 AND org_id=$2', [req.params.callId, req.orgId]);
  if (!call) return res.status(404).json({ error: 'Not found' });
  const { rows: [org] } = await pool.query('SELECT * FROM organizations WHERE id=$1', [req.orgId]);
  const { syncCallToCRM } = require('../services/crm');
  const contactId = await syncCallToCRM(call, org);
  res.json({ synced: true, contactId });
});

module.exports = { apptRouter, agentRouter, faqRouter, analyticsRouter, notifRouter, vmRouter, recRouter, crmRouter };
