// Calls.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, Badge, Tag, Btn, Modal, Spinner, outcomeBadge } from '../components/UI';

export function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getCalls({ limit: 100 }).then(r => setCalls(r.calls || [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? calls.filter(c => c.outcome === filter || c.call_type === filter) : calls;

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input placeholder="🔍  Search..." style={{width:200,padding:'6px 10px'}} onChange={e => {}} />
        {['','answered','booked','voicemail','transferred','missed'].map(f => (
          <Btn key={f} size="sm" variant={filter===f?'primary':'ghost'} onClick={() => setFilter(f)}>{f||'All'}</Btn>
        ))}
        <Btn size="sm" style={{marginLeft:'auto'}}>↓ Export</Btn>
      </div>
      {loading ? <div style={{textAlign:'center',padding:40}}><Spinner/></div> : (
        <Card>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Caller','Phone','Time','Type','Outcome','Duration',''].map(h => (
                <th key={h} style={{fontSize:10,fontFamily:'var(--font-mono)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',padding:'7px 11px',borderBottom:'1px solid var(--border)',textAlign:'left'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.015)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontSize:12,fontWeight:500}}>{c.caller_name||'Unknown'}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text2)'}}>{c.caller_phone}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontSize:11,color:'var(--text3)'}}>{new Date(c.started_at).toLocaleString()}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}><Tag>{c.call_type}</Tag></td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}>{outcomeBadge(c.outcome)}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontFamily:'var(--font-mono)',fontSize:11}}>{c.duration_seconds ? `${Math.floor(c.duration_seconds/60)}:${String(c.duration_seconds%60).padStart(2,'0')}` : '—'}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}><Btn size="sm" onClick={() => setSelected(c)}>Summary</Btn></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:12}}>No calls found</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      {selected && (
        <Modal title={`Call · ${selected.caller_phone}`} onClose={() => setSelected(null)}
          footer={<><Btn variant="ghost" onClick={() => setSelected(null)}>Close</Btn><Btn variant="primary">Add to CRM</Btn></>}>
          <div style={{marginBottom:12,display:'flex',gap:7,flexWrap:'wrap'}}>
            {outcomeBadge(selected.outcome)}<Tag>{selected.call_type}</Tag>
            <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text3)'}}>{new Date(selected.started_at).toLocaleString()}</span>
          </div>
          {selected.summary && (
            <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:7,padding:12,fontSize:11,lineHeight:1.6,color:'var(--text2)',marginBottom:12}}>
              <div style={{fontSize:9,fontFamily:'var(--font-mono)',color:'var(--text3)',marginBottom:4}}>AI SUMMARY</div>
              {selected.summary}
            </div>
          )}
          {selected.intent_scores && Object.keys(selected.intent_scores).length > 0 && (
            <div>
              <div style={{fontSize:9,fontFamily:'var(--font-mono)',color:'var(--text3)',marginBottom:8}}>INTENT SCORES</div>
              {Object.entries(selected.intent_scores).map(([k,v]) => (
                <div key={k} style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
                  <span style={{fontSize:11,color:'var(--text2)',width:80}}>{k}</span>
                  <div style={{flex:1,background:'var(--surface3)',borderRadius:3,height:4,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:3,background:'var(--accent)',width:`${v}%`}}/>
                  </div>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--accent)',width:30,textAlign:'right'}}>{v}%</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// Appointments.jsx
import { useState as useStateA, useEffect as useEffectA } from 'react';
export function Appointments() {
  const [appts, setAppts] = useStateA([]);
  const [loading, setLoading] = useStateA(true);
  const [showModal, setShowModal] = useStateA(false);
  const [form, setForm] = useStateA({ contact_name:'', contact_phone:'', service_type:'HVAC Tune-Up', scheduled_at:'', notes:'' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffectA(() => {
    api.getAppointments().then(r => setAppts(r || [])).finally(() => setLoading(false));
  }, []);

  const book = async () => {
    const appt = await api.createAppointment(form);
    setAppts(a => [appt, ...a]);
    setShowModal(false);
    setForm({ contact_name:'', contact_phone:'', service_type:'HVAC Tune-Up', scheduled_at:'', notes:'' });
  };

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <Btn variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Book Appointment</Btn>
        <Btn size="sm">↻ Sync Calendar</Btn>
      </div>
      {loading ? <div style={{textAlign:'center',padding:40}}><Spinner/></div> : (
        <Card>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Contact','Service','Date & Time','Status','Via',''].map(h => (
                <th key={h} style={{fontSize:10,fontFamily:'var(--font-mono)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',padding:'7px 11px',borderBottom:'1px solid var(--border)',textAlign:'left'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {appts.map(a => (
                <tr key={a.id}>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontSize:12}}>
                    <div style={{fontWeight:500}}>{a.contact_name}</div>
                    <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{a.contact_phone}</div>
                  </td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontSize:12}}>{a.service_type}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontSize:11,fontFamily:'var(--font-mono)'}}>{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}><Badge color={a.status==='confirmed'?'green':a.status==='cancelled'?'red':'yellow'}>{a.status}</Badge></td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}><Tag>{a.booked_via}</Tag></td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',display:'flex',gap:5}}>
                    <Btn size="sm" onClick={() => api.updateAppointment(a.id, {status:'cancelled'}).then(() => setAppts(prev => prev.map(x => x.id===a.id ? {...x,status:'cancelled'} : x)))}>Cancel</Btn>
                  </td>
                </tr>
              ))}
              {!appts.length && <tr><td colSpan={6} style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:12}}>No appointments yet</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      {showModal && (
        <Modal title="Book Appointment" onClose={() => setShowModal(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn><Btn variant="primary" onClick={book}>Book & Notify</Btn></>}>
          {[['Contact Name','contact_name','text','Full name'],['Phone','contact_phone','tel','+1 (256) 000-0000']].map(([l,k,t,p]) => (
            <div key={k} style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{l}</label>
              <input type={t} value={form[k]} onChange={e => setF(k, e.target.value)} placeholder={p}/>
            </div>
          ))}
          <div style={{marginBottom:12}}>
            <label style={{display:'block',fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Service</label>
            <select value={form.service_type} onChange={e => setF('service_type', e.target.value)}>
              {['HVAC Tune-Up','AC Repair','New Installation','Duct Cleaning','Emergency Service'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{display:'block',fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Date & Time</label>
            <input type="datetime-local" value={form.scheduled_at} onChange={e => setF('scheduled_at', e.target.value)}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Notes</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} style={{minHeight:60,resize:'vertical'}} placeholder="Optional notes..."/>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Voicemail.jsx
export function Voicemail() {
  const [vms, setVms] = useStateA([]);
  const [loading, setLoading] = useStateA(true);
  useEffectA(() => {
    api.getVoicemails().then(r => setVms(r || [])).finally(() => setLoading(false));
  }, []);
  const markRead = async (id) => {
    await api.markVoicemailRead(id);
    setVms(v => v.map(x => x.id===id ? {...x, is_read:true} : x));
  };
  return (
    <div>
      {loading ? <div style={{textAlign:'center',padding:40}}><Spinner/></div> : (
        <Card>
          <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'var(--font-head)',fontSize:12.5,fontWeight:700}}>Voicemail Inbox</span>
            <Badge color="yellow">{vms.filter(v=>!v.is_read).length} unread</Badge>
          </div>
          {vms.map(v => (
            <div key={v.id} style={{padding:14,borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}>
                <div style={{width:26,height:26,borderRadius:'50%',background: !v.is_read ? 'rgba(240,90,26,.12)' : 'var(--surface3)',border:`1px solid ${!v.is_read ? 'rgba(240,90,26,.2)' : 'var(--border2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color: !v.is_read ? 'var(--accent)' : 'var(--text3)'}}>
                  {(v.caller_name||'?')[0]}
                </div>
                <div>
                  <div style={{fontWeight:600,fontSize:12}}>{v.caller_name||'Unknown'} {!v.is_read && <Badge color="red">new</Badge>}</div>
                  <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{v.caller_phone} · {new Date(v.created_at).toLocaleString()} · {v.duration_seconds}s</div>
                </div>
                <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                  {v.recording_url && <a href={v.recording_url} target="_blank" rel="noreferrer"><Btn size="sm">▶ Play</Btn></a>}
                  {!v.is_read && <Btn size="sm" variant="primary" onClick={() => markRead(v.id)}>✓ Read</Btn>}
                </div>
              </div>
              {v.transcript && (
                <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:7,padding:10,fontSize:11,lineHeight:1.6,color:'var(--text2)'}}>
                  <div style={{fontSize:9,fontFamily:'var(--font-mono)',color:'var(--text3)',marginBottom:3}}>TRANSCRIPT</div>
                  "{v.transcript}"
                </div>
              )}
            </div>
          ))}
          {!vms.length && <div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:12}}>No voicemails yet</div>}
        </Card>
      )}
    </div>
  );
}

// Recordings.jsx
export function Recordings() {
  const [recs, setRecs] = useStateA([]);
  const [loading, setLoading] = useStateA(true);
  useEffectA(() => {
    api.getRecordings().then(r => setRecs(r || [])).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      {loading ? <div style={{textAlign:'center',padding:40}}><Spinner/></div> : (
        <Card>
          {recs.map(r => (
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderBottom:'1px solid var(--border)'}}>
              <a href={r.url} target="_blank" rel="noreferrer" style={{width:30,height:30,borderRadius:'50%',background:'var(--accent)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,flexShrink:0,textDecoration:'none'}}>▶</a>
              <div style={{flexShrink:0,minWidth:100}}>
                <div style={{fontWeight:500,fontSize:12}}>{r.caller_name||r.caller_phone}</div>
                <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{r.duration_seconds ? `${Math.floor(r.duration_seconds/60)}:${String(r.duration_seconds%60).padStart(2,'0')}` : '—'}</div>
              </div>
              <div style={{flex:1,height:20,display:'flex',alignItems:'center',gap:1.5}}>
                {Array.from({length:40}).map((_,i) => (
                  <div key={i} style={{width:2,borderRadius:1,background:'var(--border2)',height:Math.max(3,Math.random()*18)+'px'}}/>
                ))}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:3}}>{new Date(r.created_at).toLocaleString()}</div>
                <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                  <Tag>{r.call_type}</Tag>
                  {r.url && <a href={r.url} download><Btn size="sm">↓</Btn></a>}
                </div>
              </div>
            </div>
          ))}
          {!recs.length && <div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:12}}>No recordings yet</div>}
        </Card>
      )}
    </div>
  );
}

// Transcripts.jsx
import { useState as useST, useEffect as useET } from 'react';
export function Transcripts() {
  const [calls, setCalls] = useST([]);
  const [sel, setSel] = useST(null);
  useET(() => { api.getCalls({limit:50}).then(r => setCalls(r.calls||[])); }, []);
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div>
        <input placeholder="🔍  Search..." style={{width:'100%',marginBottom:12,padding:'6px 10px'}} />
        {calls.map(c => (
          <Card key={c.id} style={{cursor:'pointer',marginBottom:8}} onClick={() => setSel(c)}>
            <div style={{padding:'10px 12px',display:'flex',gap:9,alignItems:'center'}}>
              <div style={{width:26,height:26,borderRadius:'50%',background:'var(--surface3)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--text2)',flexShrink:0}}>{(c.caller_name||'?')[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:500,fontSize:12}}>{c.caller_name||c.caller_phone}</div>
                <div style={{fontSize:10,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.summary||'No summary'}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>{outcomeBadge(c.outcome)}</div>
            </div>
          </Card>
        ))}
      </div>
      <div>
        {sel ? (
          <Card style={{height:'100%'}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
              <div>
                <div style={{fontFamily:'var(--font-head)',fontSize:12.5,fontWeight:700}}>{sel.caller_name||sel.caller_phone}</div>
                <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{new Date(sel.started_at).toLocaleString()}</div>
              </div>
              {outcomeBadge(sel.outcome)}
              <Btn size="sm" style={{marginLeft:'auto'}}>↓</Btn>
            </div>
            <div style={{padding:14}}>
              {sel.summary && <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:7,padding:11,marginBottom:12,fontSize:11,lineHeight:1.6,color:'var(--text2)'}}><div style={{fontSize:9,fontFamily:'var(--font-mono)',color:'var(--text3)',marginBottom:4}}>AI SUMMARY</div>{sel.summary}</div>}
              <div style={{fontSize:11,color:'var(--text3)',textAlign:'center',padding:'16px 0'}}>Full transcript available after call recording is processed by Twilio</div>
            </div>
          </Card>
        ) : (
          <Card style={{height:200}}><div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text3)',fontSize:12}}>← Select a call to view transcript</div></Card>
        )}
      </div>
    </div>
  );
}

// Notifications.jsx
import { useState as useNS, useEffect as useNE, useContext as useNC } from 'react';
import { WSCtx as WSCtxN } from '../App';
export function Notifications() {
  const [notifs, setNotifs] = useNS([]);
  const { setUnreadCount } = useNC(WSCtxN);
  const [loading, setLoading] = useNS(true);
  useNE(() => {
    api.getNotifications().then(({ notifications }) => setNotifs(notifications||[])).finally(()=>setLoading(false));
  }, []);
  const markAll = async () => {
    await api.markAllRead();
    setNotifs(n => n.map(x => ({...x, is_read:true})));
    setUnreadCount(0);
  };
  const colors = { missed_call:'red', voicemail:'yellow', appointment:'teal', crm:'green', report:'blue' };
  const icons = { missed_call:'📞', voicemail:'🎙️', appointment:'📅', crm:'🔗', report:'📊' };
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
        <Btn size="sm" variant="primary" onClick={markAll}>Mark All Read</Btn>
      </div>
      <Card>
        {loading ? <div style={{padding:24,textAlign:'center'}}><Spinner/></div> : notifs.map(n => (
          <div key={n.id} style={{display:'flex',gap:11,padding:'12px 14px',borderBottom:'1px solid var(--border)',background: !n.is_read ? 'rgba(255,255,255,.015)' : 'transparent'}}>
            <span style={{fontSize:18,flexShrink:0}}>{icons[n.type]||'🔔'}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:500,marginBottom:2}}>{n.title}</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>{n.body} · {new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.is_read && <Badge color={colors[n.type]||'gray'}>new</Badge>}
          </div>
        ))}
        {!notifs.length && <div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:12}}>No notifications</div>}
      </Card>
    </div>
  );
}

export default Calls;
