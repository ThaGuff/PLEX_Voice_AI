const router = require('express').Router();
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const axios = require('axios');
router.use(requireAuth);

router.get('/', async(req,res)=>{ try{ const{rows}=await pool.query('SELECT provider,is_active,last_sync,config FROM integrations WHERE org_id=$1',[req.orgId]);res.json(rows);}catch(e){res.status(500).json({error:e.message})}});

// Test integration connectivity
router.post('/test/:provider', async(req,res)=>{ 
  try{ 
    const { provider } = req.params;
    const { rows:[org] } = await pool.query('SELECT * FROM organizations WHERE id=$1',[req.orgId]);
    let result = { connected: false, message: '' };
    if (provider==='elevenlabs' && org.elevenlabs_api_key) {
      const r = await axios.get('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':org.elevenlabs_api_key}});
      result = { connected: true, message: `${r.data.voices?.length||0} voices available` };
    } else if (provider==='openai' && org.openai_api_key) {
      result = { connected: true, message: 'OpenAI API key configured' };
    } else if (provider==='twilio' && org.twilio_account_sid) {
      result = { connected: true, message: `Phone: ${org.twilio_phone_number||'Not set'}` };
    } else if (provider==='ghl' && org.ghl_api_key) {
      result = { connected: true, message: `Location: ${org.ghl_location_id||'Not set'}` };
    } else {
      result = { connected: false, message: 'Not configured — add API key in Settings' };
    }
    res.json(result);
  } catch(e){ res.json({ connected: false, message: e.message }); }
});

// Get ElevenLabs voices
router.get('/elevenlabs/voices', async(req,res)=>{
  try{
    const{rows:[org]}=await pool.query('SELECT elevenlabs_api_key FROM organizations WHERE id=$1',[req.orgId]);
    if(!org?.elevenlabs_api_key) return res.json({ voices:[] });
    const r = await axios.get('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':org.elevenlabs_api_key}});
    res.json({ voices: r.data.voices||[] });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports=router;
