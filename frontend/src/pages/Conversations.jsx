import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, Badge, Spinner, Empty, Btn } from '../components/UI';

const DEMO_CONVS = [
  {id:'c1',contact_name:'Sarah Johnson',contact_phone:'(256) 555-0112',channel:'sms',status:'open',last_message:'Thank you! See you Tuesday at 10am 👍',last_message_at:new Date(Date.now()-9*60000),unread_count:0},
  {id:'c2',contact_name:'Tom Williams',contact_phone:'(256) 555-0456',channel:'sms',status:'open',last_message:'Hi! We missed your call at PLEX Automation...',last_message_at:new Date(Date.now()-22*60000),unread_count:1},
  {id:'c3',contact_name:'Mike Rodriguez',contact_phone:'(256) 555-0234',channel:'sms',status:'open',last_message:'Can you confirm my appointment time?',last_message_at:new Date(Date.now()-60*60000),unread_count:2},
  {id:'c4',contact_name:'Lisa Chen',contact_phone:'(256) 555-0345',channel:'email',status:'closed',last_message:'Great service, thanks for following up!',last_message_at:new Date(Date.now()-2*3600000),unread_count:0},
];

const DEMO_MSGS = {
  c1:[
    {id:'m1',direction:'inbound',body:'Hi, I just had a call with ARIA and booked an appointment for Tuesday.',created_at:new Date(Date.now()-25*60000)},
    {id:'m2',direction:'outbound',body:'Hi Sarah! Thanks for booking with us. Your HVAC appointment is confirmed for Tuesday April 26 at 10:00 AM. Reply STOP to opt out.',created_at:new Date(Date.now()-24*60000)},
    {id:'m3',direction:'inbound',body:'Thank you! See you Tuesday at 10am 👍',created_at:new Date(Date.now()-9*60000)},
  ],
  c2:[
    {id:'m4',direction:'outbound',body:"Hi! We missed your call at PLEX Automation. We'd love to help — reply here or call us back anytime. Reply STOP to opt out.",created_at:new Date(Date.now()-22*60000)},
  ],
  c3:[
    {id:'m5',direction:'inbound',body:'Can you confirm my appointment time?',created_at:new Date(Date.now()-65*60000)},
    {id:'m6',direction:'outbound',body:"Hi Mike! Your appointment is Wednesday April 27 at 2:00 PM. Let us know if you need to reschedule.",created_at:new Date(Date.now()-60*60000)},
  ],
};

export default function Conversations() {
  const [sel, setSel] = useState(DEMO_CONVS[0]);
  const [msgs, setMsgs] = useState(DEMO_MSGS['c1']||[]);
  const [msg, setMsg] = useState('');
  const msgEnd = useRef(null);

  const selectConv = (c) => {
    setSel(c);
    setMsgs(DEMO_MSGS[c.id]||[]);
  };

  const send = () => {
    if (!msg.trim()) return;
    const newMsg = {id:'m'+Date.now(),direction:'outbound',body:msg,created_at:new Date()};
    setMsgs(m=>[...m,newMsg]);
    setMsg('');
    setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:'smooth'}),50);
  };

  const fmtTime = (d) => {
    const diff = Math.floor((Date.now()-new Date(d))/60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  return (
    <div>
      <SectionHead title="Conversations" desc="SMS and email threads with your contacts"/>
      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:12,height:'calc(100vh - 180px)'}}>
        {/* List */}
        <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:5}}>
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            <input placeholder="Search conversations…" style={{flex:1}}/>
          </div>
          {DEMO_CONVS.map(c => (
            <div key={c.id} onClick={()=>selectConv(c)}
              style={{padding:'11px 13px',border:`1.5px solid ${sel?.id===c.id?'var(--green)':'var(--border)'}`,borderRadius:'var(--r-md)',cursor:'pointer',background:sel?.id===c.id?'var(--green-xlight)':'var(--surface)',transition:'all var(--t)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontWeight:700,fontSize:13}}>{c.contact_name}</span>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <Badge color={c.channel==='sms'?'green':'purple'}>{c.channel}</Badge>
                  {c.unread_count>0 && <span style={{background:'var(--red)',color:'#fff',borderRadius:10,fontSize:9,padding:'1px 5px',fontWeight:700}}>{c.unread_count}</span>}
                </div>
              </div>
              <div style={{fontSize:11.5,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{c.last_message}</div>
              <div style={{fontSize:10.5,color:'var(--text-4)'}}>{fmtTime(c.last_message_at)}</div>
            </div>
          ))}
        </div>

        {/* Thread */}
        {sel && (
          <div style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:'var(--r-md)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1.5px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'var(--green-light)',border:'1.5px solid rgba(39,103,73,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--green)',fontSize:13}}>
                {sel.contact_name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13}}>{sel.contact_name}</div>
                <div style={{fontSize:11,color:'var(--text-4)',fontFamily:'var(--font-mono)'}}>{sel.contact_phone}</div>
              </div>
              <Badge color={sel.channel==='sms'?'green':'purple'}>{sel.channel}</Badge>
              <Btn size="sm">Call Back</Btn>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
              {msgs.map(m => (
                <div key={m.id} style={{display:'flex',justifyContent:m.direction==='outbound'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'72%',padding:'9px 13px',borderRadius:12,background:m.direction==='outbound'?'var(--green)':'var(--bg-2)',color:m.direction==='outbound'?'#fff':'var(--text)',fontSize:13,lineHeight:1.5}}>
                    {m.body}
                    <div style={{fontSize:10,opacity:.65,marginTop:3,textAlign:'right'}}>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                </div>
              ))}
              <div ref={msgEnd}/>
            </div>
            <div style={{padding:'12px 16px',borderTop:'1.5px solid var(--border)',display:'flex',gap:8}}>
              <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={`Message ${sel.contact_name}…`} style={{flex:1}}/>
              <Btn variant="primary" onClick={send}>Send</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
