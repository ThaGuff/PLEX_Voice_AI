import { useState } from 'react';
import { SectionHead, Card, CardHead, CardBody, Btn, Badge, Tabs, Empty, KPI, Modal, FormGroup } from '../components/UI';

const CAMPS = [
  {id:1,name:'Spring HVAC Promotion',type:'sms',status:'active',sent:142,delivered:138,opened:89,replied:23,created:'Apr 20'},
  {id:2,name:'Missed Call Recovery',type:'sms',status:'active',sent:67,delivered:65,opened:52,replied:18,created:'Apr 22'},
  {id:3,name:'Insurance Review Reminder',type:'email',status:'draft',sent:0,delivered:0,opened:0,replied:0,created:'Apr 24'},
];

export default function Campaigns() {
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('all');

  return (
    <div>
      <SectionHead title="Campaigns" desc="SMS and email campaigns to your contact list"
        action={<Btn variant="primary" icon="+" onClick={()=>setModal(true)}>New Campaign</Btn>}/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <KPI label="Total Sent" value="209" icon="📤"/>
        <KPI label="Delivered" value="203" color="green" up change="97% rate"/>
        <KPI label="Replies" value="41" color="amber" change="20% reply rate"/>
        <KPI label="Bookings" value="12" color="green" up change="from campaigns"/>
      </div>

      <Tabs tabs={['all','active','draft','completed']} active={tab} onChange={setTab}/>

      {CAMPS.filter(c=>tab==='all'||c.status===tab).map(c => (
        <Card key={c.id}>
          <div style={{padding:'13px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{c.name}</div>
              <div style={{display:'flex',gap:6}}>
                <Badge color={c.type==='sms'?'green':'purple'}>{c.type.toUpperCase()}</Badge>
                <Badge color={c.status==='active'?'green':c.status==='draft'?'amber':'gray'} dot>{c.status}</Badge>
                <span style={{fontSize:11,color:'var(--text-4)'}}>Created {c.created}</span>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,80px)',gap:8,textAlign:'center'}}>
              {[['Sent',c.sent],['Delivered',c.delivered],['Opened',c.opened],['Replied',c.replied]].map(([l,v])=>(
                <div key={l}>
                  <div style={{fontFamily:'var(--font-head)',fontSize:18,fontWeight:700,color:'var(--text)'}}>{v}</div>
                  <div style={{fontSize:10,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.05em'}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:7}}>
              {c.status==='draft'&&<Btn variant="primary" size="sm">Launch</Btn>}
              {c.status==='active'&&<Btn size="sm">Pause</Btn>}
              <Btn size="sm" variant="ghost">Edit</Btn>
            </div>
          </div>
        </Card>
      ))}

      {modal && (
        <Modal title="New Campaign" subtitle="Create an SMS or email campaign" onClose={()=>setModal(false)}
          footer={<><Btn onClick={()=>setModal(false)}>Cancel</Btn><Btn variant="primary" onClick={()=>setModal(false)}>Create Campaign</Btn></>}>
          <FormGroup label="Campaign Name" required><input placeholder="e.g. Spring HVAC Special"/></FormGroup>
          <FormGroup label="Channel"><select><option>SMS</option><option>Email</option></select></FormGroup>
          <FormGroup label="Target Audience"><select><option>All Contacts</option><option>New Contacts</option><option>Missed Callers</option><option>Booked - Past 30 Days</option></select></FormGroup>
          <FormGroup label="Message" required><textarea style={{minHeight:80}} placeholder="Hi {first_name}! This is {business_name}..."/></FormGroup>
          <FormGroup label="Schedule"><select><option>Send Now</option><option>Schedule for Later</option></select></FormGroup>
        </Modal>
      )}
    </div>
  );
}
