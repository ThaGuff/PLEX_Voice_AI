import { useState } from 'react';
import { SectionHead, Card, CardHead, CardBody, Btn, Badge, Toggle, Modal, FormGroup } from '../components/UI';

const AUTOMATIONS = [
  {id:1,name:'Missed Call SMS Recovery',trigger:'Call Missed',action:'Send SMS',delay:'Immediately',active:true,runs:67,description:'Automatically texts every missed caller with a follow-up message'},
  {id:2,name:'Appointment Confirmation',trigger:'Appointment Booked',action:'Send SMS + Email',delay:'Immediately',active:true,runs:31,description:'Confirms appointments with callers and adds to Google Calendar'},
  {id:3,name:'Daily Call Summary',trigger:'Daily at 8 AM',action:'Email Report',delay:'8:00 AM',active:true,runs:25,description:'Sends your team a daily summary of calls, bookings, and voicemails'},
  {id:4,name:'Voicemail Transcription Alert',trigger:'Voicemail Received',action:'Slack + SMS Alert',delay:'Immediately',active:false,runs:12,description:'Sends voicemail transcript to your Slack channel and team SMS'},
  {id:5,name:'New Contact → GHL CRM',trigger:'New Contact Created',action:'Create GHL Contact',delay:'Immediately',active:true,runs:84,description:'Automatically creates or updates contacts in GoHighLevel'},
  {id:6,name:'Weekly Performance Report',trigger:'Monday 9 AM',action:'Email Report',delay:'9:00 AM',active:false,runs:4,description:'Weekly digest of call volume, ROI, and AI performance metrics'},
];

export default function Automation() {
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [modal, setModal] = useState(false);

  const toggle = (id) => setAutomations(a=>a.map(x=>x.id===id?{...x,active:!x.active}:x));

  return (
    <div>
      <SectionHead title="Automation" desc="Trigger-based workflows that run automatically"
        action={<Btn variant="primary" icon="+" onClick={()=>setModal(true)}>New Automation</Btn>}/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        {[['Active',automations.filter(a=>a.active).length,'green'],['Total Runs',automations.reduce((s,a)=>s+a.runs,0),'amber'],['Time Saved','18 hrs','blue']].map(([l,v,c])=>(
          <div key={l} style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:'var(--r-md)',padding:'14px 16px'}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>{l}</div>
            <div style={{fontFamily:'var(--font-head)',fontSize:26,fontWeight:700,color:`var(--${c},var(--text))`}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {automations.map(a => (
          <div key={a.id} style={{background:'var(--surface)',border:`1.5px solid ${a.active?'rgba(39,103,73,.2)':'var(--border)'}`,borderRadius:'var(--r-md)',padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:12,transition:'all var(--t)',background:a.active?'var(--green-xlight,#edf7f1)':'var(--surface)'}}>
            <div style={{width:36,height:36,borderRadius:10,background:'var(--surface)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>⚡</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{a.name}</div>
              <div style={{fontSize:11.5,color:'var(--text-3)',marginBottom:8,lineHeight:1.5}}>{a.description}</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:11,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 7px',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{color:'var(--text-4)'}}>Trigger:</span> {a.trigger}
                </span>
                <span style={{fontSize:11,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 7px',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{color:'var(--text-4)'}}>→</span> {a.action}
                </span>
                <span style={{fontSize:11,color:'var(--text-4)'}}>{a.runs} runs total</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              <Badge color={a.active?'green':'gray'} dot>{a.active?'Active':'Paused'}</Badge>
              <Toggle on={a.active} onChange={()=>toggle(a.id)} size="sm"/>
              <Btn size="sm" variant="ghost">Edit</Btn>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="New Automation" subtitle="Create a trigger-based workflow" onClose={()=>setModal(false)}
          footer={<><Btn onClick={()=>setModal(false)}>Cancel</Btn><Btn variant="primary" onClick={()=>setModal(false)}>Create Automation</Btn></>}>
          <FormGroup label="Automation Name" required><input placeholder="e.g. Missed Call Follow-up"/></FormGroup>
          <FormGroup label="Trigger Event" required>
            <select><option>Call Missed</option><option>Voicemail Received</option><option>Appointment Booked</option><option>New Contact</option><option>Daily Schedule</option><option>Weekly Schedule</option></select>
          </FormGroup>
          <FormGroup label="Action">
            <select><option>Send SMS</option><option>Send Email</option><option>Slack Alert</option><option>GHL Workflow</option><option>Webhook POST</option><option>SMS + Email</option></select>
          </FormGroup>
          <FormGroup label="Delay"><select><option>Immediately</option><option>After 5 minutes</option><option>After 1 hour</option><option>Next day</option></select></FormGroup>
        </Modal>
      )}
    </div>
  );
}
