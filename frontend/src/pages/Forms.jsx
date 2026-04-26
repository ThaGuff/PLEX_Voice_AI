import { useState } from 'react';
import { SectionHead, Card, CardHead, CardBody, Btn, Badge, Modal, FormGroup } from '../components/UI';

const FORMS = [
  {id:1,name:'Contact Us Form',fields:5,submissions:24,status:'published',embed:true},
  {id:2,name:'Service Request Form',fields:8,submissions:12,status:'published',embed:true},
  {id:3,name:'Emergency Service Request',fields:4,submissions:3,status:'draft',embed:false},
];

export default function Forms() {
  const [modal, setModal] = useState(false);
  const [embedModal, setEmbedModal] = useState(null);

  return (
    <div>
      <SectionHead title="Forms & Funnels" desc="Lead capture forms that feed directly into ARIA CRM"
        action={<Btn variant="primary" icon="+" onClick={()=>setModal(true)}>New Form</Btn>}/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
        {FORMS.map(f => (
          <Card key={f.id} style={{margin:0}}>
            <div style={{padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:13}}>{f.name}</span>
                <Badge color={f.status==='published'?'green':'amber'} dot>{f.status}</Badge>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                <div style={{textAlign:'center',padding:'8px',background:'var(--surface-2)',borderRadius:'var(--r-sm)'}}>
                  <div style={{fontFamily:'var(--font-head)',fontSize:20,fontWeight:700}}>{f.fields}</div>
                  <div style={{fontSize:10,color:'var(--text-4)'}}>Fields</div>
                </div>
                <div style={{textAlign:'center',padding:'8px',background:'var(--surface-2)',borderRadius:'var(--r-sm)'}}>
                  <div style={{fontFamily:'var(--font-head)',fontSize:20,fontWeight:700,color:'var(--green)'}}>{f.submissions}</div>
                  <div style={{fontSize:10,color:'var(--text-4)'}}>Submissions</div>
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <Btn size="xs" variant="primary" style={{flex:1,justifyContent:'center'}}>Edit</Btn>
                <Btn size="xs" onClick={()=>setEmbedModal(f)}>Embed</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHead title="Form Submissions"/>
        <CardBody>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Name','Email','Form','Date','Status'].map(h=><th key={h} style={{fontSize:11,fontWeight:600,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.05em',padding:'7px 12px',borderBottom:'1.5px solid var(--border)',textAlign:'left'}}>{h}</th>)}</tr></thead>
            <tbody>
              {[['Sarah Johnson','sarah@email.com','Contact Us','Apr 25','contacted'],['Mike Rodriguez','mike@hvac.com','Service Request','Apr 24','qualified'],['Lisa Chen','lisa@ins.com','Contact Us','Apr 23','booked']].map(([n,e,f,d,s])=>(
                <tr key={n}><td style={{padding:'9px 12px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:12.5}}>{n}</td><td style={{padding:'9px 12px',borderBottom:'1px solid var(--border)',fontSize:12,color:'var(--text-3)'}}>{e}</td><td style={{padding:'9px 12px',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:11,background:'var(--bg-2)',color:'var(--text-3)',border:'1px solid var(--border)',padding:'2px 6px',borderRadius:4}}>{f}</span></td><td style={{padding:'9px 12px',borderBottom:'1px solid var(--border)',fontSize:11.5,color:'var(--text-4)'}}>{d}</td><td style={{padding:'9px 12px',borderBottom:'1px solid var(--border)'}}><Badge color={s==='booked'?'green':s==='qualified'?'purple':'amber'} dot>{s}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {embedModal && (
        <Modal title={`Embed: ${embedModal.name}`} onClose={()=>setEmbedModal(null)}
          footer={<Btn onClick={()=>setEmbedModal(null)}>Close</Btn>}>
          <div style={{background:'var(--bg-2)',border:'1.5px solid var(--border)',borderRadius:'var(--r-sm)',padding:14,marginBottom:14}}>
            <div style={{fontSize:11.5,fontWeight:600,color:'var(--text-3)',marginBottom:8}}>Embed Code — paste into your website HTML:</div>
            <code style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-2)',lineHeight:1.6,display:'block',wordBreak:'break-all'}}>
              {`<iframe src="https://plexvoiceai-production.up.railway.app/form/${embedModal.id}" width="100%" height="500" frameborder="0"></iframe>`}
            </code>
          </div>
          <Btn variant="primary" full onClick={()=>navigator.clipboard?.writeText(`<iframe src="https://plexvoiceai-production.up.railway.app/form/${embedModal.id}" width="100%" height="500" frameborder="0"></iframe>`)}>Copy Embed Code</Btn>
        </Modal>
      )}

      {modal && (
        <Modal title="New Form" onClose={()=>setModal(false)} footer={<><Btn onClick={()=>setModal(false)}>Cancel</Btn><Btn variant="primary" onClick={()=>setModal(false)}>Create Form</Btn></>}>
          <FormGroup label="Form Name" required><input placeholder="Contact Us Form"/></FormGroup>
          <FormGroup label="Form Type"><select><option>Contact Form</option><option>Service Request</option><option>Lead Capture</option><option>Appointment Request</option></select></FormGroup>
          <FormGroup label="Fields to Include">
            {['Name','Phone','Email','Service Type','Preferred Date','Message','Emergency Contact'].map(f=>(
              <label key={f} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,fontSize:13,cursor:'pointer'}}>
                <input type="checkbox" defaultChecked={['Name','Phone','Email'].includes(f)} style={{width:'auto'}}/> {f}
              </label>
            ))}
          </FormGroup>
        </Modal>
      )}
    </div>
  );
}
