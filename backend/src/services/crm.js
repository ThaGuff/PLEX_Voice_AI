const { pool } = require('../db/pool');

async function syncCallToCRM(call, org) {
  if (!org.ghl_api_key) return;

  try {
    const baseUrl = 'https://rest.gohighlevel.com/v1';
    const headers = {
      'Authorization': `Bearer ${org.ghl_api_key}`,
      'Content-Type': 'application/json',
    };

    // Create or find contact
    let contactId = call.crm_contact_id;
    if (!contactId) {
      const searchRes = await fetch(`${baseUrl}/contacts/?query=${encodeURIComponent(call.caller_phone)}`, { headers });
      const searchData = await searchRes.json();

      if (searchData.contacts?.length > 0) {
        contactId = searchData.contacts[0].id;
      } else {
        // Create new contact
        const createRes = await fetch(`${baseUrl}/contacts/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phone: call.caller_phone,
            name: call.caller_name || 'Unknown Caller',
            tags: ['aria-inbound'],
            source: 'ARIA Voice Agent',
          }),
        });
        const created = await createRes.json();
        contactId = created.contact?.id;
      }
    }

    if (!contactId) return;

    // Add call note
    const noteText = `📞 ARIA Voice Call Log
Outcome: ${call.outcome}
Type: ${call.call_type}
Duration: ${call.duration_seconds}s
${call.summary ? `\nSummary: ${call.summary}` : ''}
Handled by ARIA AI Agent`;

    await fetch(`${baseUrl}/contacts/${contactId}/notes/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: noteText }),
    });

    // Tag with outcome
    const tag = `aria-${call.outcome}`;
    await fetch(`${baseUrl}/contacts/${contactId}/tags/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tags: [tag] }),
    });

    // Update DB
    await pool.query(
      'UPDATE calls SET crm_synced=true, crm_contact_id=$1 WHERE id=$2',
      [contactId, call.id]
    );

    console.log(`[CRM] Synced call ${call.id} to contact ${contactId}`);
    return contactId;
  } catch (err) {
    console.error('[CRM sync error]', err.message);
  }
}

async function syncAppointmentToCRM(appt, org) {
  if (!org.ghl_api_key) return;
  try {
    const headers = {
      'Authorization': `Bearer ${org.ghl_api_key}`,
      'Content-Type': 'application/json',
    };
    // Create calendar event in GHL
    const res = await fetch('https://rest.gohighlevel.com/v1/appointments/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        calendarId: org.ghl_calendar_id,
        selectedTimezone: 'America/Chicago',
        startTime: appt.scheduled_at,
        contactId: appt.crm_contact_id,
        title: `${appt.service_type} - ${appt.contact_name}`,
        appointmentStatus: 'confirmed',
      }),
    });
    const data = await res.json();
    if (data.id) {
      await pool.query('UPDATE appointments SET crm_event_id=$1 WHERE id=$2', [data.id, appt.id]);
    }
  } catch (err) {
    console.error('[CRM appt sync error]', err.message);
  }
}

module.exports = { syncCallToCRM, syncAppointmentToCRM };
