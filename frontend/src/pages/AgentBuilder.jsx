import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHead, CardBody, Btn, Toggle, FormGroup, Alert, Spinner, Tabs, SectionHead, Badge } from '../components/UI';

const WORKFLOWS = [
  { id:'greeting', label:'🙋 Greeting', desc:'Opening message when call starts' },
  { id:'faq', label:'❓ FAQ Matching', desc:'Answer from knowledge base' },
  { id:'intent', label:'🎯 Intent Detection', desc:'Classify caller intent' },
  { id:'booking', label:'📅 Appointment Booking', desc:'Collect info and book' },
  { id:'transfer', label:'🔀 Live Transfer', desc:'Route to human agent' },
  { id:'voicemail', label:'📬 Voicemail Capture', desc:'Record caller message' },
  { id:'sms', label:'💬 SMS Follow-up', desc:'Send text after call ends' },
  { id:'crm', label:'🔗 CRM Sync', desc:'Create/update contact' },
  { id:'goodbye', label:'👋 Goodbye', desc:'Closing message' },
];

const EL_VOICES = [
  { id:'EXAVITQu4vr4xnSDxMaL', name:'Rachel', desc:'Calm, professional female — recommended for most businesses' },
  { id:'AZnzlk1XvdvUeBnXmlld', name:'Domi', desc:'Strong, energetic female' },
  { id:'MF3mGyEYCl7XYWbV9V6O', name:'Elli', desc:'Warm, young female' },
  { id:'TxGEqnHWrfWFTfGW9XjX', name:'Josh', desc:'Deep, trustworthy male' },
  { id:'VR6AewLTigWG4xSOukaG', name:'Arnold', desc:'Crisp, authoritative male' },
  { id:'pNInz6obpgDQGcFmaJgB', name:'Adam', desc:'Deep, confident male' },
  { id:'yoZ06aMxZnX8v6qjIwqM', name:'Sam', desc:'Raspy, natural male' },
  { id:'jsCqWAovK2LkecY7zXl4', name:'Freya', desc:'British female, professional' },
];

const TTSEDGE_VOICES = [
  { id:'en-US-JennyNeural', name:'Jenny (US)', desc:'Natural American female' },
  { id:'en-US-GuyNeural', name:'Guy (US)', desc:'Natural American male' },
  { id:'en-US-AriaNeural', name:'Aria (US)', desc:'Warm American female' },
  { id:'en-GB-SoniaNeural', name:'Sonia (UK)', desc:'British female' },
  { id:'en-AU-NatashaNeural', name:'Natasha (AU)', desc:'Australian female' },
  { id:'en-US-JasonNeural', name:'Jason (US)', desc:'Professional American male' },
];

export default function AgentBuilder() {
  const [agents, setAgents] = useState([]);
  const [agent, setAgent]   = useState(null);
  const [form, setForm]     = useState({});
  const [tab, setTab]       = useState('identity');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [elVoices, setElVoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [testing, setTesting]   = useState(false);

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(()=>{
    api.getAgents().then(a=>{
      setAgents(a||[]);
      if (a?.length) { setAgent(a[0]); setForm(a[0]); }
    }).finally(()=>setLoading(false));
    api.getELVoices().then(r=>setElVoices(r.voices||[])).catch(()=>{});
  },[]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateAgent(agent.id, form);
      setAgent(updated); setForm(updated);
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    } catch(e){ console.error(e); }
    finally { setSaving(false); }
  };

  const createAgent = async () => {
    const a = await api.createAgent({ name:'New Agent', industry:'general' });
    setAgents(ag=>[...ag,a]);
    setAgent(a); setForm(a);
  };

  const testVoice = () => {
    setTesting(true);
    setTimeout(()=>setTesting(false),2000);
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;
  if (!agent) return (
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:40,marginBottom:16}}>🤖</div>
      <div style={{fontFamily:'var(--font-head)',fontSize:22,fontWeight:700,marginBottom:8}}>No agents yet</div>
      <div style={{fontSize:13,color:'var(--text-3)',marginBottom:24}}>Create your first AI voice agent to get started</div>
      <Btn variant="primary" size="lg" onClick={createAgent}>+ Create First Agent</Btn>
    </div>
  );

  const voices = form.voice_provider==='ttsedge' ? TTSEDGE_VOICES : EL_VOICES;
  const selectedVoice = voices.find(v=>v.id===form.voice_id);

  return (
    <div>
      <SectionHead
        title="Agent Builder"
        desc="Configure your AI voice agent's personality, voice, and behavior"
        action={
          <div style={{display:'flex',gap:8}}>
            {agents.length>1 && (
              <select value={agent?.id} onChange={e=>{const a=agents.find(x=>x.id===e.target.value);setAgent(a);setForm(a);}}
                style={{padding:'6px 11px',fontSize:12,width:'auto'}}>
                {agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
            <Btn size="sm" onClick={createAgent}>+ New Agent</Btn>
            <Btn variant="primary" size="sm" onClick={save} disabled={saving}>
              {saving?'Saving…':saved?'✓ Saved':'Save Agent'}
            </Btn>
          </div>
        }
      />

      <Tabs
        tabs={[
          {key:'identity',label:'Identity & Voice'},
          {key:'prompts',label:'AI Prompts'},
          {key:'workflow',label:'Call Workflow'},
          {key:'features',label:'Features'},
          {key:'sms',label:'SMS & Follow-up'},
        ]}
        active={tab} onChange={setTab}
      />

      {/* ── IDENTITY & VOICE ── */}
      {tab==='identity' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <Card>
              <CardHead title="Agent Identity"/>
              <CardBody>
                <FormGroup label="Agent Name" required>
                  <input value={form.name||''} onChange={e=>setF('name',e.target.value)} placeholder="ARIA"/>
                </FormGroup>
                <FormGroup label="Industry" hint="Helps tailor responses for your business type">
                  <select value={form.industry||'general'} onChange={e=>setF('industry',e.target.value)}>
                    {['general','hvac','insurance','real_estate','legal','healthcare','coaching','roofing','plumbing','electrical'].map(i=><option key={i} value={i}>{i.replace('_',' ')}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Greeting Message" hint="What ARIA says when a call is answered" required>
                  <textarea value={form.greeting||''} onChange={e=>setF('greeting',e.target.value)} style={{minHeight:80}} placeholder="Thank you for calling! This is ARIA, your AI assistant..."/>
                </FormGroup>
                <FormGroup label="After-Hours Message">
                  <textarea value={form.after_hours_msg||''} onChange={e=>setF('after_hours_msg',e.target.value)} style={{minHeight:64}}/>
                </FormGroup>
                <FormGroup label="Goodbye Message">
                  <input value={form.goodbye_msg||''} onChange={e=>setF('goodbye_msg',e.target.value)} placeholder="Thank you for calling. Have a great day!"/>
                </FormGroup>
              </CardBody>
            </Card>
          </div>

          <div>
            <Card>
              <CardHead title="Voice Provider"/>
              <CardBody>
                <FormGroup label="Provider">
                  <div style={{display:'flex',gap:8}}>
                    {[['elevenlabs','ElevenLabs','Ultra-realistic AI voices'],['ttsedge','TTS Edge','Microsoft Neural voices'],['twilio','Twilio Polly','AWS Polly Neural voices']].map(([v,n,d])=>(
                      <div key={v} onClick={()=>setF('voice_provider',v)} style={{flex:1,padding:'10px 12px',border:`2px solid ${form.voice_provider===v?'var(--green)':'var(--border)'}`,borderRadius:'var(--r-sm)',cursor:'pointer',background:form.voice_provider===v?'var(--green-xlight)':'var(--surface)',transition:'all var(--t)',textAlign:'center'}}>
                        <div style={{fontSize:12,fontWeight:600,color:form.voice_provider===v?'var(--green)':'var(--text)'}}>{n}</div>
                        <div style={{fontSize:10,color:'var(--text-4)',marginTop:2}}>{d}</div>
                      </div>
                    ))}
                  </div>
                </FormGroup>

                <FormGroup label="Select Voice">
                  <div style={{display:'grid',gap:6,maxHeight:280,overflowY:'auto',paddingRight:4}}>
                    {voices.map(v=>(
                      <div key={v.id} onClick={()=>{setF('voice_id',v.id);setF('voice_name',v.name);}}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',border:`1.5px solid ${form.voice_id===v.id?'var(--green)':'var(--border)'}`,borderRadius:'var(--r-sm)',cursor:'pointer',background:form.voice_id===v.id?'var(--green-xlight)':'var(--surface)',transition:'all var(--t)'}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:'var(--bg-3)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🎙</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12.5,fontWeight:600,color:form.voice_id===v.id?'var(--green)':'var(--text)'}}>{v.name}</div>
                          <div style={{fontSize:11,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.desc}</div>
                        </div>
                        {form.voice_id===v.id && <span style={{color:'var(--green)',fontSize:16}}>✓</span>}
                      </div>
                    ))}
                  </div>
                </FormGroup>

                {form.voice_provider==='elevenlabs' && (
                  <FormGroup label="Voice Settings">
                    {[['Stability','stability'],['Similarity','similarity_boost'],['Style','style']].map(([l,k])=>(
                      <div key={k} style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                          <span style={{color:'var(--text-2)'}}>{l}</span>
                          <span style={{fontFamily:'var(--font-mono)',color:'var(--text-3)'}}>{Math.round((form.voice_settings?.[k]||0)*100)}%</span>
                        </div>
                        <input type="range" min={0} max={1} step={0.05} value={form.voice_settings?.[k]||0.75} style={{width:'100%',accentColor:'var(--green)'}}
                          onChange={e=>setF('voice_settings',{...form.voice_settings,[k]:parseFloat(e.target.value)})}/>
                      </div>
                    ))}
                  </FormGroup>
                )}

                <Btn size="sm" onClick={testVoice} disabled={testing} style={{marginTop:4}}>
                  {testing ? '▶ Playing…' : '▶ Test Voice'}
                </Btn>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── AI PROMPTS ── */}
      {tab==='prompts' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div>
            <Card>
              <CardHead title="System Prompt" subtitle="Core instructions for ARIA's behavior"/>
              <CardBody>
                <Alert type="info" style={{marginBottom:14}}>
                  This is the master instruction set that governs how ARIA responds. Be specific about your business, tone, and what ARIA should and shouldn't do.
                </Alert>
                <textarea value={form.system_prompt||''} onChange={e=>setF('system_prompt',e.target.value)}
                  style={{width:'100%',minHeight:260,fontFamily:'var(--font-mono)',fontSize:12,lineHeight:1.6}}
                  placeholder={`You are ARIA, a professional AI receptionist for [Your Business].

Your personality: Warm, helpful, and professional. You speak conversationally.

Your goals:
1. Answer caller questions about our services
2. Book appointments when requested
3. Collect caller information for follow-up
4. Transfer emergency calls immediately

You must NEVER:
- Give specific prices without checking with a team member
- Make promises about timelines
- Diagnose issues over the phone

Always:
- Confirm appointments before ending the call
- Offer to send a text confirmation
- Ask if there's anything else you can help with`}/>
              </CardBody>
            </Card>
          </div>
          <div>
            <Card>
              <CardHead title="Booking Prompt" subtitle="Used when caller wants to schedule"/>
              <CardBody>
                <textarea value={form.booking_prompt||''} onChange={e=>setF('booking_prompt',e.target.value)}
                  style={{minHeight:100}} placeholder="I'd be happy to schedule an appointment for you. What type of service are you looking for?"/>
              </CardBody>
            </Card>
            <Card>
              <CardHead title="Transfer Prompt" subtitle="Said before connecting to a human"/>
              <CardBody>
                <textarea value={form.transfer_prompt||''} onChange={e=>setF('transfer_prompt',e.target.value)}
                  style={{minHeight:80}} placeholder="Let me connect you with a team member who can better assist you. One moment please."/>
                <FormGroup label="Transfer Number" hint="The phone number to dial for live transfers">
                  <input value={form.transfer_number||''} onChange={e=>setF('transfer_number',e.target.value)} placeholder="+12568002701"/>
                </FormGroup>
              </CardBody>
            </Card>
            <Card>
              <CardHead title="Escalation Keywords" subtitle="These words trigger immediate transfer"/>
              <CardBody>
                <FormGroup label="Keywords (comma separated)" hint="e.g. emergency, urgent, manager, cancel, fire, flooding">
                  <input value={(form.escalation_keywords||[]).join(', ')} onChange={e=>setF('escalation_keywords',e.target.value.split(',').map(k=>k.trim()).filter(Boolean))} placeholder="emergency, urgent, manager, cancel"/>
                </FormGroup>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── CALL WORKFLOW ── */}
      {tab==='workflow' && (
        <div>
          <Alert type="info" style={{marginBottom:16}}>
            The call workflow defines what happens at each stage of a call. ARIA follows these steps in order when handling inbound calls.
          </Alert>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {WORKFLOWS.map((step,i)=>(
              <div key={step.id} style={{padding:'14px 16px',background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:'var(--r-md)',boxShadow:'var(--shadow-xs)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:'var(--green-xlight)',border:'1.5px solid rgba(39,103,73,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--green)',flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{step.label}</div>
                </div>
                <div style={{fontSize:11.5,color:'var(--text-3)',marginBottom:10}}>{step.desc}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,color:'var(--text-4)',fontFamily:'var(--font-mono)'}}>{step.id}</span>
                  <Badge color="green" dot>active</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FEATURES ── */}
      {tab==='features' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Card>
            <CardHead title="Core Features"/>
            <CardBody style={{padding:0}}>
              {[
                ['booking_enabled','📅','Appointment Booking','Collect info and book appointments directly via voice'],
                ['faq_enabled','❓','FAQ Answering','Auto-answer from your knowledge base'],
                ['voicemail_enabled','📬','Voicemail Capture','Record and transcribe after-hours messages'],
              ].map(([k,ico,name,desc])=>(
                <div key={k} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 17px',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:18,flexShrink:0}}>{ico}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{name}</div>
                    <div style={{fontSize:11.5,color:'var(--text-3)'}}>{desc}</div>
                  </div>
                  <Toggle on={!!form[k]} onChange={v=>setF(k,v)} size="sm"/>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Advanced Settings"/>
            <CardBody>
              <FormGroup label="Max Call Duration (seconds)" hint="0 = unlimited">
                <input type="number" value={form.max_call_duration||600} onChange={e=>setF('max_call_duration',parseInt(e.target.value))} min={60} max={1800}/>
              </FormGroup>
              <FormGroup label="Silence Timeout (seconds)" hint="How long to wait for caller to speak">
                <input type="number" value={form.silence_timeout||5} onChange={e=>setF('silence_timeout',parseInt(e.target.value))} min={2} max={15}/>
              </FormGroup>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── SMS & FOLLOW-UP ── */}
      {tab==='sms' && (
        <div style={{maxWidth:600}}>
          <Card>
            <CardHead title="SMS Follow-up"/>
            <CardBody>
              <Toggle on={!!form.sms_followup_enabled} onChange={v=>setF('sms_followup_enabled',v)} label="Enable automatic SMS follow-up for missed callers"/>
              {form.sms_followup_enabled && (
                <div style={{marginTop:16}}>
                  <FormGroup label="SMS Template" hint="Variables: {business_name}, {caller_phone}">
                    <textarea value={form.sms_followup_template||''} onChange={e=>setF('sms_followup_template',e.target.value)} style={{minHeight:80}} placeholder="Hi! We missed your call at {business_name}. We'll reach out shortly! Reply STOP to opt out."/>
                  </FormGroup>
                  <Alert type="warning">SMS requires Twilio configured in Settings → Integrations.</Alert>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Save button */}
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:16,gap:8}}>
        <Btn variant="secondary" onClick={()=>setForm(agent)}>Reset</Btn>
        <Btn variant="primary" onClick={save} disabled={saving}>
          {saving?'Saving…':saved?'✓ Saved':'Save Agent Configuration'}
        </Btn>
      </div>
    </div>
  );
}
