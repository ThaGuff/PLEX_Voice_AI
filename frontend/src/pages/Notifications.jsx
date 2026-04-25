import { useState, useEffect, useContext } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, Badge, Btn, Empty, Spinner, WSCtx } from '../components/UI';
import { WSCtx as WSContext } from '../App';

export default function Notifications() {
  const { setUnreadCount } = useContext(WSContext);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.getNotifications().then(r=>{ setNotifs(r.notifications||[]); }).finally(()=>setLoading(false));
  },[]);

  const markAll = async () => {
    await api.markAllRead();
    setNotifs(n=>n.map(x=>({...x,is_read:true})));
    setUnreadCount(0);
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  return (
    <div>
      <SectionHead title="Notifications" desc="Alerts and activity from ARIA"
        action={notifs.some(n=>!n.is_read)&&<Btn size="sm" onClick={markAll}>Mark All Read</Btn>}/>
      {!notifs.length ? (
        <Card><Empty icon="◇" title="No notifications" desc="You'll see missed call alerts, voicemail notifications, and booking confirmations here."/></Card>
      ) : notifs.map(n=>(
        <div key={n.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',background:n.is_read?'var(--surface)':'var(--green-xlight)',border:`1.5px solid ${n.is_read?'var(--border)':'rgba(39,103,73,.2)'}`,borderRadius:'var(--r-md)',marginBottom:7}}>
          <span style={{fontSize:20,flexShrink:0}}>{n.icon||'🔔'}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{n.title}</div>
            {n.body && <div style={{fontSize:12.5,color:'var(--text-2)',lineHeight:1.5}}>{n.body}</div>}
            <div style={{fontSize:11,color:'var(--text-4)',marginTop:4}}>{new Date(n.created_at).toLocaleString()}</div>
          </div>
          {!n.is_read && <Badge color="green" dot>New</Badge>}
        </div>
      ))}
    </div>
  );
}
