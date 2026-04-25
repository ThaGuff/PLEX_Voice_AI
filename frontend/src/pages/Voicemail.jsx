import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardHead, CardBody, Btn, Badge, SectionHead, Empty, Spinner } from '../components/UI';

export default function Voicemail() {
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVoicemails().then(r=>setVMs(r||[])).finally(()=>setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.markVMRead(id);
    setVMs(v => v.map(m => m.id===id ? {...m,is_read:true} : m));
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  return (
    <div>
      <SectionHead title="Voicemail" desc={`${vms.filter(v=>!v.is_read).length} unread`}/>
      {!vms.length ? (
        <Card><Empty icon="📬" title="No voicemails" desc="Voicemails appear here when callers leave messages after hours or when ARIA routes them to voicemail."/></Card>
      ) : vms.map(vm=>(
        <Card key={vm.id} style={{marginBottom:8}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 17px'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:vm.is_read?'var(--bg-2)':'var(--green-light)',border:`1.5px solid ${vm.is_read?'var(--border)':'rgba(39,103,73,.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>📬</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontWeight:600,fontSize:13}}>{vm.caller_name||vm.caller_phone}</span>
                {!vm.is_read && <Badge color="green" dot>New</Badge>}
                <span style={{fontSize:11,color:'var(--text-4)',marginLeft:'auto'}}>{new Date(vm.created_at).toLocaleString()}</span>
              </div>
              {vm.transcript && <div style={{fontSize:12.5,color:'var(--text-2)',lineHeight:1.6,marginBottom:8,background:'var(--bg-2)',padding:'8px 11px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>&ldquo;{vm.transcript}&rdquo;</div>}
              <div style={{display:'flex',gap:7}}>
                {vm.recording_url && <Btn size="sm" icon="▶" onClick={()=>window.open(vm.recording_url,'_blank')}>Play</Btn>}
                {!vm.is_read && <Btn size="sm" variant="primary" onClick={()=>markRead(vm.id)}>Mark Read</Btn>}
                <span style={{fontSize:11,color:'var(--text-4)',display:'flex',alignItems:'center',gap:3}}>⏱ {vm.duration_seconds||0}s</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
