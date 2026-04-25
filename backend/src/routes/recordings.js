const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);
router.get('/', async(req,res)=>{ try{ const{rows}=await pool.query(`SELECT r.*,c.caller_phone,c.caller_name,c.call_type,c.outcome FROM recordings r JOIN calls c ON c.id=r.call_id WHERE r.org_id=$1 ORDER BY r.created_at DESC`,[req.orgId]);res.json(rows);}catch(e){res.status(500).json({error:e.message})}});
module.exports=router;
