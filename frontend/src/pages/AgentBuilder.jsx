import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHead, CardBody, Toggle, Btn, Spinner, FormGroup } from '../components/UI';

const FEATURES = [
  { key:'faq', ico:'❓', name:'FAQ Handling', desc:'Auto-answer from knowledge base' },
  { key:'booking', ico:'📅', name:'Appointment Booking', desc:'Book directly into calendar' },
  { key:'voicemail', ico:'🎙', name:'Voicemail Capture', desc:'Record & transcribe messages' },
  { key:'transfer', ico:'🔀', name:'Live Transfer', desc:'Route complex calls to humans' },
  { key:'sms', ico:'💬', name:'SMS Notifications', desc:'Auto-send confirmations' },
  { key:'email', ico:'✉', name:'Email Alerts', desc:'Send summaries to your team' },
  { key:'crm', ico:'🔗', name:'CRM Sync', desc:'Push contacts to GHL' },
  { key:'summary', ico:'📄', name:'Call Summaries', desc:'AI-generated after every call' },
  { key:'afterhours', ico:'🌙', name:'After-Hours Mode', desc:'Custom after-hours routing' },
  { key:'lead_scoring', ico:'⚡', name:'Lead Scoring', desc:'Score & prioritize inbound leads' },
];

export default function AgentBuilder() {
  const [agents, setAgents] = useState([]);
  const [agent, setAgent] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.getAgents().then(a => {
      setAgents(a || []);
      if (a?.length) { setAgent(a[0]); setForm(a[0]); }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateAgent(agent.id, form);
      setAgent(updated); setForm(updated);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (!agent) return <div style={{textAlign:'center',padding:40}}><Spinner/></div>;

  const features = form.features || {};

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div>
        <Card>
          <CardHead title="Agent Identity"/>
          <CardBody>
            <FormGroup label="Agent Name">
              <input value={form.name||''} onChange={e=>setF('name',e.target.value)}/>
            </FormGroup>
            <FormGroup label="Voice Style">
              <select value={form.voice_style||'rachel'} onChange={e=>setF('voice_style',e.target.value)}>
                <option value="rachel">Warm & Professional (Rachel)</option>
                <option value="bella">Southern Charm (Bella)</option>
                <option value="adam">Energetic (Adam)</option>
                <option value="josh">Neutral (Josh)</option>
              </select>
            </FormGroup>
            <FormGroup label="Transfer / Fallback Number">
              <input value={form.transfer_number||''} onChange={e=>setF('transfer_number',e.target.value)} placeholder="+1 (256) 000-0000"/>
            </FormGroup>
            <FormGroup label="Greeting Script">
              <textarea value={form.greeting||''} onChange={e=>setF('greeting',e.target.value)} style={{minHeight:72,resize:'vertical'}}/>
            </FormGroup>
            <FormGroup label="After-Hours Message">
              <textarea value={form.after_hours_msg||''} onChange={e=>setF('after_hours_msg',e.target.value)} style={{minHeight:72,resize:'vertical'}}/>
            </FormGroup>
          </CardBody>
        </Card>
        <Card>
          <CardHead title="Business Hours"/>
          <CardBody>
            {[['Mon–Fri','mon_fri'],['Saturday','sat'],['Sunday','sun']].map(([label, key]) => (
              <div key={key} style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
                <span style={{fontSize:11,width:70,color:'var(--text2)',flexShrink:0}}>{label}</span>
                <input style={{flex:1,padding:'5px 9px'}} value={form.business_hours?.[key]?.open||''} onChange={e=>setF('business_hours',{...form.business_hours,[key]:{...form.business_hours?.[key],open:e.target.value}})} placeholder="08:00"/>
                <span style={{color:'var(--text3)',fontSize:11}}>–</span>
                <input style={{flex:1,padding:'5px 9px'}} value={form.business_hours?.[key]?.close||''} onChange={e=>setF('business_hours',{...form.business_hours,[key]:{...form.business_hours?.[key],close:e.target.value}})} placeholder="18:00"/>
              </div>
            ))}
          </CardBody>
        </Card>
        <Btn variant="primary" style={{width:'100%',justifyContent:'center'}} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : '💾 Save Agent Config'}
        </Btn>
      </div>

      <Card>
        <CardHead title="Feature Toggles" meta={`${Object.values(features).filter(Boolean).length} active`}/>
        <CardBody style={{padding:0}}>
          {FEATURES.map(f => (
            <div key={f.key} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:16,flexShrink:0}}>{f.ico}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500}}>{f.name}</div>
                <div style={{fontSize:10,color:'var(--text3)'}}>{f.desc}</div>
              </div>
              <Toggle on={!!features[f.key]} onChange={v => setF('features', {...features, [f.key]:v})}/>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
