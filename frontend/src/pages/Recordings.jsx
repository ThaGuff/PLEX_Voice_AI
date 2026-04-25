import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, DataTable, OutcomeBadge, Btn } from '../components/UI';

export default function Recordings() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ api.getRecordings().then(r=>setRecs(r||[])).finally(()=>setLoading(false)); },[]);

  const cols = [
    { key:'caller_phone', label:'Caller' },
    { key:'call_type', label:'Type' },
    { key:'outcome', label:'Outcome', render:r=><OutcomeBadge outcome={r.outcome}/> },
    { key:'duration_seconds', label:'Duration', render:r=>r.duration_seconds?`${Math.floor(r.duration_seconds/60)}:${String(r.duration_seconds%60).padStart(2,'0')}`:'—' },
    { key:'created_at', label:'Date', render:r=>new Date(r.created_at).toLocaleDateString() },
    { key:'url', label:'Recording', render:r=>r.url?<Btn size="xs" icon="▶" onClick={()=>window.open(r.url,'_blank')}>Play</Btn>:'—' },
  ];

  return (
    <div>
      <SectionHead title="Recordings" desc="Call recordings stored for 30 days"/>
      <Card style={{marginTop:0}}><DataTable cols={cols} rows={recs} loading={loading} emptyMsg="No recordings yet."/></Card>
    </div>
  );
}
