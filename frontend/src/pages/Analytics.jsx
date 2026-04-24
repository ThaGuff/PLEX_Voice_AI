import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../lib/api';
import { Card, CardHead, CardBody, KPI, Spinner } from '../components/UI';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getAnalytics(days), api.getCallsOverTime(days)])
      .then(([ana, ct]) => {
        setData(ana);
        setChart((ct||[]).map(r => ({ day: new Date(r.day).toLocaleDateString('en',{month:'short',day:'numeric'}), calls: parseInt(r.count) })));
      }).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div style={{textAlign:'center',padding:40}}><Spinner/></div>;

  const outcomeColors = { answered:'#22c55e', booked:'#14b8a6', voicemail:'#f59e0b', transferred:'#3b82f6', missed:'#ef4444' };
  const pieData = Object.entries(data?.callsByOutcome||{}).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        {[7,14,30,90].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid var(--border2)',background: days===d ? 'var(--accent)' : 'transparent',color: days===d ? '#fff' : 'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>
            {d}d
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <KPI label={`Calls (${days}d)`} value={data?.totalCalls||0} changeDir="up" change="total inbound"/>
        <KPI label="Answer Rate" value={`${data?.answerRate||0}%`} color="green" changeDir="up"/>
        <KPI label="Appointments" value={data?.appointments||0} color="teal" changeDir="up"/>
        <KPI label="SMS Recoveries" value={data?.smsRecoveries||0} color="yellow"/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <CardHead title="Call Volume Over Time" meta={`${days} days`}/>
          <CardBody>
            {chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chart} margin={{top:4,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="day" tick={{fontSize:9,fill:'var(--text3)',fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:9,fill:'var(--text3)',fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,fontSize:11}} cursor={{fill:'rgba(255,255,255,.04)'}}/>
                  <Bar dataKey="calls" fill="var(--accent)" radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{height:140,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:11}}>No data for this period</div>}
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Outcome Breakdown"/>
          <CardBody>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={outcomeColors[entry.name] || '#5a6168'}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{height:120,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:11}}>No data</div>}
            <div style={{marginTop:8}}>
              {pieData.map(d => (
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                  <div style={{width:8,height:8,borderRadius:2,background:outcomeColors[d.name]||'var(--border2)',flexShrink:0}}/>
                  <span style={{fontSize:10,color:'var(--text2)',flex:1}}>{d.name}</span>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text3)'}}>{d.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
