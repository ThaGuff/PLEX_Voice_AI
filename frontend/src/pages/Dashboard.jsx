import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../lib/api';
import { WSCtx, AuthCtx } from '../App';
import { Card, CardHead, CardBody, KPI, Badge, OutcomeBadge, Btn, Spinner, Empty, SectionHead } from '../components/UI';

export default function Dashboard() {
  const { liveCall } = useContext(WSCtx);
  const { org } = useContext(AuthCtx);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [calls, setCalls] = useState([]);
  const [appts, setAppts] = useState([]);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalytics(30),
      api.getCalls({ limit:6 }),
      api.getAppts(),
      api.getCallsOverTime(14),
    ]).then(([ana, callsRes, apptRes, chartRes]) => {
      setData(ana);
      setCalls(callsRes.calls||[]);
      setAppts((apptRes||[]).slice(0,4));
      setChart((chartRes||[]).map(r=>({
        day: new Date(r.day).toLocaleDateString('en',{month:'short',day:'numeric'}),
        calls: parseInt(r.total||0),
        answered: parseInt(r.answered||0),
        booked: parseInt(r.booked||0),
      })));
    }).catch(console.error).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  const mrr = data?.totalCalls ? Math.round(data.totalCalls * 12.5) : 0;

  return (
    <div>
      <SectionHead
        title={`Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'} 👋`}
        desc={`Here's what's happening with ${org?.name||'your business'} today`}
        action={<Btn variant="primary" onClick={()=>navigate('/agent-builder')}>+ Configure Agent</Btn>}
      />

      {/* Setup banner if no Twilio */}
      {!org?.twilio_phone_number && (
        <div style={{ background:'var(--amber-xlight)', border:'1.5px solid rgba(176,125,44,.2)', borderRadius:'var(--r-md)', padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>⚙️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:13, color:'var(--amber)', marginBottom:2 }}>Complete your setup to go live</div>
            <div style={{ fontSize:12, color:'var(--text-3)' }}>Configure Twilio, OpenAI, and your agent to start receiving calls.</div>
          </div>
          <Btn variant="amber" size="sm" onClick={()=>navigate('/settings')}>Setup Now →</Btn>
        </div>
      )}

      {/* Live call */}
      {liveCall && (
        <div style={{ background:'var(--green-xlight)', border:'1.5px solid rgba(39,103,73,.25)', borderRadius:'var(--r-md)', padding:'13px 18px', marginBottom:14, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--green)', color:'#fff', borderRadius:'var(--r-full)', padding:'3px 10px', fontSize:11, fontWeight:600, flexShrink:0 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'pulse 1s infinite' }}/>LIVE CALL
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:13, color:'var(--green-text)' }}>{liveCall.from}</div>
            <div style={{ fontSize:11, color:'var(--text-3)' }}>ARIA is handling this call</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:7 }}>
            <Btn size="sm" onClick={()=>navigate('/calls')}>View Log</Btn>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        <KPI label="Calls (30d)"    value={data?.totalCalls||0}      icon="📞" />
        <KPI label="Answer Rate"    value={`${data?.answerRate||0}%`} icon="✓" color="green" up change="by ARIA" />
        <KPI label="Booked"         value={data?.appointments||0}     icon="📅" color="green" up change="appointments" />
        <KPI label="Recovered"      value={data?.smsRecoveries||0}    icon="💬" color="amber" change="via SMS" />
        <KPI label="New Contacts"   value={data?.newContacts||0}      icon="◉" change="from calls" />
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:12, marginBottom:12 }}>
        {/* Recent calls */}
        <Card>
          <CardHead title="Recent Calls" subtitle={`${data?.totalCalls||0} total this month`}>
            <Btn size="sm" onClick={()=>navigate('/calls')}>View All →</Btn>
          </CardHead>
          {!calls.length ? (
            <Empty icon="☎" title="No calls yet" desc="Once your Twilio number is configured, inbound calls will appear here." action={<Btn size="sm" variant="primary" onClick={()=>navigate('/settings')}>Configure Twilio</Btn>}/>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                {['Caller','Type','Outcome','Duration','Time'].map(h=>(
                  <th key={h} style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', padding:'8px 13px', borderBottom:'1.5px solid var(--border)', textAlign:'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {calls.map(c=>(
                  <tr key={c.id}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'9px 13px', borderBottom:'1px solid var(--border)', fontSize:12.5 }}>
                      <div style={{ fontWeight:500 }}>{c.caller_name||c.caller_phone}</div>
                      {c.caller_name && <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>{c.caller_phone}</div>}
                    </td>
                    <td style={{ padding:'9px 13px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:11, fontFamily:'var(--font-mono)', background:'var(--bg-2)', color:'var(--text-3)', border:'1px solid var(--border)', padding:'2px 6px', borderRadius:4 }}>{c.call_type}</span>
                    </td>
                    <td style={{ padding:'9px 13px', borderBottom:'1px solid var(--border)' }}><OutcomeBadge outcome={c.outcome}/></td>
                    <td style={{ padding:'9px 13px', borderBottom:'1px solid var(--border)', fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
                      {c.duration_seconds ? `${Math.floor(c.duration_seconds/60)}:${String(c.duration_seconds%60).padStart(2,'0')}` : '—'}
                    </td>
                    <td style={{ padding:'9px 13px', borderBottom:'1px solid var(--border)', fontSize:11, color:'var(--text-3)' }}>
                      {new Date(c.started_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Right column */}
        <div>
          {/* Chart */}
          <Card>
            <CardHead title="Call Volume" subtitle="Last 14 days"/>
            <CardBody style={{ padding:'8px 14px 14px' }}>
              {chart.length > 0 ? (
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chart} margin={{top:4,right:0,left:-20,bottom:0}}>
                    <XAxis dataKey="day" tick={{fontSize:9,fill:'var(--text-4)',fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:7,fontSize:11,boxShadow:'var(--shadow-md)'}} cursor={{fill:'rgba(0,0,0,.03)'}}/>
                    <Bar dataKey="calls" fill="var(--green)" radius={[3,3,0,0]} opacity={.7}/>
                    <Bar dataKey="booked" fill="var(--amber)" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-4)', fontSize:12 }}>No data yet</div>}
            </CardBody>
          </Card>

          {/* Outcomes */}
          <Card>
            <CardHead title="Outcome Breakdown"/>
            <CardBody style={{ padding:'8px 17px 14px' }}>
              {Object.entries(data?.byOutcome||{}).length ? (
                Object.entries(data.byOutcome).map(([k,v])=>(
                  <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}><OutcomeBadge outcome={k}/></div>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text)' }}>{v}</span>
                  </div>
                ))
              ) : <div style={{ fontSize:12, color:'var(--text-4)', textAlign:'center', padding:'12px 0' }}>No call data yet</div>}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Appointments */}
      {appts.length > 0 && (
        <Card>
          <CardHead title="Upcoming Appointments" subtitle={`${appts.length} scheduled`}>
            <Btn size="sm" onClick={()=>navigate('/appointments')}>View All →</Btn>
          </CardHead>
          <div>
            {appts.map(a=>(
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 17px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ textAlign:'center', background:'var(--bg-2)', border:'1.5px solid var(--border)', borderRadius:8, padding:'5px 10px', flexShrink:0, minWidth:46 }}>
                  <div style={{ fontSize:9, color:'var(--text-4)', fontWeight:600, textTransform:'uppercase' }}>{new Date(a.scheduled_at).toLocaleDateString('en',{weekday:'short'})}</div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--text)', lineHeight:1 }}>{new Date(a.scheduled_at).getDate()}</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.contact_name}</div>
                  <div style={{ fontSize:11.5, color:'var(--text-3)' }}>{a.service_type} · {new Date(a.scheduled_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <OutcomeBadge outcome={a.status}/>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
