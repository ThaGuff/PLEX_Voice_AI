const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);
router.get('/', async(req,res)=>{ try{ const{rows}=await pool.query('SELECT * FROM voicemails WHERE org_id=$1 ORDER BY created_at DESC',[req.orgId]);res.json(rows);}catch(e){res.status(500).json({error:e.message})}});
router.put('/:id/read', async(req,res)=>{ try{ const{rows:[v]}=await pool.query('UPDATE voicemails SET is_read=true WHERE id=$1 AND org_id=$2 RETURNING *',[req.params.id,req.orgId]);res.json(v);}catch(e){res.status(500).json({error:e.message})}});
module.exports=router;
