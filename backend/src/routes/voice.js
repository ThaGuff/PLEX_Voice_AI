const router = require('express').Router();
const twilio = require('twilio');
const { pool } = require('../db/pool');
const { generateAIResponse } = require('../services/ai');
const { sendSMSNotification, sendEmailNotification } = require('../services/notifications');
const { syncCallToCRM } = require('../services/crm');
const { broadcastEvent } = require('../services/websocket');

const VoiceResponse = twilio.twiml.VoiceResponse;

// Resolve org from Twilio phone number
async function resolveOrg(toNumber) {
  const { rows } = await pool.query(
    'SELECT o.*, a.* FROM organizations o JOIN agents a ON a.org_id=o.id WHERE o.twilio_phone_number=$1 AND a.is_active=true LIMIT 1',
    [toNumber]
  );
  return rows[0] || null;
}

// POST /voice/inbound — Twilio calls this when your number receives a call
router.post('/inbound', async (req, res) => {
  const twiml = new VoiceResponse();
  const { To, From, CallSid } = req.body;

  try {
    const config = await resolveOrg(To);
    if (!config) {
      twiml.say('Sorry, this number is not configured. Goodbye.');
      twiml.hangup();
      return res.type('text/xml').send(twiml.toString());
    }

    // Log the call
    await pool.query(
      `INSERT INTO calls(org_id, agent_id, twilio_call_sid, caller_phone, direction, outcome)
       VALUES($1,$2,$3,$4,'inbound','in-progress')
       ON CONFLICT (twilio_call_sid) DO NOTHING`,
      [config.org_id, config.id, CallSid, From]
    );

    // Broadcast live call event
    broadcastEvent(config.org_id, { type: 'call_started', callSid: CallSid, from: From });

    const greeting = config.greeting || 'Thank you for calling. How can I help you today?';

    // Start the conversation with Gather (speech input)
    const gather = twiml.gather({
      input: 'speech',
      action: `/voice/respond?orgId=${config.org_id}&callSid=${CallSid}`,
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
    });
    gather.say({ voice: 'Polly.Joanna-Neural' }, greeting);

    // Fallback if no input
    twiml.redirect(`/voice/voicemail?orgId=${config.org_id}&callSid=${CallSid}`);
  } catch (err) {
    console.error('Inbound error:', err);
    twiml.say('We\'re experiencing technical difficulties. Please try again later.');
  }

  res.type('text/xml').send(twiml.toString());
});

// POST /voice/respond — Handles ongoing speech turns
router.post('/respond', async (req, res) => {
  const twiml = new VoiceResponse();
  const { orgId, callSid } = req.query;
  const { SpeechResult, Confidence } = req.body;

  try {
    // Get org + agent config
    const { rows } = await pool.query(
      `SELECT o.*, a.id as agent_id, a.name as agent_name, a.features, a.transfer_number
       FROM organizations o JOIN agents a ON a.org_id=o.id
       WHERE o.id=$1 AND a.is_active=true LIMIT 1`,
      [orgId]
    );
    const config = rows[0];
    if (!config || !SpeechResult) {
      twiml.redirect(`/voice/voicemail?orgId=${orgId}&callSid=${callSid}`);
      return res.type('text/xml').send(twiml.toString());
    }

    // Get FAQs for context
    const { rows: faqs } = await pool.query(
      'SELECT question, answer FROM faqs WHERE org_id=$1 ORDER BY usage_count DESC LIMIT 20',
      [orgId]
    );

    // Generate AI response
    const aiResult = await generateAIResponse({
      userInput: SpeechResult,
      orgName: config.name,
      faqs,
      features: config.features,
    });

    // Handle intent
    if (aiResult.intent === 'transfer' && config.features?.transfer) {
      const gather = twiml.gather({
        input: 'speech',
        action: `/voice/confirm-transfer?orgId=${orgId}&callSid=${callSid}&transferTo=${config.transfer_number}`,
        method: 'POST',
        speechTimeout: 'auto',
      });
      gather.say({ voice: 'Polly.Joanna-Neural' }, 'I\'ll transfer you to our team now. One moment please.');
    } else if (aiResult.intent === 'book_appointment' && config.features?.booking) {
      const gather = twiml.gather({
        input: 'speech',
        action: `/voice/booking?orgId=${orgId}&callSid=${callSid}`,
        method: 'POST',
        speechTimeout: 'auto',
      });
      gather.say({ voice: 'Polly.Joanna-Neural' }, aiResult.response);
    } else if (aiResult.intent === 'voicemail') {
      twiml.redirect(`/voice/voicemail?orgId=${orgId}&callSid=${callSid}`);
    } else {
      // Normal FAQ/conversation response — continue gathering
      const gather = twiml.gather({
        input: 'speech',
        action: `/voice/respond?orgId=${orgId}&callSid=${callSid}`,
        method: 'POST',
        speechTimeout: 'auto',
      });
      gather.say({ voice: 'Polly.Joanna-Neural' }, aiResult.response);
      twiml.redirect(`/voice/voicemail?orgId=${orgId}&callSid=${callSid}`);
    }

    // Update call intent scores
    await pool.query(
      'UPDATE calls SET intent_scores=$1 WHERE twilio_call_sid=$2',
      [JSON.stringify(aiResult.intentScores || {}), callSid]
    );

  } catch (err) {
    console.error('Respond error:', err);
    twiml.say({ voice: 'Polly.Joanna-Neural' }, 'I apologize, let me connect you with our team.');
    twiml.hangup();
  }

  res.type('text/xml').send(twiml.toString());
});

// POST /voice/voicemail — Record a voicemail
router.post('/voicemail', async (req, res) => {
  const twiml = new VoiceResponse();
  const { orgId, callSid } = req.query;

  twiml.say({ voice: 'Polly.Joanna-Neural' },
    'Please leave a message after the tone and we\'ll get back to you as soon as possible.');
  twiml.record({
    action: `/voice/voicemail-complete?orgId=${orgId}&callSid=${callSid}`,
    method: 'POST',
    maxLength: 120,
    transcribe: true,
    transcribeCallback: `/voice/transcribe?orgId=${orgId}&callSid=${callSid}`,
  });
  twiml.say({ voice: 'Polly.Joanna-Neural' }, 'We did not receive a recording. Goodbye.');
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
});

// POST /voice/voicemail-complete
router.post('/voicemail-complete', async (req, res) => {
  const { orgId, callSid } = req.query;
  const { RecordingUrl, RecordingDuration, RecordingSid } = req.body;
  const twiml = new VoiceResponse();

  try {
    // Get caller phone from call
    const { rows: [call] } = await pool.query(
      'SELECT * FROM calls WHERE twilio_call_sid=$1', [callSid]
    );

    if (call) {
      // Save voicemail
      const { rows: [vm] } = await pool.query(
        `INSERT INTO voicemails(org_id, call_id, caller_phone, recording_url, duration_seconds)
         VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [orgId, call.id, call.caller_phone, RecordingUrl, parseInt(RecordingDuration) || 0]
      );

      // Update call outcome
      await pool.query(
        "UPDATE calls SET outcome='voicemail' WHERE twilio_call_sid=$1", [callSid]
      );

      // Get org for notifications
      const { rows: [org] } = await pool.query('SELECT * FROM organizations WHERE id=$1', [orgId]);

      // SMS recovery to caller
      if (org?.twilio_phone_number && call.caller_phone) {
        await sendSMSNotification(org, call.caller_phone,
          `Hi! We missed your call. We'll get back to you shortly. – ${org.name}`);
        await pool.query('UPDATE voicemails SET sms_recovery_sent=true WHERE id=$1', [vm.id]);
      }

      // Notify team
      await createNotification(orgId, 'voicemail', 'New Voicemail',
        `Voicemail from ${call.caller_phone}`, vm.id);

      broadcastEvent(orgId, { type: 'voicemail_received', voicemailId: vm.id, from: call.caller_phone });
    }
  } catch (err) {
    console.error('Voicemail complete error:', err);
  }

  twiml.say({ voice: 'Polly.Joanna-Neural' }, 'Thank you for your message. We\'ll be in touch soon. Goodbye!');
  twiml.hangup();
  res.type('text/xml').send(twiml.toString());
});

// POST /voice/transcribe — Twilio transcription callback
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
  const { CallSid, CallStatus, CallDuration, To } = req.body;

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
      [outcome, parseInt(CallDuration) || 0, CallSid]
    );

    const { rows: [org] } = await pool.query(
      'SELECT * FROM organizations WHERE id=$1', [call.org_id]
    );

    // Missed call handling
    if (outcome === 'missed' && org) {
      await sendSMSNotification(org, call.caller_phone,
        `Hi! We missed your call at ${org.name}. We'll reach out to you shortly!`);
      await createNotification(call.org_id, 'missed_call', 'Missed Call',
        `Missed call from ${call.caller_phone}`, call.id);
      broadcastEvent(call.org_id, { type: 'call_missed', from: call.caller_phone });
    }

    // CRM sync
    if (org?.ghl_api_key && !call.crm_synced) {
      syncCallToCRM(call, org).catch(console.error);
    }

    broadcastEvent(call.org_id, { type: 'call_ended', callSid: CallSid, outcome, duration: CallDuration });
  } catch (err) {
    console.error('Status callback error:', err);
  }

  res.sendStatus(200);
});

async function createNotification(orgId, type, title, body, refId) {
  await pool.query(
    'INSERT INTO notifications(org_id, type, title, body, reference_id) VALUES($1,$2,$3,$4,$5)',
    [orgId, type, title, body, refId]
  );
}

module.exports = router;
