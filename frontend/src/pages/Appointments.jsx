import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, DataTable, OutcomeBadge, Btn, Modal, FormGroup, Tabs } from '../components/UI';

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('upcoming');

  useEffect(()=>{ api.getAppts().then(r=>setAppts(r||[])).finally(()=>setLoading(false)); },[]);

  const filtered = appts.filter(a => tab==='upcoming' ? new Date(a.scheduled_at)>=new Date() : new Date(a.scheduled_at)<new Date());

  const save = async () => {
    setSaving(true);
    try {
      const a = await api.createAppt(form);
      setAppts(ap=>[...ap,a]); setModal(false);
    } catch(e){ console.error(e); }
    finally { setSaving(false); }
  };

  const cols = [
    { key:'contact_name', label:'Client', render:r=><div><div style={{fontWeight:600,fontSize:13}}>{r.contact_name}</div><div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text-4)'}}>{r.contact_phone}</div></div> },
    { key:'service_type', label:'Service', render:r=><span style={{fontSize:12}}>{r.service_type||'—'}</span> },
    { key:'scheduled_at', label:'Date & Time', render:r=>(
      <div>
        <div style={{fontSize:13,fontWeight:500}}>{new Date(r.scheduled_at).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</div>
        <div style={{fontSize:11,color:'var(--text-3)'}}>{new Date(r.scheduled_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    )},
    { key:'duration_minutes', label:'Duration', render:r=>`${r.duration_minutes||60} min` },
    { key:'booked_via', label:'Via', render:r=><span style={{fontSize:11,fontFamily:'var(--font-mono)',background:'var(--bg-2)',color:'var(--text-3)',border:'1px solid var(--border)',padding:'2px 6px',borderRadius:4}}>{r.booked_via}</span> },
    { key:'status', label:'Status', render:r=><OutcomeBadge outcome={r.status}/> },
    { key:'actions', label:'', render:r=>(
      <div style={{display:'flex',gap:5}}>
        <Btn size="xs" variant="ghost" onClick={()=>api.updateAppt(r.id,{status:'cancelled'}).then(()=>setAppts(ap=>ap.map(a=>a.id===r.id?{...a,status:'cancelled'}:a)))}>Cancel</Btn>
        <Btn size="xs" variant="primary" onClick={()=>api.updateAppt(r.id,{status:'completed'}).then(()=>setAppts(ap=>ap.map(a=>a.id===r.id?{...a,status:'completed'}:a)))}>Complete</Btn>
      </div>
    )},
  ];

  return (
    <div>
      <SectionHead title="Appointments" desc="Booked via ARIA voice agent and manually"
        action={<Btn variant="primary" icon="+" onClick={()=>{setForm({scheduled_at:new Date(Date.now()+86400000).toISOString().slice(0,16)});setModal(true);}}>Book Appointment</Btn>}/>
      <Tabs tabs={[{key:'upcoming',label:'Upcoming'},{key:'past',label:'Past'}]} active={tab} onChange={setTab}/>
      <Card style={{marginTop:0}}>
        <DataTable cols={cols} rows={filtered} loading={loading} emptyMsg="No appointments yet. ARIA books them automatically during calls."/>
      </Card>

      {modal && (
        <Modal title="Book Appointment" onClose={()=>setModal(false)} width={480}
          footer={<><Btn onClick={()=>setModal(false)}>Cancel</Btn><Btn variant="primary" onClick={save} disabled={saving}>{saving?'Booking…':'Book Appointment'}</Btn></>}>
          {[['Client Name *','contact_name','text'],['Phone *','contact_phone','tel'],['Email','contact_email','email'],['Service Type','service_type','text']].map(([l,k,t])=>(
            <FormGroup key={k} label={l}><input type={t} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></FormGroup>
          ))}
          <FormGroup label="Date & Time *"><input type="datetime-local" value={form.scheduled_at||''} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))}/></FormGroup>
          <FormGroup label="Duration (minutes)"><input type="number" value={form.duration_minutes||60} onChange={e=>setForm(f=>({...f,duration_minutes:parseInt(e.target.value)}))}/></FormGroup>
          <FormGroup label="Notes"><textarea value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{minHeight:60}}/></FormGroup>
        </Modal>
      )}
    </div>
  );
}
