import { useState, useContext } from 'react';
import { api } from '../lib/api';
import { AuthCtx } from '../App';
import { Card, CardHead, CardBody, Btn, FormGroup } from '../components/UI';

export default function Settings() {
  const { org, setOrg } = useContext(AuthCtx);
  const [form, setForm] = useState({
    twilio_account_sid: org?.twilio_account_sid || '',
    twilio_auth_token: org?.twilio_auth_token || '',
    twilio_phone_number: org?.twilio_phone_number || '',
    ghl_api_key: org?.ghl_api_key || '',
    ghl_location_id: org?.ghl_location_id || '',
    notification_email: org?.notification_email || '',
    notification_sms: org?.notification_sms || '',
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('twilio');

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateOrg(form);
      setOrg(o => ({ ...o, ...updated }));
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const tabs = ['twilio','ghl','notifications'];

  return (
    <div style={{maxWidth:620}}>
      <div style={{display:'flex',gap:2,background:'var(--surface2)',borderRadius:7,padding:3,marginBottom:16,width:'fit-content'}}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:'6px 14px',borderRadius:5,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',background:tab===t?'var(--accent)':'transparent',color:tab===t?'#fff':'var(--text3)',transition:'.15s',textTransform:'capitalize'}}>
            {t === 'ghl' ? 'GoHighLevel' : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'twilio' && (
        <Card>
          <CardHead title="Twilio Configuration"/>
          <CardBody>
            <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.2)',borderRadius:7,padding:'10px 12px',marginBottom:14,fontSize:11,color:'var(--blue)',lineHeight:1.6}}>
              📋 Set your Twilio webhook to: <code style={{fontFamily:'var(--font-mono)',background:'rgba(59,130,246,.1)',padding:'1px 5px',borderRadius:3}}>{window.location.origin}/voice/inbound</code><br/>
              Status callback: <code style={{fontFamily:'var(--font-mono)',background:'rgba(59,130,246,.1)',padding:'1px 5px',borderRadius:3}}>{window.location.origin}/voice/status</code>
            </div>
            <FormGroup label="Account SID"><input value={form.twilio_account_sid} onChange={e=>setF('twilio_account_sid',e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx"/></FormGroup>
            <FormGroup label="Auth Token"><input type="password" value={form.twilio_auth_token} onChange={e=>setF('twilio_auth_token',e.target.value)} placeholder="••••••••••••••••"/></FormGroup>
            <FormGroup label="Phone Number"><input value={form.twilio_phone_number} onChange={e=>setF('twilio_phone_number',e.target.value)} placeholder="+12568002700"/></FormGroup>
          </CardBody>
        </Card>
      )}

      {tab === 'ghl' && (
        <Card>
          <CardHead title="GoHighLevel Integration"/>
          <CardBody>
            <div style={{background:'rgba(240,90,26,.08)',border:'1px solid rgba(240,90,26,.2)',borderRadius:7,padding:'10px 12px',marginBottom:14,fontSize:11,color:'var(--accent)',lineHeight:1.6}}>
              🔗 Get your GHL API key from: Settings → Company → API Keys → Create API Key (Location scope)
            </div>
            <FormGroup label="GHL API Key (Location)"><input type="password" value={form.ghl_api_key} onChange={e=>setF('ghl_api_key',e.target.value)} placeholder="eyJhbGc..."/></FormGroup>
            <FormGroup label="Location ID"><input value={form.ghl_location_id} onChange={e=>setF('ghl_location_id',e.target.value)} placeholder="locationId from GHL"/></FormGroup>
          </CardBody>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHead title="Notification Settings"/>
          <CardBody>
            <FormGroup label="Team Email (alert recipient)"><input type="email" value={form.notification_email} onChange={e=>setF('notification_email',e.target.value)} placeholder="ryan@plexautomation.io"/></FormGroup>
            <FormGroup label="Team SMS Number(s)"><input value={form.notification_sms} onChange={e=>setF('notification_sms',e.target.value)} placeholder="+12568002700, +12565531122"/></FormGroup>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:8}}>Separate multiple numbers with commas. SMS is sent via your Twilio number.</div>
          </CardBody>
        </Card>
      )}

      <Btn variant="primary" style={{marginTop:4}} onClick={save} disabled={saving}>
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
      </Btn>
    </div>
  );
}
