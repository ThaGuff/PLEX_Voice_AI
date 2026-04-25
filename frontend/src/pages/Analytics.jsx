import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../lib/api';
import { KPI, Card, CardHead, CardBody, SectionHead, Tabs, Spinner } from '../components/UI';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    Promise.all([api.getAnalytics(days), api.getCallsOverTime(days)]).then(([ana,ct])=>{
      setData(ana);
      setChart((ct||[]).map(r=>({
        day: new Date(r.day).toLocaleDateString('en',{month:'short',day:'numeric'}),
        calls:parseInt(r.total||0), answered:parseInt(r.answered||0),
        booked:parseInt(r.booked||0), missed:parseInt(r.missed||0),
      })));
    }).finally(()=>setLoading(false));
  },[days]);

  const COLORS = ['#276749','#b07d2c','#b83232','#4a2882','#9e7c0a'];
  const pieData = data ? Object.entries(data.byOutcome||{}).map(([k,v])=>({name:k,value:v})) : [];

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  return (
    <div>
      <SectionHead title="Analytics" desc="Call performance and business insights"
        action={
          <div style={{display:'flex',gap:6}}>
            {[7,14,30,90].map(d=>(
              <button key={d} onClick={()=>setDays(d)} style={{padding:'5px 12px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:500,cursor:'pointer',background:days===d?'var(--green)':'transparent',borderColor:days===d?'var(--green)':'var(--border)',color:days===d?'#fff':'var(--text-3)',transition:'all var(--t)'}}>
                {d}d
              </button>
            ))}
          </div>
        }/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
        <KPI label="Total Calls" value={data?.totalCalls||0} icon="📞"/>
        <KPI label="Answer Rate" value={`${data?.answerRate||0}%`} icon="✓" color="green" up change="by ARIA"/>
        <KPI label="Appointments" value={data?.appointments||0} icon="📅" color="green"/>
        <KPI label="SMS Recoveries" value={data?.smsRecoveries||0} icon="💬" color="amber"/>
        <KPI label="New Contacts" value={data?.newContacts||0} icon="◉"/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <CardHead title="Calls Over Time"/>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chart} margin={{top:4,right:0,left:-20,bottom:0}}>
                <XAxis dataKey="day" tick={{fontSize:10,fill:'var(--text-4)',fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
                <Bar dataKey="answered" name="Answered" fill="var(--green)" radius={[3,3,0,0]} stackId="a"/>
                <Bar dataKey="booked" name="Booked" fill="var(--amber)" radius={[3,3,0,0]} stackId="a"/>
                <Bar dataKey="missed" name="Missed" fill="var(--red)" radius={[3,3,0,0]} opacity={.6} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Outcome Distribution"/>
          <CardBody>
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-4)',fontSize:12}}>No data yet</div>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
