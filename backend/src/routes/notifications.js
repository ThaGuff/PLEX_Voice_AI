const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);
router.get('/', async(req,res)=>{ try{ const{rows}=await pool.query('SELECT * FROM notifications WHERE org_id=$1 ORDER BY created_at DESC LIMIT 50',[req.orgId]);const{rows:[{count}]}=await pool.query('SELECT COUNT(*) FROM notifications WHERE org_id=$1 AND is_read=false',[req.orgId]);res.json({notifications:rows,unread:parseInt(count)});}catch(e){res.status(500).json({error:e.message})}});
router.put('/read-all', async(req,res)=>{ try{ await pool.query('UPDATE notifications SET is_read=true WHERE org_id=$1',[req.orgId]);res.json({ok:true});}catch(e){res.status(500).json({error:e.message})}});
module.exports=router;
