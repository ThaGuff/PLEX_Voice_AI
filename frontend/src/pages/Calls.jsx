import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHead, Btn, DataTable, OutcomeBadge, SectionHead, Badge, Tabs } from '../components/UI';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const p = filter==='all' ? {} : { outcome: filter };
    api.getCalls({ ...p, limit:100 }).then(r => { setCalls(r.calls||[]); setTotal(r.total||0); }).finally(()=>setLoading(false));
  }, [filter]);

  const cols = [
    { key:'caller_phone', label:'Caller', render: r => (
      <div>
        <div style={{fontWeight:500,fontSize:12.5}}>{r.caller_name||r.caller_phone}</div>
        {r.caller_name && <div style={{fontSize:11,color:'var(--text-4)',fontFamily:'var(--font-mono)'}}>{r.caller_phone}</div>}
      </div>
    )},
    { key:'call_type', label:'Type', render: r => <span style={{fontSize:11,fontFamily:'var(--font-mono)',background:'var(--bg-2)',color:'var(--text-3)',border:'1px solid var(--border)',padding:'2px 6px',borderRadius:4}}>{r.call_type}</span> },
    { key:'outcome', label:'Outcome', render: r => <OutcomeBadge outcome={r.outcome}/> },
    { key:'duration_seconds', label:'Duration', render: r => r.duration_seconds ? `${Math.floor(r.duration_seconds/60)}:${String(r.duration_seconds%60).padStart(2,'0')}` : '—' },
    { key:'started_at', label:'Date/Time', render: r => (
      <div>
        <div style={{fontSize:12}}>{new Date(r.started_at).toLocaleDateString()}</div>
        <div style={{fontSize:11,color:'var(--text-4)'}}>{new Date(r.started_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    )},
    { key:'summary', label:'Summary', render: r => <span style={{fontSize:11.5,color:'var(--text-3)',maxWidth:240,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.summary||'—'}</span> },
  ];

  return (
    <div>
      <SectionHead title="Call Log" desc={`${total} total calls`}/>
      <Tabs tabs={['all','answered','booked','missed','voicemail','transferred']} active={filter} onChange={setFilter}/>
      <Card style={{marginTop:0}}>
        <DataTable cols={cols} rows={calls} loading={loading} emptyMsg="No calls yet. Configure Twilio to start receiving calls."/>
      </Card>
    </div>
  );
}
