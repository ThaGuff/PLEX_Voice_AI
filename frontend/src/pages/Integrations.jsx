import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { SectionHead, Card, CardHead, CardBody, Badge, Btn, Alert } from '../components/UI';

const ALL_INTEGRATIONS = [
  { id:'twilio',     cat:'Telephony',   icon:'📞', name:'Twilio',           desc:'SIP trunking, SMS, voice calls, phone number management',    settingsTab:'telephony' },
  { id:'openai',     cat:'AI',          icon:'◎',  name:'OpenAI',           desc:'GPT-4o for AI response generation and intent detection',       settingsTab:'ai' },
  { id:'elevenlabs', cat:'AI',          icon:'🔊', name:'ElevenLabs',       desc:'Ultra-realistic text-to-speech with voice cloning',           settingsTab:'ai' },
  { id:'deepgram',   cat:'AI',          icon:'🎤', name:'Deepgram',         desc:'High-accuracy speech-to-text with Nova-2 model',              settingsTab:'ai' },
  { id:'ghl',        cat:'CRM',         icon:'🏗', name:'GoHighLevel',      desc:'Full CRM sync, pipeline, workflow triggers, contact creation', settingsTab:'crm' },
  { id:'hubspot',    cat:'CRM',         icon:'🟠', name:'HubSpot',          desc:'Contact sync, deal creation, activity logging',               settingsTab:'crm' },
  { id:'salesforce', cat:'CRM',         icon:'☁',  name:'Salesforce',       desc:'Enterprise CRM — contact, lead, opportunity sync',            settingsTab:'crm' },
  { id:'sendgrid',   cat:'Email',       icon:'✉',  name:'SendGrid',         desc:'Transactional email, call summaries, team alerts',            settingsTab:'notifications' },
  { id:'slack',      cat:'Messaging',   icon:'💬', name:'Slack',            desc:'Real-time call alerts, missed call notifications, daily reports', settingsTab:'notifications' },
  { id:'google_cal', cat:'Calendar',    icon:'📆', name:'Google Calendar',  desc:'Two-way appointment sync, availability checking',             settingsTab:'calendar' },
  { id:'calendly',   cat:'Calendar',    icon:'🗓', name:'Calendly',         desc:'Booking link integration, slot availability checking',        settingsTab:'calendar' },
  { id:'stripe',     cat:'Billing',     icon:'💳', name:'Stripe',           desc:'Subscription billing, usage-based pricing, invoicing',        settingsTab:'billing' },
  { id:'zapier',     cat:'Automation',  icon:'⚡', name:'Zapier',           desc:'Connect to 5,000+ apps via no-code automated workflows',      link:'https://zapier.com' },
  { id:'make',       cat:'Automation',  icon:'◈',  name:'Make.com',         desc:'Visual automation builder, complex multi-step workflows',      link:'https://make.com' },
  { id:'webhook',    cat:'Automation',  icon:'🔗', name:'Custom Webhook',   desc:'POST call data to any URL in real time — universal connector', settingsTab:'telephony' },
];

const CATS = ['All','Telephony','AI','CRM','Email','Messaging','Calendar','Billing','Automation'];

export default function Integrations() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('All');
  const [status, setStatus] = useState({});
  const [testing, setTesting] = useState(null);
  const [results, setResults] = useState({});

  useEffect(()=>{
    api.getIntegrations().then(rows=>{
      const s={};
      rows.forEach(r=>{ s[r.provider]=r.is_active; });
      setStatus(s);
    }).catch(()=>{});
  },[]);

  const test = async (id) => {
    setTesting(id);
    try {
      const r = await api.testIntegration(id);
      setResults(prev=>({...prev,[id]:r}));
      setStatus(prev=>({...prev,[id]:r.connected}));
    } catch(e){ setResults(prev=>({...prev,[id]:{connected:false,message:e.message}})); }
    finally { setTesting(null); }
  };

  const filtered = ALL_INTEGRATIONS.filter(i=>cat==='All'||i.cat===cat);
  const connected = ALL_INTEGRATIONS.filter(i=>status[i.id]).length;

  return (
    <div>
      <SectionHead title="Integrations" desc={`${connected}/${ALL_INTEGRATIONS.length} connected — click Connect to configure in Settings`}/>

      {/* Category filter */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18}}>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{padding:'5px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:500,cursor:'pointer',transition:'all var(--t)',background:cat===c?'var(--green)':'var(--surface)',borderColor:cat===c?'var(--green)':'var(--border)',color:cat===c?'#fff':'var(--text-3)'}}>
            {c}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
        {['Telephony','AI','CRM','Email/Messaging','Automation'].map(c=>{
          const items = ALL_INTEGRATIONS.filter(i=>i.cat===c||i.cat==='Email'||i.cat==='Messaging').slice(0,c==='Email/Messaging'?99:99).filter(i=>cat==='All'||c.includes(i.cat));
          const cnt = ALL_INTEGRATIONS.filter(i=>(c==='Email/Messaging'?['Email','Messaging'].includes(i.cat):i.cat===c) && status[i.id]).length;
          const total = ALL_INTEGRATIONS.filter(i=>c==='Email/Messaging'?['Email','Messaging'].includes(i.cat):i.cat===c).length;
          return (
            <div key={c} style={{padding:'11px 14px',background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:'var(--r-sm)',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-head)',color:cnt>0?'var(--green)':'var(--text)'}}>{cnt}/{total}</div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{c}</div>
            </div>
          );
        })}
      </div>

      {/* Integration cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {filtered.map(int=>{
          const connected = status[int.id];
          const result = results[int.id];
          return (
            <div key={int.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 15px',background:'var(--surface)',border:`1.5px solid ${connected?'rgba(39,103,73,.25)':'var(--border)'}`,borderRadius:'var(--r-md)',boxShadow:'var(--shadow-xs)'}}>
              <div style={{width:40,height:40,borderRadius:10,background:'var(--bg-2)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{int.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                  <span style={{fontWeight:600,fontSize:13}}>{int.name}</span>
                  <Badge color={connected?'green':'gray'} dot>{connected?'Connected':'Not set'}</Badge>
                  <span style={{fontSize:10,background:'var(--bg-2)',color:'var(--text-4)',border:'1px solid var(--border)',padding:'1px 6px',borderRadius:20,marginLeft:'auto'}}>{int.cat}</span>
                </div>
                <div style={{fontSize:11.5,color:'var(--text-3)',marginBottom:8,lineHeight:1.5}}>{int.desc}</div>
                {result && <div style={{fontSize:11.5,color:result.connected?'var(--green)':'var(--red)',marginBottom:6,fontWeight:500}}>{result.connected?'✓':'✕'} {result.message}</div>}
                <div style={{display:'flex',gap:6}}>
                  <Btn size="sm" variant="primary" onClick={()=>int.link?window.open(int.link,'_blank'):navigate('/settings')}>
                    {connected?'Reconfigure':'Connect'}
                  </Btn>
                  {connected && (
                    <Btn size="sm" onClick={()=>test(int.id)} disabled={testing===int.id}>
                      {testing===int.id?'Testing…':'Test'}
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Alert type="info" style={{marginTop:18}}>
        To configure integrations, go to <strong>Settings</strong> and enter your API keys for each service. ARIA automatically connects once credentials are saved.
      </Alert>
    </div>
  );
}
