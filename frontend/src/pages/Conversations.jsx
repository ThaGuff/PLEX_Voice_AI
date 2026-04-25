import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, Badge, Spinner, Empty, Btn } from '../components/UI';

export default function Conversations() {
  const [convs, setConvs] = useState([]);
  const [sel, setSel] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ api.getConversations().then(r=>{ setConvs(r||[]); if(r?.length) setSel(r[0]); }).finally(()=>setLoading(false)); },[]);
  useEffect(()=>{ if(sel) api.getMessages(sel.id).then(setMsgs); },[sel]);

  const send = async () => {
    if (!msg.trim()||!sel) return;
    const m = await api.sendMessage(sel.id,{body:msg,direction:'outbound'});
    setMsgs(ms=>[...ms,m]); setMsg('');
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  return (
    <div>
      <SectionHead title="Conversations" desc="SMS and email threads with your contacts"/>
      {!convs.length ? (
        <Card><Empty icon="💬" title="No conversations yet" desc="SMS conversations appear here when ARIA sends follow-up texts or you send outbound messages."/></Card>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:12,height:'calc(100vh - 160px)'}}>
          {/* List */}
          <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
            {convs.map(c=>(
              <div key={c.id} onClick={()=>setSel(c)} style={{padding:'11px 13px',border:`1.5px solid ${sel?.id===c.id?'var(--green)':'var(--border)'}`,borderRadius:'var(--r-md)',cursor:'pointer',background:sel?.id===c.id?'var(--green-xlight)':'var(--surface)',transition:'all var(--t)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontWeight:600,fontSize:13}}>{c.contact_name||c.contact_phone}</span>
                  <Badge color={c.channel==='sms'?'green':'purple'}>{c.channel}</Badge>
                </div>
                <div style={{fontSize:12,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.last_message||'No messages'}</div>
                {c.unread_count>0 && <div style={{marginTop:4}}><Badge color="red" dot>{c.unread_count} unread</Badge></div>}
              </div>
            ))}
          </div>

          {/* Thread */}
          {sel && (
            <div style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:'var(--r-md)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:'1.5px solid var(--border)',fontWeight:600,fontSize:13}}>
                {sel.contact_name||sel.contact_phone} <Badge color={sel.channel==='sms'?'green':'purple'}>{sel.channel}</Badge>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                {msgs.map(m=>(
                  <div key={m.id} style={{display:'flex',justifyContent:m.direction==='outbound'?'flex-end':'flex-start'}}>
                    <div style={{maxWidth:'72%',padding:'9px 13px',borderRadius:12,background:m.direction==='outbound'?'var(--green)':'var(--bg-2)',color:m.direction==='outbound'?'#fff':'var(--text)',fontSize:13,lineHeight:1.5}}>
                      {m.body}
                      <div style={{fontSize:10,opacity:.65,marginTop:3,textAlign:'right'}}>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{padding:'12px 16px',borderTop:'1.5px solid var(--border)',display:'flex',gap:8}}>
                <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a message…" style={{flex:1}}/>
                <Btn variant="primary" onClick={send}>Send</Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
