import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { WSCtx } from '../App';
import { Card, CardHead, CardBody, KPI, Badge, Tag, Btn, Spinner, outcomeBadge } from '../components/UI';

export default function Dashboard() {
  const { liveCall, wsEvents } = useContext(WSCtx);
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [calls, setCalls] = useState([]);
  const [appts, setAppts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalytics(30),
      api.getCalls({ limit: 6 }),
      api.getAppointments(),
      api.getCallsOverTime(14),
    ]).then(([ana, callsRes, apptRes, chart]) => {
      setAnalytics(ana);
      setCalls(callsRes.calls || []);
      setAppts((apptRes || []).slice(0, 4));
      setChartData((chart || []).map(r => ({ day: new Date(r.day).toLocaleDateString('en',{month:'short',day:'numeric'}), count: parseInt(r.count) })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [wsEvents.length]); // re-fetch when ws events arrive

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300}}><Spinner/></div>;

  const ans = analytics?.callsByOutcome?.answered || 0;
  const total = analytics?.totalCalls || 0;

  return (
    <div>
      {/* Live Call Banner */}
      {liveCall && (
        <div style={{background:'linear-gradient(135deg,rgba(240,90,26,.07),rgba(240,90,26,.02))',border:'1px solid rgba(240,90,26,.22)',borderRadius:9,padding:'13px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:5,background:'var(--accent)',color:'#fff',borderRadius:4,padding:'3px 9px',fontSize:10,fontFamily:'var(--font-mono)',fontWeight:500}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:'#fff',animation:'pulse 1s infinite'}}/>LIVE
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:13}}>{liveCall.from || 'Incoming call'}</div>
            <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',marginTop:1}}>INBOUND · Active</div>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:7}}>
            <Btn size="sm">📄 Transcript</Btn>
            <Btn size="sm" variant="danger">Transfer</Btn>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
        <KPI label="Calls (30d)" value={total} change={`${ans} answered`} changeDir="up"/>
        <KPI label="Answer Rate" value={`${analytics?.answerRate || 0}%`} color="green" change="by ARIA" changeDir="up"/>
        <KPI label="Appointments" value={analytics?.appointments || 0} color="teal" change="booked" changeDir="up"/>
        <KPI label="SMS Recovered" value={analytics?.smsRecoveries || 0} color="yellow" change="missed calls"/>
        <KPI label="Voicemails" value={analytics?.voicemails || 0} change="captured"/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
        {/* Recent Calls */}
        <Card>
          <CardHead title="Recent Calls" meta={`${total} total`}>
            <Btn size="sm" onClick={() => navigate('/calls')} style={{marginLeft:8}}>All →</Btn>
          </CardHead>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Caller','Type','Outcome','Duration',''].map(h => (
                <th key={h} style={{fontSize:10,fontFamily:'var(--font-mono)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',padding:'7px 11px',borderBottom:'1px solid var(--border)',textAlign:'left'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {calls.map(c => (
                <tr key={c.id} onClick={() => navigate(`/calls?id=${c.id}`)} style={{cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.015)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontSize:12}}>
                    <div style={{fontWeight:500}}>{c.caller_name || 'Unknown'}</div>
                    <div style={{color:'var(--text3)',fontSize:10,fontFamily:'var(--font-mono)'}}>{new Date(c.started_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                  </td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}><Tag>{c.call_type}</Tag></td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}>{outcomeBadge(c.outcome)}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text3)'}}>{c.duration_seconds ? `${Math.floor(c.duration_seconds/60)}:${String(c.duration_seconds%60).padStart(2,'0')}` : '—'}</td>
                  <td style={{padding:'9px 11px',borderBottom:'1px solid var(--border)'}}><Btn size="sm">→</Btn></td>
                </tr>
              ))}
              {!calls.length && <tr><td colSpan={5} style={{padding:'20px',textAlign:'center',color:'var(--text3)',fontSize:12}}>No calls yet. Once your Twilio number is configured, calls will appear here.</td></tr>}
            </tbody>
          </table>
        </Card>

        <div>
          {/* Chart */}
          <Card style={{marginBottom:12}}>
            <CardHead title="Call Volume" meta="14 days"/>
            <CardBody>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={chartData} margin={{top:0,right:0,left:0,bottom:0}}>
                    <XAxis dataKey="day" tick={{fontSize:9,fill:'var(--text3)',fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,fontSize:11}} cursor={{fill:'rgba(255,255,255,.04)'}}/>
                    <Bar dataKey="count" fill="var(--accent)" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:11}}>No data yet</div>
              )}
            </CardBody>
          </Card>

          {/* Outcome breakdown */}
          <Card>
            <CardHead title="Outcomes"/>
            <CardBody style={{padding:'10px 14px'}}>
              {Object.entries(analytics?.callsByOutcome || {}).map(([k,v]) => (
                <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:11}}>
                  <span style={{color:'var(--text2)'}}>{k}</span>
                  <span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{v}</span>
                </div>
              ))}
              {!Object.keys(analytics?.callsByOutcome || {}).length && <div style={{fontSize:11,color:'var(--text3)',textAlign:'center',padding:'8px 0'}}>No outcomes yet</div>}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Appointments */}
      {appts.length > 0 && (
        <Card>
          <CardHead title="Upcoming Appointments" meta={`${appts.length} total`}>
            <Btn size="sm" onClick={() => navigate('/appointments')} style={{marginLeft:8}}>All →</Btn>
          </CardHead>
          <div>
            {appts.map(a => (
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:11,padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                <div style={{textAlign:'center',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:5,padding:'5px 9px',flexShrink:0,minWidth:44}}>
                  <div style={{fontSize:8,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{new Date(a.scheduled_at).toLocaleDateString('en',{weekday:'short'}).toUpperCase()}</div>
                  <div style={{fontFamily:'var(--font-head)',fontSize:15,fontWeight:800}}>{new Date(a.scheduled_at).getDate()}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:12}}>{a.contact_name}</div>
                  <div style={{color:'var(--text3)',fontSize:10}}>{a.service_type} · {new Date(a.scheduled_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <Badge color={a.status==='confirmed'?'green':a.status==='cancelled'?'red':'yellow'}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
