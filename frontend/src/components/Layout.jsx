import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthCtx, WSCtx } from '../App';

const NAV = [
  { group: null, items: [
    { to:'/', label:'Dashboard', icon:'⊞', end:true },
    { to:'/analytics', label:'Analytics', icon:'◈' },
  ]},
  { group: 'Voice AI', items: [
    { to:'/calls', label:'Call Log', icon:'📞' },
    { to:'/voicemail', label:'Voicemail', icon:'📬', badge:'vm' },
    { to:'/recordings', label:'Recordings', icon:'⏺' },
    { to:'/transcripts', label:'Transcripts', icon:'≡' },
    { to:'/agent-builder', label:'Agent Builder', icon:'⚙' },
  ]},
  { group: 'CRM', items: [
    { to:'/contacts', label:'Contacts', icon:'◉' },
    { to:'/pipeline', label:'Pipeline', icon:'⬦' },
    { to:'/appointments', label:'Appointments', icon:'◻' },
    { to:'/conversations', label:'Conversations', icon:'💬' },
  ]},
  { group: 'Grow', items: [
    { to:'/campaigns', label:'Campaigns', icon:'◇' },
    { to:'/automation', label:'Automation', icon:'⟳' },
    { to:'/forms', label:'Forms & Funnels', icon:'▣' },
    { to:'/reports', label:'Reports', icon:'□' },
  ]},
  { group: 'Platform', items: [
    { to:'/integrations', label:'Integrations', icon:'⊕' },
    { to:'/settings', label:'Settings', icon:'◎' },
    { to:'/notifications', label:'Notifications', icon:'◇', badge:'notif' },
    { to:'/admin', label:'Agency Admin', icon:'✦', adminOnly:true },
  ]},
];

const S = {
  sidebar: (collapsed) => ({
    width: collapsed ? 56 : 228,
    minWidth: collapsed ? 56 : 228,
    height: '100vh',
    background: 'var(--ink)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width .2s ease, min-width .2s ease',
    flexShrink: 0,
  }),
};

export default function Layout({ children }) {
  const { user, org, logout } = useContext(AuthCtx);
  const { liveCall, unread } = useContext(WSCtx);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--surface-2)' }}>

      {/* ── SIDEBAR ── */}
      <div style={S.sidebar(collapsed)}>
        {/* Logo */}
        <div onClick={()=>setCollapsed(c=>!c)} style={{ padding: collapsed?'13px 12px':'14px 16px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:9, height:52, cursor:'pointer', flexShrink:0 }}>
          <div style={{ width:30, height:30, background:'var(--brand)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(0,179,125,.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5"/>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:16, color:'#fff', letterSpacing:'-.01em', lineHeight:1 }}>ARIA</div>
              <div style={{ fontSize:8.5, color:'rgba(255,255,255,.3)', letterSpacing:'.1em', textTransform:'uppercase', marginTop:2 }}>VOICE PLATFORM</div>
            </div>
          )}
        </div>

        {/* Live call */}
        {liveCall && !collapsed && (
          <div style={{ margin:'8px 10px 0', padding:'8px 11px', background:'rgba(0,179,125,.15)', border:'1px solid rgba(0,179,125,.3)', borderRadius:'var(--r-sm)', display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--brand)', animation:'pulse 1s infinite', flexShrink:0 }}/>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--brand-2)' }}>Live Call Active</div>
          </div>
        )}

        {/* Nav */}
        <div style={{ flex:1, overflowY:'auto', padding: collapsed?'6px 6px':'6px 8px' }}>
          {NAV.map((grp, gi) => {
            const items = grp.items.filter(i => !i.adminOnly || user?.role==='superadmin');
            return (
              <div key={gi}>
                {grp.group && !collapsed && (
                  <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,.22)', letterSpacing:'.1em', textTransform:'uppercase', padding:'8px 7px 3px' }}>{grp.group}</div>
                )}
                {grp.group && collapsed && gi > 0 && <div style={{ height:1, background:'rgba(255,255,255,.08)', margin:'5px 0' }}/>}
                {items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end}
                    title={collapsed ? item.label : undefined}
                    style={({ isActive }) => ({
                      display:'flex', alignItems:'center', gap:8,
                      padding: collapsed?'8px 0':'7px 8px',
                      justifyContent: collapsed?'center':'flex-start',
                      borderRadius:'var(--r-sm)', cursor:'pointer',
                      textDecoration:'none', fontSize:12.5, fontWeight: isActive?700:500,
                      marginBottom:1, transition:'all var(--t)', position:'relative',
                      ...(isActive
                        ? { background:'rgba(0,179,125,.18)', color:'#00d492' }
                        : { color:'rgba(255,255,255,.5)' }
                      )
                    })}>
                    {({isActive}) => (<>
                      {isActive && <span style={{ position:'absolute', left:0, top:4, bottom:4, width:3, background:'var(--brand)', borderRadius:'0 2px 2px 0' }}/>}
                      <span style={{ fontSize:14, flexShrink:0, width:15, textAlign:'center', lineHeight:1 }}>{item.icon}</span>
                      {!collapsed && <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>{item.label}</span>}
                      {!collapsed && item.badge==='notif' && unread>0 && (
                        <span style={{ background:'var(--red)', color:'#fff', borderRadius:10, fontSize:9, padding:'1px 5px', fontWeight:700 }}>{unread}</span>
                      )}
                    </>)}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* User */}
        <div style={{ padding: collapsed?'10px 6px':'10px 12px', borderTop:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={logout} title="Click to logout">
            <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:'var(--brand-dark)', border:'1.5px solid rgba(0,179,125,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--brand-2)' }}>
              {(user?.name||'U')[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11.5, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{org?.name}</div>
              </div>
            )}
            {!collapsed && (
              <div style={{ padding:'2px 8px', background:'rgba(0,179,125,.18)', borderRadius:20, fontSize:9.5, fontWeight:700, color:'var(--brand-2)', flexShrink:0 }}>
                {org?.plan||'starter'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <div style={{ height:52, background:'var(--surface)', borderBottom:'1.5px solid var(--border)', padding:'0 18px', display:'flex', alignItems:'center', gap:10, flexShrink:0, boxShadow:'var(--shadow-xs)' }}>
          {org?.twilio_phone_number ? (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'var(--brand-xlight)', border:'1.5px solid rgba(0,179,125,.2)', borderRadius:20, padding:'3px 10px', fontSize:11.5, fontFamily:'var(--font-mono)', color:'var(--brand-dark)', fontWeight:500 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--brand)', animation:'pulse 2s infinite' }}/>
              {org.twilio_phone_number}
            </div>
          ) : (
            <div onClick={()=>navigate('/integrations')} style={{ display:'flex', alignItems:'center', gap:5, background:'var(--amber-xlight)', border:'1.5px solid rgba(245,158,11,.2)', borderRadius:20, padding:'3px 10px', fontSize:11.5, color:'var(--amber)', fontWeight:500, cursor:'pointer' }}>
              ⚠ Connect Twilio
            </div>
          )}
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface-2)', border:'1.5px solid var(--border)', borderRadius:20, padding:'5px 12px', width:200 }}>
            <span style={{ color:'var(--text-4)', fontSize:13 }}>🔍</span>
            <input placeholder="Search…" style={{ background:'transparent', border:'none', padding:0, fontSize:12.5, boxShadow:'none', width:'100%' }}/>
          </div>
          <button onClick={()=>navigate('/notifications')} style={{ width:32, height:32, borderRadius:'var(--r-sm)', background:'var(--surface-2)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', cursor:'pointer', fontSize:14, color:'var(--text-3)' }}>
            🔔
            {unread>0 && <span style={{ position:'absolute', top:-3, right:-3, background:'var(--red)', color:'#fff', borderRadius:10, fontSize:8, padding:'0 4px', fontWeight:700, minWidth:14, textAlign:'center' }}>{unread}</span>}
          </button>
          <button onClick={()=>navigate('/agent-builder')} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', background:'var(--brand)', color:'#fff', border:'none', borderRadius:'var(--r-sm)', fontSize:12.5, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,179,125,.25)' }}>
            + New Agent
          </button>
          <div style={{ padding:'3px 9px', background:'var(--purple-light)', border:'1px solid rgba(124,58,237,.2)', borderRadius:20, fontSize:10, fontWeight:700, color:'var(--purple)' }}>
            {(org?.plan||'starter').toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
