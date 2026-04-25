const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM agents WHERE org_id=$1 ORDER BY created_at', [req.orgId]);
    res.json(rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows:[agent] } = await pool.query('SELECT * FROM agents WHERE id=$1 AND org_id=$2', [req.params.id, req.orgId]);
    if (!agent) return res.status(404).json({ error: 'Not found' });
    res.json(agent);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, industry, greeting, system_prompt, voice_id, voice_name, voice_provider } = req.body;
    const { rows:[agent] } = await pool.query(
      `INSERT INTO agents(org_id, name, industry, greeting, system_prompt, voice_id, voice_name, voice_provider)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.orgId, name||'ARIA', industry||'general', greeting, system_prompt, voice_id, voice_name, voice_provider||'elevenlabs']
    );
    res.json(agent);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['name','industry','voice_provider','voice_id','voice_name','voice_settings',
      'system_prompt','greeting','after_hours_msg','goodbye_msg','transfer_number','transfer_prompt',
      'escalation_keywords','booking_enabled','faq_enabled','voicemail_enabled',
      'sms_followup_enabled','sms_followup_template','max_call_duration','silence_timeout',
      'workflow','is_active','booking_prompt'];
    const sets = [], vals = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        vals.push(typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f]);
        sets.push(`${f}=$${vals.length}`);
      }
    });
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id, req.orgId);
    const { rows:[agent] } = await pool.query(
      `UPDATE agents SET ${sets.join(',')}, updated_at=NOW()
       WHERE id=$${vals.length-1} AND org_id=$${vals.length} RETURNING *`, vals
    );
    res.json(agent);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
