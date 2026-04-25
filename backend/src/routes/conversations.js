const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);
router.get('/', async(req,res)=>{ try{ const{rows}=await pool.query(`SELECT cv.*,c.name as contact_name,c.phone as contact_phone FROM conversations cv LEFT JOIN contacts c ON c.id=cv.contact_id WHERE cv.org_id=$1 ORDER BY cv.last_message_at DESC NULLS LAST`,[req.orgId]);res.json(rows);}catch(e){res.status(500).json({error:e.message})}});
router.get('/:id/messages', async(req,res)=>{ try{ const{rows}=await pool.query('SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at',[req.params.id]);res.json(rows);}catch(e){res.status(500).json({error:e.message})}});
router.post('/:id/messages', async(req,res)=>{ try{ const{body,direction='outbound'}=req.body;const{rows:[m]}=await pool.query('INSERT INTO messages(conversation_id,org_id,body,direction) VALUES($1,$2,$3,$4) RETURNING *',[req.params.id,req.orgId,body,direction]);await pool.query('UPDATE conversations SET last_message=$1,last_message_at=NOW() WHERE id=$2',[body,req.params.id]);res.json(m);}catch(e){res.status(500).json({error:e.message})}});
module.exports=router;
