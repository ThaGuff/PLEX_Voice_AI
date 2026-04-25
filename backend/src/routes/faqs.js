const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);
router.get('/', async(req,res)=>{ try{ const{rows}=await pool.query('SELECT * FROM faqs WHERE org_id=$1 AND is_active=true ORDER BY usage_count DESC',[req.orgId]);res.json(rows);}catch(e){res.status(500).json({error:e.message})}});
router.post('/', async(req,res)=>{ try{ const{question,answer,category}=req.body;const{rows:[f]}=await pool.query('INSERT INTO faqs(org_id,question,answer,category) VALUES($1,$2,$3,$4) RETURNING *',[req.orgId,question,answer,category||'general']);res.json(f);}catch(e){res.status(500).json({error:e.message})}});
router.put('/:id', async(req,res)=>{ try{ const{question,answer,category,is_active}=req.body;const{rows:[f]}=await pool.query('UPDATE faqs SET question=COALESCE($1,question),answer=COALESCE($2,answer),category=COALESCE($3,category),is_active=COALESCE($4,is_active) WHERE id=$5 AND org_id=$6 RETURNING *',[question,answer,category,is_active,req.params.id,req.orgId]);res.json(f);}catch(e){res.status(500).json({error:e.message})}});
router.delete('/:id', async(req,res)=>{ try{ await pool.query('DELETE FROM faqs WHERE id=$1 AND org_id=$2',[req.params.id,req.orgId]);res.json({deleted:true});}catch(e){res.status(500).json({error:e.message})}});
module.exports=router;
