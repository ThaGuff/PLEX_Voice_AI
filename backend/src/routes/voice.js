const router = require('express').Router();
const twilio = require('twilio');
const { pool } = require('../db/pool');
const { broadcastEvent } = require('../services/websocket');
const VoiceResponse = twilio.twiml.VoiceResponse;

async function getConfig(toNumber) {
  const { rows } = await pool.query(
    `SELECT o.*, a.id as agent_id, a.name as agent_name, a.greeting, a.after_hours_msg,
            a.goodbye_msg, a.system_prompt, a.transfer_number, a.transfer_prompt,
            a.escalation_keywords, a.booking_enabled, a.faq_enabled,
            a.voicemail_enabled, a.sms_followup_enabled, a.sms_followup_template,
            a.voice_provider, a.voice_id, a.silence_timeout
     FROM organizations o
     JOIN agents a ON a.org_id = o.id
     WHERE o.twilio_phone_number = $1 AND a.is_active = true
     LIMIT 1`,
    [toNumber]
  );
  return rows[0] || null;
}

// Choose voice based on config
function getTwimlVoice(config) {
  // Always use Polly for TwiML (ElevenLabs requires streaming)
  return 'Polly.Joanna-Neural';
}

// POST /voice/inbound — Twilio calls this on every inbound call
router.post('/inbound', async (req, res) => {
  const twiml = new VoiceResponse();
  const { To, From, CallSid } = req.body;

  try {
    const config = await getConfig(To);
    if (!config) {
      twiml.say('Sorry, this number is not currently configured. Goodbye.');
      twiml.hangup();
      return res.type('text/xml').send(twiml.toString());
    }

    // Log call
    const { rows: [call] } = await pool.query(
      `INSERT INTO calls(org_id, agent_id, twilio_call_sid, caller_phone, direction, outcome)
       VALUES($1,$2,$3,$4,'inbound','in-progress')
       ON CONFLICT(twilio_call_sid) DO UPDATE SET outcome='in-progress' RETURNING *`,
      [config.id, config.agent_id, CallSid, From]
    );

    // Upsert contact
    try {
      await pool.query(
        `INSERT INTO contacts(org_id, phone, source, last_contact_at)
         VALUES($1,$2,'inbound_call',NOW())
         ON CONFLICT(org_id, phone) DO UPDATE SET last_contact_at=NOW()`,
        [config.id, From]
      );
    } catch(e) { /* non-fatal */ }

    broadcastEvent(config.id, { type: 'call_started', callSid: CallSid, from: From });

    const voice = getTwimlVoice(config);
    const greeting = config.greeting || 'Thank you for calling. How can I help you today?';

    const gather = twiml.gather({
      input: 'speech',
      action: `/voice/respond?orgId=${config.id}&callSid=${CallSid}&agentId=${config.agent_id}`,
      method: 'POST',
      speechTimeout: config.silence_timeout || 5,
      language: 'en-US',
    });
    gather.say({ voice }, greeting);
    twiml.redirect(`/voice/voicemail?orgId=${config.id}&callSid=${CallSid}`);
  } catch (err) {
    console.error('Inbound error:', err.message);
    twiml.say('We are experiencing technical difficulties. Please try again.');
  }

  res.type('text/xml').send(twiml.toString());
});

// POST /voice/respond — handles each speech turn
router.post('/respond', async (req, res) => {
  const twiml = new VoiceResponse();
  const { orgId, callSid, agentId } = req.query;
  const { SpeechResult } = req.body;

  try {
    const { rows: [config] } = await pool.query(
      `SELECT o.*, a.system_prompt, a.transfer_number, a.transfer_prompt,
              a.escalation_keywords, a.booking_enabled, a.faq_enabled,
              a.goodbye_msg, a.silence_timeout, a.voice_id, a.voice_provider
       FROM organizations o JOIN agents a ON a.org_id=o.id
       WHERE o.id=$1 AND a.id=$2 LIMIT 1`,
      [orgId, agentId]
    );

    if (!SpeechResult || !config) {
      twiml.redirect(`/voice/voicemail?orgId=${orgId}&callSid=${callSid}`);
      return res.type('text/xml').send(twiml.toString());
    }

    // Get FAQs for context
    const { rows: faqs } = await pool.query(
      'SELECT question, answer FROM faqs WHERE org_id=$1 AND is_active=true LIMIT 15',
      [orgId]
    );

    // Call OpenAI
    const { generateVoiceResponse } = require('../services/ai');
    const aiResult = await generateVoiceResponse({
      userInput: SpeechResult,
      orgId,
      agentId,
      config,
      faqs,
    });

    const voice = getTwimlVoice(config);

    if (aiResult.intent === 'transfer' && config.transfer_number) {
      twiml.say({ voice }, config.transfer_prompt || 'Let me transfer you now. One moment please.');
      twiml.dial(config.transfer_number);
    } else if (aiResult.intent === 'voicemail') {
      twiml.redirect(`/voice/voicemail?orgId=${orgId}&callSid=${callSid}`);
    } else if (aiResult.intent === 'goodbye') {
      twiml.say({ voice }, config.goodbye_msg || 'Thank you for calling. Have a great day!');
      twiml.hangup();
    } else {
      const gather = twiml.gather({
        input: 'speech',
        action: `/voice/respond?orgId=${orgId}&callSid=${callSid}&agentId=${agentId}`,
        method: 'POST',
        speechTimeout: config.silence_timeout || 5,
        language: 'en-US',
      });
      gather.say({ voice }, aiResult.response);
      twiml.redirect(`/voice/voicemail?orgId=${orgId}&callSid=${callSid}`);
    }

    // Update call with intent scores
    if (aiResult.intentScores) {
      await pool.query(
        'UPDATE calls SET intent_scores=$1 WHERE twilio_call_sid=$2',
        [JSON.stringify(aiResult.intentScores), callSid]
      );
    }

  } catch (err) {
    console.error('Respond error:', err.message);
    twiml.say({ voice: 'Polly.Joanna-Neural' }, 'I apologize for the difficulty. Let me connect you with a team member.');
    twiml.hangup();
  }

  res.type('text/xml').send(twiml.toString());
});

// POST /voice/voicemail
router.post('/voicemail', async (req, res) => {
  const twiml = new VoiceResponse();
  const { orgId, callSid } = req.query;

  twiml.say({ voice: 'Polly.Joanna-Neural' },
    'Please leave your message after the tone and we will get back to you as soon as possible.');
  twiml.record({
    action: `/voice/voicemail-complete?orgId=${orgId}&callSid=${callSid}`,
    method: 'POST',
    maxLength: 120,
    transcribe: true,
    transcribeCallback: `/voice/transcribe?callSid=${callSid}`,
    playBeep: true,
  });
  twiml.say({ voice: 'Polly.Joanna-Neural' }, 'We did not receive a recording. Goodbye.');
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
});

// POST /voice/voicemail-complete
router.post('/voicemail-complete', async (req, res) => {
  const twiml = new VoiceResponse();
  const { orgId, callSid } = req.query;
  const { RecordingUrl, RecordingDuration } = req.body;

  try {
    const { rows: [call] } = await pool.query(
      'SELECT * FROM calls WHERE twilio_call_sid=$1', [callSid]
    );
    if (call) {
      await pool.query(
        `INSERT INTO voicemails(org_id, call_id, caller_phone, recording_url, duration_seconds)
         VALUES($1,$2,$3,$4,$5)`,
        [orgId, call.id, call.caller_phone, RecordingUrl, parseInt(RecordingDuration)||0]
      );
      await pool.query(
        "UPDATE calls SET outcome='voicemail' WHERE twilio_call_sid=$1", [callSid]
      );

      // SMS recovery
      const { rows: [org] } = await pool.query('SELECT * FROM organizations WHERE id=$1', [orgId]);
      if (org?.twilio_account_sid && call.caller_phone) {
        try {
          const tc = require('twilio')(org.twilio_account_sid, org.twilio_auth_token);
          const msg = (org.sms_followup_template || 'Hi! We missed your call at {business_name}. We\'ll be in touch shortly!')
            .replace('{business_name}', org.name);
          await tc.messages.create({ body: msg, from: org.twilio_phone_number, to: call.caller_phone });
        } catch(e) { console.error('SMS error:', e.message); }
      }

      broadcastEvent(orgId, { type: 'voicemail_received', from: call.caller_phone });
    }
  } catch (err) {
    console.error('Voicemail complete error:', err.message);
  }

  twiml.say({ voice: 'Polly.Joanna-Neural' }, 'Thank you for your message. We will be in touch soon. Goodbye!');
  twiml.hangup();
  res.type('text/xml').send(twiml.toString());
});

// POST /voice/transcribe — Twilio callback
router.post('/transcribe', async (req, res) => {
  const { callSid } = req.query;
  const { TranscriptionText } = req.body;
  if (TranscriptionText) {
    await pool.query(
      `UPDATE voicemails SET transcript=$1 WHERE call_id=(SELECT id FROM calls WHERE twilio_call_sid=$2)`,
      [TranscriptionText, callSid]
    );
  }
  res.sendStatus(200);
});

// POST /voice/status — Twilio call status callback
router.post('/status', async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  try {
    const { rows: [call] } = await pool.query(
      'SELECT * FROM calls WHERE twilio_call_sid=$1', [CallSid]
    );
    if (!call) return res.sendStatus(200);

    const outcome = CallStatus === 'no-answer' || CallStatus === 'busy' ? 'missed' :
                    call.outcome === 'in-progress' ? 'answered' : call.outcome;

    await pool.query(
      `UPDATE calls SET outcome=$1, duration_seconds=$2, ended_at=NOW()
       WHERE twilio_call_sid=$3`,
      [outcome, parseInt(CallDuration)||0, CallSid]
    );

    if (outcome === 'missed') {
      const { rows: [org] } = await pool.query('SELECT * FROM organizations WHERE id=$1', [call.org_id]);
      if (org?.twilio_account_sid && call.caller_phone) {
        try {
          const tc = require('twilio')(org.twilio_account_sid, org.twilio_auth_token);
          await tc.messages.create({
            body: `Hi! We missed your call at ${org.name}. We'll reach out to you shortly!`,
            from: org.twilio_phone_number, to: call.caller_phone
          });
        } catch(e) { /* non-fatal */ }
      }
      broadcastEvent(call.org_id, { type: 'call_missed', from: call.caller_phone });
    }

    broadcastEvent(call.org_id, { type: 'call_ended', callSid: CallSid, outcome, duration: CallDuration });
  } catch (err) {
    console.error('Status error:', err.message);
  }
  res.sendStatus(200);
});

module.exports = router;
