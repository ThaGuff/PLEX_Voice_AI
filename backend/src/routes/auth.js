const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const sign = (u,o) => jwt.sign({userId:u,orgId:o},process.env.JWT_SECRET,{expiresIn:'30d'});
router.post('/register', async (req,res) => {
  const {name,email,password,orgName}=req.body;
  if(!name||!email||!password||!orgName) return res.status(400).json({error:'All fields required'});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const{rows:ex}=await client.query('SELECT id FROM users WHERE email=$1',[email]);
    if(ex.length) return res.status(409).json({error:'Email already registered'});
    const slug=orgName.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').slice(0,40)+'-'+Date.now();
    const{rows:[org]}=await client.query('INSERT INTO organizations(name,slug) VALUES($1,$2) RETURNING *',[orgName,slug]);
    await client.query('INSERT INTO agents(org_id,name) VALUES($1,$2)',[org.id,'ARIA']);
    const hash=await bcrypt.hash(password,12);
    const{rows:[user]}=await client.query("INSERT INTO users(org_id,email,password_hash,name,role) VALUES($1,$2,$3,$4,'owner') RETURNING id,name,email,role,org_id",[org.id,email,hash,name]);
    await client.query('COMMIT');
    res.json({token:sign(user.id,org.id),user:{id:user.id,name:user.name,email:user.email,role:user.role},org});
  } catch(err) { await client.query('ROLLBACK'); res.status(500).json({error:err.message}); } finally {client.release();}
});
router.post('/login', async (req,res) => {
  try {
    const{email,password}=req.body;
    const{rows}=await pool.query('SELECT u.*,o.name as org_name,o.slug,o.plan,o.twilio_phone_number FROM users u JOIN organizations o ON u.org_id=o.id WHERE u.email=$1',[email]);
    if(!rows.length) return res.status(401).json({error:'Invalid credentials'});
    const user=rows[0];
    if(!await bcrypt.compare(password,user.password_hash)) return res.status(401).json({error:'Invalid credentials'});
    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1',[user.id]);
    res.json({token:sign(user.id,user.org_id),user:{id:user.id,name:user.name,email:user.email,role:user.role},org:{id:user.org_id,name:user.org_name,slug:user.slug,plan:user.plan,twilio_phone_number:user.twilio_phone_number}});
  } catch(err){res.status(500).json({error:err.message});}
});
router.get('/me', requireAuth, async (req,res) => {
  try { const{rows:[org]}=await pool.query('SELECT * FROM organizations WHERE id=$1',[req.orgId]); res.json({user:req.user,org}); }
  catch(err){res.status(500).json({error:err.message});}
});
router.put('/org', requireAuth, async (req,res) => {
  try {
    const allowed=['twilio_account_sid','twilio_auth_token','twilio_phone_number','openai_api_key','elevenlabs_api_key','elevenlabs_voice_id','deepgram_api_key','ghl_api_key','ghl_location_id','hubspot_api_key','notification_email','notification_sms','slack_webhook_url','sendgrid_api_key','google_calendar_id','calendly_api_key','timezone','name'];
    const sets=[],vals=[];
    for(const f of allowed){if(req.body[f]!==undefined){vals.push(req.body[f]);sets.push(f+'=$'+vals.length);}}
    if(!sets.length) return res.status(400).json({error:'Nothing to update'});
    vals.push(req.orgId);
    const{rows:[org]}=await pool.query('UPDATE organizations SET '+sets.join(',')+',updated_at=NOW() WHERE id=$'+vals.length+' RETURNING *',vals);
    res.json(org);
  } catch(err){res.status(500).json({error:err.message});}
});
module.exports = router;
