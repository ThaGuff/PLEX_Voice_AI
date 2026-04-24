// Reports.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHead, CardBody, Btn, Toggle, Spinner } from '../components/UI';

export default function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api.getAnalytics(7).then(setData); }, []);
  if (!data) return <div style={{textAlign:'center',padding:40}}><Spinner/></div>;
  const rows = [
    ['Total Inbound Calls', data.totalCalls],
    ['Answer Rate', `${data.answerRate}%`],
    ['Appointments Booked', data.appointments],
    ['Voicemails Captured', data.voicemails],
    ['SMS Recoveries Sent', data.smsRecoveries],
    ['Missed Calls', data.callsByOutcome?.missed || 0],
    ['Transferred to Human', data.callsByOutcome?.transferred || 0],
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Card>
        <CardHead title="Weekly Summary" meta="Last 7 days">
          <Btn size="sm" style={{marginLeft:8}}>↓ Export PDF</Btn>
          <Btn size="sm">📧 Email</Btn>
        </CardHead>
        <CardBody style={{padding:0}}>
          {rows.map(([l,v]) => (
            <div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:11,color:'var(--text2)'}}>{l}</span>
              <span style={{fontSize:12,fontWeight:600,fontFamily:'var(--font-mono)'}}>{v}</span>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHead title="Scheduled Reports"/>
        <CardBody style={{padding:0}}>
          {[['Daily Summary','Email · 8:00 AM',true],['Weekly Digest','Email · Mon 7:00 AM',true],['Monthly Review','Email · 1st of month',false]].map(([n,s,on]) => (
            <div key={n} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
              <div><div style={{fontSize:12,fontWeight:500}}>{n}</div><div style={{fontSize:10,color:'var(--text3)'}}>{s}</div></div>
              <Toggle on={on} onChange={()=>{}}/>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
