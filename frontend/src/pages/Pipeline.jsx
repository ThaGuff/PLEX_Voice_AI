import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SectionHead, Badge, Spinner, Card, Empty } from '../components/UI';

const STAGES = ['new','contacted','qualified','booked','won','lost'];
const COLORS  = { new:'gray', contacted:'amber', qualified:'purple', booked:'green', won:'green', lost:'red' };

export default function Pipeline() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ api.getContacts({limit:200}).then(r=>setContacts(r.contacts||[])).finally(()=>setLoading(false)); },[]);

  const move = async (id, stage) => {
    await api.updateContact(id,{pipeline_stage:stage});
    setContacts(cs=>cs.map(c=>c.id===id?{...c,pipeline_stage:stage,status:stage}:c));
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  return (
    <div>
      <SectionHead title="Pipeline" desc="Drag contacts through your sales pipeline stages"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,minHeight:'60vh'}}>
        {STAGES.map(stage=>{
          const items = contacts.filter(c=>(c.pipeline_stage||c.status)===stage);
          return (
            <div key={stage} style={{background:'var(--bg-2)',border:'1.5px solid var(--border)',borderRadius:'var(--r-md)',padding:10,minHeight:300}}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); const id=e.dataTransfer.getData('text'); move(id,stage); }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--text-3)'}}>{stage}</div>
                <Badge color={COLORS[stage]}>{items.length}</Badge>
              </div>
              {items.map(c=>(
                <div key={c.id} draggable onDragStart={e=>e.dataTransfer.setData('text',c.id)}
                  style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:'var(--r-sm)',padding:'9px 11px',marginBottom:7,cursor:'grab',boxShadow:'var(--shadow-xs)'}}>
                  <div style={{fontWeight:600,fontSize:12.5,marginBottom:2}}>{c.name||'Unknown'}</div>
                  <div style={{fontSize:11,color:'var(--text-4)',fontFamily:'var(--font-mono)'}}>{c.phone}</div>
                  {c.company && <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{c.company}</div>}
                  <div style={{fontSize:10,color:'var(--amber)',fontWeight:600,marginTop:4}}>Score: {c.lead_score||0}</div>
                </div>
              ))}
              {!items.length && <div style={{fontSize:11,color:'var(--text-4)',textAlign:'center',padding:'20px 0',fontStyle:'italic'}}>Drop here</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
