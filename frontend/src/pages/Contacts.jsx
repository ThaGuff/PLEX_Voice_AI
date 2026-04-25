import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, CardHead, DataTable, Badge, Btn, Modal, FormGroup, OutcomeBadge, Tabs } from '../components/UI';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    const p = { limit:100, search, ...(statusFilter!=='all'?{status:statusFilter}:{}) };
    api.getContacts(p).then(r=>{ setContacts(r.contacts||[]); setTotal(r.total||0); }).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[search,statusFilter]);

  const save = async () => {
    setSaving(true);
    try {
      if (form.id) { const c=await api.updateContact(form.id,form); setContacts(cs=>cs.map(x=>x.id===c.id?c:x)); }
      else { const c=await api.createContact(form); setContacts(cs=>[c,...cs]); }
      setModal(null);
    } catch(e){ console.error(e); }
    finally { setSaving(false); }
  };

  const cols = [
    { key:'name', label:'Name', render:r=>(
      <div>
        <div style={{fontWeight:600,fontSize:13}}>{r.name||'Unknown'}</div>
        <div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text-4)'}}>{r.phone}</div>
      </div>
    )},
    { key:'email', label:'Email', render:r=><span style={{fontSize:12,color:'var(--text-3)'}}>{r.email||'—'}</span> },
    { key:'company', label:'Company', render:r=><span style={{fontSize:12}}>{r.company||'—'}</span> },
    { key:'status', label:'Status', render:r=><OutcomeBadge outcome={r.status}/> },
    { key:'source', label:'Source', render:r=><span style={{fontSize:11,fontFamily:'var(--font-mono)',background:'var(--bg-2)',color:'var(--text-3)',border:'1px solid var(--border)',padding:'2px 6px',borderRadius:4}}>{r.source}</span> },
    { key:'lead_score', label:'Score', render:r=><span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--amber)'}}>{r.lead_score||0}</span> },
    { key:'created_at', label:'Created', render:r=><span style={{fontSize:11,color:'var(--text-4)'}}>{new Date(r.created_at).toLocaleDateString()}</span> },
    { key:'actions', label:'', render:r=><Btn size="xs" onClick={e=>{e.stopPropagation();setForm(r);setModal('edit');}}>Edit</Btn> },
  ];

  return (
    <div>
      <SectionHead
        title="Contacts"
        desc={`${total} contacts — synced from calls and CRM`}
        action={<Btn variant="primary" icon="+" onClick={()=>{setForm({});setModal('create');}}>Add Contact</Btn>}
      />
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone, or email…" style={{maxWidth:300,padding:'7px 12px',fontSize:13}}/>
        <Tabs tabs={['all','new','contacted','qualified','booked','won','lost']} active={statusFilter} onChange={setStatus} style={{marginBottom:0,borderBottom:'none'}}/>
      </div>
      <Card style={{marginTop:0}}>
        <DataTable cols={cols} rows={contacts} loading={loading} emptyMsg="No contacts yet. Contacts are created automatically from inbound calls."
          onRow={r=>{setForm(r);setModal('edit');}}/>
      </Card>

      {modal && (
        <Modal title={modal==='edit'?'Edit Contact':'New Contact'} onClose={()=>setModal(null)} width={480}
          footer={<><Btn onClick={()=>setModal(null)}>Cancel</Btn><Btn variant="primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</Btn></>}>
          {[['Name','name','text'],['Phone','phone','tel'],['Email','email','email'],['Company','company','text'],['Notes','notes','text']].map(([l,k,t])=>(
            <FormGroup key={k} label={l}><input type={t} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></FormGroup>
          ))}
          <FormGroup label="Status">
            <select value={form.status||'new'} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              {['new','contacted','qualified','booked','won','lost'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </FormGroup>
        </Modal>
      )}
    </div>
  );
}
