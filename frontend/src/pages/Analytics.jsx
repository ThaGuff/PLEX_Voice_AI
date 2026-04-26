import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../lib/api';
import { KPI, Card, CardHead, CardBody, SectionHead, Spinner, Tabs, Badge } from '../components/UI';

const COLORS = ['#00b37d','#f59e0b','#ef4444','#7c3aed','#2563eb'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getAnalytics(days), api.getCallsOverTime(days)]).then(([ana,ct]) => {
      setData(ana);
      setChart((ct||[]).map(r => ({
        day: new Date(r.day).toLocaleDateString('en',{month:'short',day:'numeric'}),
        calls: parseInt(r.total||0),
        answered: parseInt(r.answered||0),
        booked: parseInt(r.booked||0),
        missed: parseInt(r.missed||0),
      })));
    }).finally(() => setLoading(false));
  }, [days]);

  const hourlyData = Array.from({length:12},(_,i) => ({
    hour: ['8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm'][i],
    calls: [4,18,24,22,14,20,18,16,12,8,5,3][i],
  }));

  const intentData = [
    {name:'Booking Request',value:45},
    {name:'General Inquiry',value:30},
    {name:'Pricing Question',value:15},
    {name:'Emergency',value:5},
    {name:'Other',value:5},
  ];

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  return (
    <div>
      <SectionHead
        title="Analytics"
        desc="Deep-dive call performance and business intelligence"
        action={
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {[7,14,30,90].map(d => (
              <button key={d} onClick={()=>setDays(d)} style={{
                padding:'5px 12px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:500,cursor:'pointer',
                background:days===d?'var(--green)':'transparent',
                borderColor:days===d?'var(--green)':'var(--border)',
                color:days===d?'#fff':'var(--text-3)',transition:'all var(--t)'
              }}>{d}d</button>
            ))}
            <button style={{padding:'5px 12px',border:'1.5px solid var(--border)',borderRadius:'var(--r-sm)',fontSize:12,background:'var(--surface)',cursor:'pointer'}}>Export CSV</button>
          </div>
        }
      />

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
        <KPI label="Total Calls" value={data?.totalCalls||0} icon="📞"/>
        <KPI label="Answer Rate" value={`${data?.answerRate||0}%`} color="green" up change="by ARIA"/>
        <KPI label="Avg Duration" value="2:14" change="optimal range"/>
        <KPI label="Revenue Saved" value="$12.4K" color="green" up change="from recoveries"/>
        <KPI label="Cost / Call" value="$1.21" up change="vs $45 human"/>
      </div>

      <Tabs tabs={[{key:'overview',label:'Overview'},{key:'performance',label:'Performance'},{key:'roi',label:'ROI'}]} active={tab} onChange={setTab}/>

      {tab==='overview' && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
            <Card>
              <CardHead title="Call Volume Over Time" subtitle={`Last ${days} days`}/>
              <CardBody>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chart} margin={{top:4,right:0,left:-20,bottom:0}}>
                    <XAxis dataKey="day" tick={{fontSize:10,fill:'var(--text-4)',fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false} interval={Math.floor(chart.length/6)}/>
                    <YAxis tick={{fontSize:10,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
                    <Bar dataKey="answered" name="Answered" fill="var(--green)" radius={[3,3,0,0]} stackId="a"/>
                    <Bar dataKey="booked" name="Booked" fill="var(--amber)" radius={[3,3,0,0]} stackId="a"/>
                    <Bar dataKey="missed" name="Missed" fill="var(--red)" radius={[3,3,0,0]} stackId="a" opacity={.7}/>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
            <Card>
              <CardHead title="Intent Distribution"/>
              <CardBody>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={intentData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {intentData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{fontSize:12}}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                  {intentData.map((d,i) => (
                    <div key={d.name} style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
                      <span style={{width:8,height:8,borderRadius:2,background:COLORS[i],flexShrink:0}}></span>
                      {d.name}: <strong>{d.value}%</strong>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <Card>
              <CardHead title="Hourly Call Pattern"/>
              <CardBody>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={hourlyData} margin={{top:4,right:0,left:-30,bottom:0}}>
                    <XAxis dataKey="hour" tick={{fontSize:9,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
                    <Bar dataKey="calls" fill="var(--green)" radius={[2,2,0,0]} opacity={.7}/>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{fontSize:11,color:'var(--text-4)',textAlign:'center',marginTop:4}}>Peak: 9am–11am · 1pm–3pm</div>
              </CardBody>
            </Card>
            <Card>
              <CardHead title="Sentiment Analysis"/>
              <CardBody>
                {[['😊 Positive','68%','var(--green)',68],['😐 Neutral','24%','var(--amber)',24],['😤 Negative','8%','var(--red)',8]].map(([l,v,c,p]) => (
                  <div key={l} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                    <div style={{flex:1,fontSize:12,color:'var(--text-2)'}}>{l}</div>
                    <div style={{flex:2,background:'var(--bg-3)',borderRadius:3,height:5,overflow:'hidden'}}><div style={{height:'100%',background:c,width:`${p}%`,borderRadius:3,transition:'width .5s'}}></div></div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:600,color:'var(--text)',minWidth:32,textAlign:'right'}}>{v}</div>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHead title="AI Performance"/>
              <CardBody>
                {[['Response accuracy','96%','var(--green)',96],['Booking conversion','67%','var(--amber)',67],['FAQ match rate','88%','var(--green)',88],['Caller satisfaction','91%','var(--green)',91]].map(([l,v,c,p]) => (
                  <div key={l} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                    <div style={{flex:1,fontSize:12,color:'var(--text-2)'}}>{l}</div>
                    <div style={{flex:2,background:'var(--bg-3)',borderRadius:3,height:5,overflow:'hidden'}}><div style={{height:'100%',background:c,width:`${p}%`,borderRadius:3}}></div></div>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:600,color:'var(--text)',minWidth:32,textAlign:'right'}}>{v}</div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {tab==='roi' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Card>
            <CardHead title="ROI Summary"/>
            <CardBody style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {label:'Revenue Recovered via SMS',value:'$12,400',sub:'18 missed calls → recovered',color:'green'},
                {label:'Labor Cost Saved',value:'$11,115',sub:'247 calls × $45 human cost',color:'blue'},
                {label:'ARIA Platform Cost',value:'$597',sub:'Monthly subscription',color:'amber'},
                {label:'Net Monthly Benefit',value:'$22,918',sub:'Pure profit from ARIA',color:'green'},
              ].map(r => (
                <div key={r.label} style={{padding:14,background:`var(--${r.color}-xlight,var(--surface-2))`,border:`1px solid rgba(0,0,0,.06)`,borderRadius:'var(--r-sm)'}}>
                  <div style={{fontSize:11,fontWeight:700,color:`var(--${r.color},var(--text-3))`,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>{r.label}</div>
                  <div style={{fontFamily:'var(--font-head)',fontSize:28,fontWeight:700,color:`var(--${r.color},var(--text))`,lineHeight:1}}>{r.value}</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>{r.sub}</div>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Monthly ROI Over Time"/>
            <CardBody>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={[
                  {month:'Jan',roi:8200},{month:'Feb',roi:9400},{month:'Mar',roi:10800},
                  {month:'Apr',roi:12400},{month:'May',roi:14200},{month:'Jun',roi:15800},
                ]} margin={{top:4,right:0,left:-10,bottom:0}}>
                  <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={v=>`$${v.toLocaleString()}`} contentStyle={{fontSize:12}}/>
                  <Area type="monotone" dataKey="roi" stroke="var(--green)" fill="var(--green-xlight,#edf7f1)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}

      {tab==='performance' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Card>
            <CardHead title="Call Outcomes by Hour"/>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData} margin={{top:4,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="hour" tick={{fontSize:10,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{fontSize:12}}/>
                  <Bar dataKey="calls" fill="var(--green)" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Week-over-Week Comparison"/>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[
                  {day:'Mon',thisWeek:18,lastWeek:12},{day:'Tue',thisWeek:24,lastWeek:18},
                  {day:'Wed',thisWeek:20,lastWeek:15},{day:'Thu',thisWeek:28,lastWeek:22},
                  {day:'Fri',thisWeek:22,lastWeek:19},{day:'Sat',thisWeek:14,lastWeek:10},
                ]} margin={{top:4,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="day" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{fontSize:12}}/>
                  <Line type="monotone" dataKey="thisWeek" stroke="var(--green)" strokeWidth={2} dot={false} name="This Week"/>
                  <Line type="monotone" dataKey="lastWeek" stroke="var(--border-2)" strokeWidth={2} dot={false} name="Last Week" strokeDasharray="4 2"/>
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
