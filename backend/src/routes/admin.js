const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
router.use(requireAuth, requireSuperAdmin);

router.get('/stats', async(req,res)=>{
  try{
    const [orgs,users,calls,appts]= await Promise.all([
      pool.query('SELECT COUNT(*),plan FROM organizations GROUP BY plan'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*),outcome FROM calls WHERE started_at>NOW()-INTERVAL '30 days' GROUP BY outcome"),
      pool.query("SELECT COUNT(*) FROM appointments WHERE created_at>NOW()-INTERVAL '30 days'"),
    ]);
    const orgsByPlan={};let totalOrgs=0;
    orgs.rows.forEach(r=>{orgsByPlan[r.plan]=parseInt(r.count);totalOrgs+=parseInt(r.count);});
    const byOutcome={};let totalCalls=0;
    calls.rows.forEach(r=>{byOutcome[r.outcome]=parseInt(r.count);totalCalls+=parseInt(r.count);});
    res.json({totalOrgs,orgsByPlan,totalUsers:parseInt(users.rows[0].count),totalCalls,byOutcome,totalAppointments:parseInt(appts.rows[0].count)});
  }catch(e){res.status(500).json({error:e.message})}
});

router.get('/orgs', async(req,res)=>{
  try{
    const{rows}=await pool.query(`
      SELECT o.*,COUNT(DISTINCT u.id) as user_count,COUNT(DISTINCT c.id) as call_count,MAX(ca.started_at) as last_call_at
      FROM organizations o
      LEFT JOIN users u ON u.org_id=o.id
      LEFT JOIN calls ca ON ca.org_id=o.id
      LEFT JOIN contacts c ON c.org_id=o.id
      GROUP BY o.id ORDER BY o.created_at DESC`);
    res.json(rows);
  }catch(e){res.status(500).json({error:e.message})}
});

router.get('/orgs/:id', async(req,res)=>{
  try{
    const[org,users,calls]= await Promise.all([
      pool.query('SELECT * FROM organizations WHERE id=$1',[req.params.id]),
      pool.query('SELECT id,name,email,role,created_at FROM users WHERE org_id=$1',[req.params.id]),
      pool.query('SELECT * FROM calls WHERE org_id=$1 ORDER BY started_at DESC LIMIT 10',[req.params.id]),
    ]);
    if(!org.rows.length) return res.status(404).json({error:'Not found'});
    res.json({org:org.rows[0],users:users.rows,calls:calls.rows});
  }catch(e){res.status(500).json({error:e.message})}
});

router.put('/orgs/:id', async(req,res)=>{
  try{
    const{plan,name}=req.body;
    const{rows:[org]}=await pool.query('UPDATE organizations SET plan=COALESCE($1,plan),name=COALESCE($2,name),updated_at=NOW() WHERE id=$3 RETURNING *',[plan,name,req.params.id]);
    res.json(org);
  }catch(e){res.status(500).json({error:e.message})}
});

router.get('/users', async(req,res)=>{
  try{
    const{rows}=await pool.query('SELECT u.*,o.name as org_name,o.plan as org_plan FROM users u JOIN organizations o ON u.org_id=o.id ORDER BY u.created_at DESC');
    res.json(rows);
  }catch(e){res.status(500).json({error:e.message})}
});

router.post('/users', async(req,res)=>{
  try{
    const{name,email,password,org_id,role='owner'}=req.body;
    const hash=await bcrypt.hash(password,12);
    const{rows:[u]}=await pool.query('INSERT INTO users(org_id,email,password_hash,name,role) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role,created_at',[org_id,email,hash,name,role]);
    res.json(u);
  }catch(e){res.status(500).json({error:e.message})}
});

router.delete('/users/:id', async(req,res)=>{
  try{ await pool.query('DELETE FROM users WHERE id=$1',[req.params.id]);res.json({deleted:true});}catch(e){res.status(500).json({error:e.message})}
});

router.get('/calls', async(req,res)=>{
  try{
    const{limit=100,org_id}=req.query;const params=[];let where='';
    if(org_id){params.push(org_id);where='WHERE c.org_id=$1';}
    params.push(parseInt(limit));
    const{rows}=await pool.query(`SELECT c.*,o.name as org_name FROM calls c JOIN organizations o ON o.id=c.org_id ${where} ORDER BY c.started_at DESC LIMIT $${params.length}`,params);
    res.json(rows);
  }catch(e){res.status(500).json({error:e.message})}
});

module.exports=router;
