import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthCtx, WSCtx } from '../App';

const nav = [
  { group: 'Overview', items: [
    { to: '/', label: 'Dashboard', ico: '⬛' },
    { to: '/calls', label: 'Call Log', ico: '📞', badge: 'calls' },
    { to: '/recordings', label: 'Recordings', ico: '🎙️' },
    { to: '/transcripts', label: 'Transcripts', ico: '📄' },
  ]},
  { group: 'Manage', items: [
    { to: '/appointments', label: 'Appointments', ico: '📅' },
    { to: '/voicemail', label: 'Voicemail', ico: '📬', badge: 'vm' },
  ]},
  { group: 'Build', items: [
    { to: '/agent-builder', label: 'Agent Builder', ico: '⚡' },
    { to: '/scripts', label: 'Scripts & FAQ', ico: '📝' },
    { to: '/settings', label: 'Phone Setup', ico: '📱' },
  ]},
  { group: 'Insights', items: [
    { to: '/analytics', label: 'Analytics', ico: '📊' },
    { to: '/reports', label: 'Reports', ico: '📋' },
    { to: '/crm', label: 'CRM Sync', ico: '🔗' },
    { to: '/notifications', label: 'Notifications', ico: '🔔', badge: 'notif' },
  ]},
];

const s = {
  shell: { display:'flex', height:'100vh', overflow:'hidden' },
  sidebar: { width:220, minWidth:220, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' },
  logo: { padding:'18px 16px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:9 },
  logoIcon: { width:32, height:32, background:'var(--accent)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:800, fontSize:13, color:'#fff', flexShrink:0 },
  logoText: { fontFamily:'var(--font-head)', fontWeight:800, fontSize:16, letterSpacing:'-.3px' },
  logoBadge: { fontSize:9, fontFamily:'var(--font-mono)', color:'var(--accent)', background:'rgba(240,90,26,.12)', border:'1px solid rgba(240,90,26,.2)', borderRadius:3, padding:'1px 5px', marginTop:1, display:'inline-block' },
  navArea: { flex:1, padding:8, overflowY:'auto' },
  grp: { fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text3)', letterSpacing:'.08em', padding:'10px 8px 4px', textTransform:'uppercase' },
  foot: { padding:10, borderTop:'1px solid var(--border)' },
  agentCard: { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:9 },
  pulseDot: { width:7, height:7, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 5px var(--green)', animation:'pulse 2s infinite', flexShrink:0 },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  topbar: { background:'var(--surface)', borderBottom:'1px solid var(--border)', height:52, padding:'0 20px', display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  content: { flex:1, overflowY:'auto', padding:'18px 20px' },
};

export default function Layout({ children }) {
  const { user, org, logout } = useContext(AuthCtx);
  const { liveCall, unreadCount } = useContext(WSCtx);
  const navigate = useNavigate();

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>AR</div>
          <div>
            <div style={s.logoText}>ARIA</div>
            <div style={s.logoBadge}>v2 PLATFORM</div>
          </div>
        </div>
        <div style={s.navArea}>
          {nav.map(grp => (
            <div key={grp.group}>
              <div style={s.grp}>{grp.group}</div>
              {grp.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}
                  style={({ isActive }) => ({
                    display:'flex', alignItems:'center', gap:9, padding:'7px 9px',
                    borderRadius:6, cursor:'pointer', textDecoration:'none',
                    fontSize:12.5, fontWeight:500, transition:'.12s', marginBottom:1,
                    ...(isActive
                      ? { background:'linear-gradient(135deg,rgba(240,90,26,.15),rgba(240,90,26,.04))', color:'var(--accent)', border:'1px solid rgba(240,90,26,.18)' }
                      : { color:'var(--text2)', border:'1px solid transparent' }
                    )
                  })}>
                  <span style={{width:15,textAlign:'center',fontSize:13,flexShrink:0}}>{item.ico}</span>
                  {item.label}
                  {item.badge === 'notif' && unreadCount > 0 && (
                    <span style={{marginLeft:'auto',background:'var(--accent)',color:'#fff',borderRadius:9,fontSize:9,padding:'1px 5px',fontFamily:'var(--font-mono)'}}>{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
        <div style={s.foot}>
          <div style={s.agentCard}>
            <div style={liveCall ? {...s.pulseDot, background:'var(--accent)', boxShadow:'0 0 5px var(--accent)'} : s.pulseDot}/>
            <div>
              <div style={{fontSize:12,fontWeight:600}}>{liveCall ? 'Live Call' : 'Agent Live'}</div>
              <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{org?.name || 'ARIA'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.topbar}>
          <div style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:17,letterSpacing:'-.3px'}}>{org?.name || 'ARIA Platform'}</div>
          {org?.twilio_phone_number && (
            <div style={{display:'flex',alignItems:'center',gap:5,background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:5,padding:'3px 9px',fontFamily:'var(--font-mono)',fontSize:11}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'var(--green)'}}/>
              {org.twilio_phone_number}
            </div>
          )}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
            <button onClick={() => { navigate('/notifications'); }} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:'transparent',color:'var(--text2)',border:'1px solid var(--border2)'}}>
              🔔{unreadCount > 0 && <span style={{background:'var(--red)',color:'#fff',borderRadius:6,fontSize:9,padding:'1px 4px'}}>{unreadCount}</span>}
            </button>
            <button onClick={() => navigate('/agent-builder')} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:6,fontSize:12,fontWeight:600,background:'var(--accent)',color:'#fff',border:'none'}}>
              + New Agent
            </button>
            <div onClick={logout} title="Logout" style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,rgba(240,90,26,.25),rgba(240,90,26,.08))',color:'var(--accent)',border:'1px solid rgba(240,90,26,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,cursor:'pointer'}}>
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </div>
        <div style={s.content}>{children}</div>
      </div>
    </div>
  );
}
