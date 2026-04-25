const router = require('express').Router();
router.post('/ghl', (req,res)=>{ console.log('[GHL Webhook]',req.body); res.json({received:true}); });
router.post('/stripe', (req,res)=>{ console.log('[Stripe Webhook]',req.body); res.json({received:true}); });
module.exports=router;
