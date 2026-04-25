import { useState, useContext } from 'react';
import { api } from '../lib/api';
import { AuthCtx } from '../App';
import { Card, CardHead, CardBody, Btn, FormGroup, Alert, Toggle, Tabs, SectionHead, CopyField } from '../components/UI';

export default function Settings() {
  const { org, setOrg, user } = useContext(AuthCtx);
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({
    name: org?.name||'',
    twilio_account_sid: org?.twilio_account_sid||'',
    twilio_auth_token: org?.twilio_auth_token||'',
    twilio_phone_number: org?.twilio_phone_number||'',
    openai_api_key: org?.openai_api_key||'',
    elevenlabs_api_key: org?.elevenlabs_api_key||'',
    deepgram_api_key: org?.deepgram_api_key||'',
    ghl_api_key: org?.ghl_api_key||'',
    ghl_location_id: org?.ghl_location_id||'',
    hubspot_api_key: org?.hubspot_api_key||'',
    sendgrid_api_key: org?.sendgrid_api_key||'',
    slack_webhook_url: org?.slack_webhook_url||'',
    notification_email: org?.notification_email||'',
    notification_sms: org?.notification_sms||'',
    google_calendar_id: org?.google_calendar_id||'',
    timezone: org?.timezone||'America/Chicago',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState('');
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    setSaving(true); setSaved('');
    try {
      const updated = await api.updateOrg(form);
      setOrg(o=>({...o,...updated}));
      setSaved('Saved successfully!');
      setTimeout(()=>setSaved(''),3000);
    } catch(e){ setSaved('Error: '+e.message); }
    finally { setSaving(false); }
  };

  const F = ({ label, k, type='text', placeholder, hint, secret, mono }) => (
    <FormGroup label={label} hint={hint}>
      <input type={secret?'password':type} value={form[k]} onChange={e=>setF(k,e.target.value)} placeholder={placeholder}
        style={mono?{fontFamily:'var(--font-mono)',fontSize:12}:{}}/>
    </FormGroup>
  );

  const origin = window.location.origin;

  const tabs = [
    {key:'general',label:'General'},
    {key:'telephony',label:'📞 Telephony'},
    {key:'ai',label:'🤖 AI & Voice'},
    {key:'crm',label:'🔗 CRM'},
    {key:'notifications',label:'🔔 Notifications'},
    {key:'calendar',label:'📅 Calendar'},
    {key:'billing',label:'💳 Billing'},
    {key:'team',label:'👤 Team'},
  ];

  return (
    <div>
      <SectionHead
        title="Settings"
        desc="Configure your ARIA platform integrations and preferences"
        action={
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {saved && <span style={{fontSize:12,color:saved.startsWith('Error')?'var(--red)':'var(--green)',fontWeight:500}}>{saved}</span>}
            <Btn variant="primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Changes'}</Btn>
          </div>
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab}/>

      {/* ── GENERAL ── */}
      {tab==='general' && (
        <div style={{maxWidth:560}}>
          <Card>
            <CardHead title="Organization" subtitle="Basic business information"/>
            <CardBody>
              <F label="Business Name" k="name" placeholder="S&S Maintenance HVAC"/>
              <FormGroup label="Timezone">
                <select value={form.timezone} onChange={e=>setF('timezone',e.target.value)}>
                  {['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu'].map(tz=><option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
                </select>
              </FormGroup>
              <div style={{padding:'12px 14px',background:'var(--bg-2)',border:'1.5px solid var(--border)',borderRadius:'var(--r-sm)'}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>Current Plan</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:14,textTransform:'capitalize'}}>{org?.plan||'Starter'}</span>
                    <span style={{fontSize:12,color:'var(--text-3)',marginLeft:8}}>
                      {org?.plan==='starter'?'$297/mo':org?.plan==='pro'?'$597/mo':org?.plan==='agency'?'$997/mo':'Custom'}
                    </span>
                  </div>
                  <Btn size="sm" variant="amber" onClick={()=>setTab('billing')}>Upgrade Plan</Btn>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── TELEPHONY ── */}
      {tab==='telephony' && (
        <div style={{maxWidth:600}}>
          <Alert type="info" style={{marginBottom:16}}>
            <strong>Step 1:</strong> Enter your Twilio credentials below and save.<br/>
            <strong>Step 2:</strong> In Twilio Console → Phone Numbers → your number → Voice, set:
            <br/><code style={{fontFamily:'var(--font-mono)',fontSize:11}}>Incoming calls webhook: {origin}/voice/inbound (HTTP POST)</code>
            <br/><code style={{fontFamily:'var(--font-mono)',fontSize:11}}>Status callback: {origin}/voice/status (HTTP POST)</code>
          </Alert>
          <Card>
            <CardHead title="Twilio Configuration" subtitle="Your SIP/VoIP telephony provider"/>
            <CardBody>
              <F label="Account SID" k="twilio_account_sid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" mono/>
              <F label="Auth Token" k="twilio_auth_token" placeholder="Enter Twilio Auth Token" secret mono hint="Stored encrypted — never shared"/>
              <F label="Phone Number" k="twilio_phone_number" placeholder="+12568002700" hint="The number callers will dial"/>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Webhook URLs" subtitle="Copy these into your Twilio console"/>
            <CardBody>
              <CopyField label="Voice Webhook (incoming calls)" value={`${origin}/voice/inbound`}/>
              <CopyField label="Status Callback" value={`${origin}/voice/status`}/>
              <CopyField label="Voicemail Transcription Callback" value={`${origin}/voice/transcribe`}/>
              <CopyField label="GHL Webhook" value={`${origin}/webhooks/ghl`}/>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── AI & VOICE ── */}
      {tab==='ai' && (
        <div style={{maxWidth:560}}>
          <Card>
            <CardHead title="AI Configuration"/>
            <CardBody>
              <F label="OpenAI API Key" k="openai_api_key" placeholder="sk-..." secret mono hint="Used for GPT-4o response generation, intent detection, and call summaries"/>
              <FormGroup label="LLM Model" hint="GPT-4o mini is recommended — fastest and most cost-effective">
                <select>
                  <option>GPT-4o mini (Recommended)</option>
                  <option>GPT-4o (Most capable)</option>
                </select>
              </FormGroup>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Voice Synthesis" subtitle="Text-to-speech for ARIA's voice"/>
            <CardBody>
              <F label="ElevenLabs API Key" k="elevenlabs_api_key" placeholder="Enter ElevenLabs API key" secret mono hint="Get from elevenlabs.io — enables ultra-realistic AI voices"/>
              <F label="Deepgram API Key" k="deepgram_api_key" placeholder="Enter Deepgram API key" secret mono hint="Optional: Higher accuracy speech-to-text via Deepgram Nova-2"/>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── CRM ── */}
      {tab==='crm' && (
        <div style={{maxWidth:560}}>
          <Card>
            <CardHead title="GoHighLevel (GHL)" subtitle="Primary CRM integration"/>
            <CardBody>
              <Alert type="info" style={{marginBottom:14}}>GHL is the primary CRM. Every call will create/update contacts, add notes, and trigger workflows automatically.</Alert>
              <F label="GHL API Key (Location)" k="ghl_api_key" placeholder="eyJhbGc..." secret mono hint="Settings → Company → API Keys → Create (Location scope)"/>
              <F label="GHL Location ID" k="ghl_location_id" placeholder="locationId from GHL URL" mono hint="Found in your GHL sub-account URL"/>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="HubSpot" subtitle="Alternative CRM"/>
            <CardBody>
              <F label="HubSpot Private App Token" k="hubspot_api_key" placeholder="pat-na1-..." secret mono hint="Settings → Integrations → Private Apps → Create"/>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab==='notifications' && (
        <div style={{maxWidth:560}}>
          <Card>
            <CardHead title="Email Alerts"/>
            <CardBody>
              <F label="SendGrid API Key" k="sendgrid_api_key" placeholder="SG.xxx" secret mono hint="Used for sending email notifications, call summaries, and reports"/>
              <F label="Alert Email Address" k="notification_email" placeholder="ryan@plexautomation.io" hint="Receives missed call alerts, voicemail notifications, daily summaries"/>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="SMS Alerts"/>
            <CardBody>
              <F label="Team SMS Number(s)" k="notification_sms" placeholder="+12568002700, +12565531122" hint="Comma-separated. Receives instant missed call alerts via Twilio."/>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Slack Alerts"/>
            <CardBody>
              <F label="Slack Webhook URL" k="slack_webhook_url" placeholder="https://hooks.slack.com/services/..." mono hint="Create at api.slack.com → Your apps → Incoming Webhooks. Sends missed calls and bookings to your Slack channel."/>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Alert Events" subtitle="What triggers a notification"/>
            <CardBody style={{padding:0}}>
              {[
                ['Missed call','SMS + Email',true],
                ['New voicemail','SMS',true],
                ['Appointment booked','Email',true],
                ['Call transferred','SMS',true],
                ['Daily summary (8am)','Email',true],
                ['Weekly digest (Monday)','Email',false],
                ['New contact created','Email',false],
              ].map(([ev,ch,on])=>(
                <div key={ev} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 17px',borderBottom:'1px solid var(--border)'}}>
                  <div><div style={{fontSize:13,fontWeight:500}}>{ev}</div><div style={{fontSize:11,color:'var(--text-4)'}}>{ch}</div></div>
                  <Toggle on={on} onChange={()=>{}} size="sm"/>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab==='calendar' && (
        <div style={{maxWidth:560}}>
          <Card>
            <CardHead title="Google Calendar"/>
            <CardBody>
              <F label="Calendar ID" k="google_calendar_id" placeholder="primary or your-calendar@gmail.com" hint="ARIA will create events here when appointments are booked"/>
              <Alert type="warning">Full Google Calendar integration requires OAuth setup. Contact PLEX Automation support to configure OAuth for your account.</Alert>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Calendly Integration"/>
            <CardBody>
              <F label="Calendly API Key" k="calendly_api_key" placeholder="eyJhbGc..." secret mono hint="Get from calendly.com/integrations/api_webhooks"/>
              <Alert type="info">With Calendly connected, ARIA can check availability and send your booking link during calls.</Alert>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── BILLING ── */}
      {tab==='billing' && (
        <div style={{maxWidth:680}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {[
              {name:'Starter',price:'$297',setup:'$349',features:['1 AI Agent','Unlimited inbound calls','FAQ + Voicemail + SMS','Basic analytics','GHL CRM sync']},
              {name:'Pro',price:'$597',setup:'$849',features:['3 AI Agents','Everything in Starter','Appointment booking','Live call transfer','Advanced analytics','Priority support'],popular:true},
              {name:'Agency',price:'$997',setup:'$1,500',features:['Unlimited agents','Everything in Pro','White-label dashboard','Multi-location support','Custom integrations','Dedicated success mgr']},
            ].map(p=>(
              <div key={p.name} style={{padding:20,border:`2px solid ${p.popular?'var(--green)':'var(--border)'}`,borderRadius:'var(--r-lg)',background:p.popular?'var(--green-xlight)':'var(--surface)',boxShadow:p.popular?'0 4px 16px rgba(39,103,73,.1)':'var(--shadow-xs)'}}>
                {p.popular && <div style={{fontSize:10,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Most Popular</div>}
                <div style={{fontFamily:'var(--font-head)',fontSize:18,fontWeight:700,marginBottom:4}}>{p.name}</div>
                <div style={{marginBottom:4}}><span style={{fontFamily:'var(--font-head)',fontSize:28,fontWeight:800,color:p.popular?'var(--green)':'var(--text)'}}>{p.price}</span><span style={{fontSize:12,color:'var(--text-3)'}}>/mo</span></div>
                <div style={{fontSize:11,color:'var(--text-4)',marginBottom:14}}>{p.setup} setup</div>
                {p.features.map(f=><div key={f} style={{display:'flex',alignItems:'center',gap:7,marginBottom:7,fontSize:12,color:'var(--text-2)'}}><span style={{color:'var(--green)',fontWeight:700}}>✓</span>{f}</div>)}
                <Btn variant={p.popular?'primary':'secondary'} style={{width:'100%',justifyContent:'center',marginTop:12}} size="sm"
                  onClick={()=>window.open('mailto:ryan@plexautomation.io?subject=Upgrade to '+p.name,'_blank')}>
                  {org?.plan===p.name.toLowerCase()?'Current Plan':'Select '+p.name}
                </Btn>
              </div>
            ))}
          </div>
          <Card>
            <CardHead title="Billing"/>
            <CardBody>
              <p style={{fontSize:13,color:'var(--text-3)'}}>Billing is managed by PLEX Automation. To upgrade, change payment methods, or view invoices, contact <a href="mailto:ryan@plexautomation.io">ryan@plexautomation.io</a>.</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── TEAM ── */}
      {tab==='team' && (
        <div style={{maxWidth:560}}>
          <Card>
            <CardHead title="Team Members">
              <Btn size="sm" variant="primary" onClick={()=>alert('Invite member via email — contact ryan@plexautomation.io')}>Invite Member</Btn>
            </CardHead>
            <div style={{padding:'12px 17px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid var(--border)'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--green-light)',border:'1.5px solid rgba(39,103,73,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--green)',fontSize:12}}>
                {(user?.name||'U')[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{user?.name}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{user?.email}</div>
              </div>
              <span style={{fontSize:11,fontWeight:600,color:user?.role==='superadmin'?'var(--purple)':user?.role==='owner'?'var(--green)':'var(--text-3)',background:user?.role==='superadmin'?'var(--purple-light)':user?.role==='owner'?'var(--green-light)':'var(--bg-3)',padding:'2px 8px',borderRadius:20}}>{user?.role}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
