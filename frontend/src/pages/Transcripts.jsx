import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, CardHead, CardBody, Empty, Spinner, OutcomeBadge } from '../components/UI';

export default function Transcripts() {
  const [calls, setCalls] = useState([]);
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ api.getCalls({limit:50}).then(r=>{ const t=(r.calls||[]).filter(c=>c.transcript||c.summary); setCalls(t); if(t.length) setSel(t[0]); }).finally(()=>setLoading(false)); },[]);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  return (
    <div>
      <SectionHead title="Transcripts" desc="Full call transcripts and AI summaries"/>
      {!calls.length ? (
        <Card><Empty icon="≡" title="No transcripts yet" desc="Call transcripts appear here after calls complete. Requires Deepgram or Twilio transcription enabled."/></Card>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:12}}>
          <div>
            {calls.map(c=>(
              <div key={c.id} onClick={()=>setSel(c)} style={{padding:'10px 13px',border:`1.5px solid ${sel?.id===c.id?'var(--green)':'var(--border)'}`,borderRadius:'var(--r-sm)',cursor:'pointer',background:sel?.id===c.id?'var(--green-xlight)':'var(--surface)',marginBottom:6,transition:'all var(--t)'}}>
                <div style={{fontWeight:500,fontSize:12.5}}>{c.caller_name||c.caller_phone}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{new Date(c.started_at).toLocaleDateString()}</div>
                <OutcomeBadge outcome={c.outcome}/>
              </div>
            ))}
          </div>
          {sel && (
            <Card>
              <CardHead title={sel.caller_name||sel.caller_phone} subtitle={new Date(sel.started_at).toLocaleString()}/>
              <CardBody>
                {sel.summary && <div style={{padding:'11px 13px',background:'var(--green-xlight)',border:'1.5px solid rgba(39,103,73,.15)',borderRadius:'var(--r-sm)',marginBottom:14}}><div style={{fontSize:11,fontWeight:600,color:'var(--green)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>AI Summary</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.6}}>{sel.summary}</div></div>}
                {sel.transcript && <div><div style={{fontSize:11,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Full Transcript</div><div style={{fontSize:13,lineHeight:1.8,color:'var(--text-2)',whiteSpace:'pre-wrap',fontFamily:'var(--font-mono)',background:'var(--bg-2)',padding:13,borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>{sel.transcript}</div></div>}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
