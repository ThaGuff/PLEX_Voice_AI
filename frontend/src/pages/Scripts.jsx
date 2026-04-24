// Scripts.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHead, CardBody, Btn, Modal, FormGroup, Spinner, Badge } from '../components/UI';

export default function Scripts() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ question:'', answer:'', category:'general' });
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => { api.getFAQs().then(r => setFaqs(r||[])).finally(()=>setLoading(false)); }, []);

  const add = async () => {
    const faq = await api.createFAQ(form);
    setFaqs(f=>[...f, faq]); setShowAdd(false); setForm({question:'',answer:'',category:'general'});
  };
  const del = async (id) => {
    await api.deleteFAQ(id); setFaqs(f=>f.filter(x=>x.id!==id));
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:12}}>
      <div>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <Btn variant="primary" size="sm" onClick={()=>setShowAdd(true)}>+ Add FAQ</Btn>
        </div>
        {loading ? <Spinner/> : (
          <Card>
            <CardHead title="FAQ Library" meta={`${faqs.length} entries`}/>
            {faqs.map(f => (
              <div key={f.id} style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontWeight:600,fontSize:12,marginBottom:5}}>{f.question}</div>
                <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5,marginBottom:7}}>{f.answer}</div>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  <Badge color="gray">{f.category}</Badge>
                  <span style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',marginLeft:4}}>used {f.usage_count}x</span>
                  <Btn size="sm" style={{marginLeft:'auto'}} onClick={()=>del(f.id)}>🗑</Btn>
                </div>
              </div>
            ))}
            {!faqs.length && <div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:12}}>No FAQs yet. Add your first one.</div>}
          </Card>
        )}
      </div>
      <div>
        <Card>
          <CardHead title="Transfer Rules"/>
          <CardBody style={{fontSize:12,color:'var(--text2)',lineHeight:1.7}}>
            Configure transfer rules in Agent Builder under the transfer feature settings. Transfer number is set per-agent.
          </CardBody>
        </Card>
      </div>
      {showAdd && (
        <Modal title="Add FAQ" onClose={()=>setShowAdd(false)}
          footer={<><Btn variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn variant="primary" onClick={add}>Add FAQ</Btn></>}>
          <FormGroup label="Question"><input value={form.question} onChange={e=>setF('question',e.target.value)} placeholder="e.g. Do you offer same-day service?"/></FormGroup>
          <FormGroup label="Answer"><textarea value={form.answer} onChange={e=>setF('answer',e.target.value)} style={{minHeight:80,resize:'vertical'}} placeholder="The answer ARIA will speak..."/></FormGroup>
          <FormGroup label="Category">
            <select value={form.category} onChange={e=>setF('category',e.target.value)}>
              {['general','pricing','scheduling','service_areas','emergency'].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </FormGroup>
        </Modal>
      )}
    </div>
  );
}
