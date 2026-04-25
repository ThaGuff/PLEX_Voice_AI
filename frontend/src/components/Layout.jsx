import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthCtx, WSCtx } from '../App';

const NAV_GROUPS = [
  { group: null, items: [
    { to:'/', label:'Dashboard', icon:'⊞', end:true },
  ]},
  { group: 'Voice AI', items: [
    { to:'/calls',        label:'Call Log',        icon:'☎' },
    { to:'/voicemail',    label:'Voicemail',        icon:'◈', badge:'vm' },
    { to:'/recordings',   label:'Recordings',       icon:'⏺' },
    { to:'/transcripts',  label:'Transcripts',      icon:'≡' },
    { to:'/agent-builder',label:'Agent Builder',    icon:'⚙' },
  ]},
  { group: 'CRM', items: [
    { to:'/contacts',     label:'Contacts',         icon:'◉' },
    { to:'/appointments', label:'Appointments',     icon:'◻' },
    { to:'/conversations',label:'Conversations',    icon:'💬', badge:'conv' },
    { to:'/pipeline',     label:'Pipeline',         icon:'◈' },
  ]},
  { group: 'Marketing', items: [
    { to:'/campaigns',    label:'Campaigns',        icon:'◇' },
    { to:'/forms',        label:'Forms & Funnels',  icon:'▣' },
    { to:'/automation',   label:'Automation',       icon:'⟳' },
  ]},
  { group: 'Reporting', items: [
    { to:'/analytics',    label:'Analytics',        icon:'◈' },
    { to:'/reports',      label:'Reports',          icon:'□' },
  ]},
  { group: 'Settings', items: [
    { to:'/settings',       label:'Settings',        icon:'◎' },
    { to:'/integrations',   label:'Integrations',   icon:'⊕' },
    { to:'/notifications',  label:'Notifications',  icon:'◇', badge:'notif' },
    { to:'/admin',          label:'Agency Admin',   icon:'✦', adminOnly:true },
  ]},
];

export default function Layout({ children }) {
  const { user, org, logout } = useContext(AuthCtx);
  const { liveCall, unreadCount } = useContext(WSCtx);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const W = collapsed ? 52 : 228;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <div style={{
        width:W, minWidth:W, maxWidth:W,
        background:'var(--surface)',
        borderRight:'1.5px solid var(--border)',
        display:'flex', flexDirection:'column',
        transition:'width .2s ease, min-width .2s ease',
        boxShadow:'var(--shadow-xs)',
        position:'relative', zIndex:10,
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed?'14px 10px':'16px 16px 12px', borderBottom:'1.5px solid var(--border)', display:'flex', alignItems:'center', gap:9, overflow:'hidden', flexShrink:0 }}>
          <div style={{ width:32, height:32, background:'var(--green)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:14, flexShrink:0, boxShadow:'0 2px 6px rgba(39,103,73,.28)' }}>A</div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:16, letterSpacing:'-.02em', color:'var(--text)', lineHeight:1 }}>ARIA</div>
              <div style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)', marginTop:2 }}>VOICE PLATFORM</div>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{ background:'none', border:'none', color:'var(--text-4)', fontSize:12, cursor:'pointer', flexShrink:0, padding:2, lineHeight:1 }}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Live call banner */}
        {liveCall && !collapsed && (
          <div style={{ margin:'8px 10px 0', padding:'8px 11px', background:'var(--green-xlight)', border:'1.5px solid rgba(39,103,73,.2)', borderRadius:'var(--r-sm)', display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:'pulse 1s infinite', flexShrink:0 }}/>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--green)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Live Call Active</div>
          </div>
        )}

        {/* Nav */}
        <div style={{ flex:1, overflowY:'auto', padding: collapsed?'8px 6px':'8px 8px' }}>
          {NAV_GROUPS.map((grp, gi) => {
            const items = grp.items.filter(i => !i.adminOnly || user?.role==='superadmin');
            if (!items.length) return null;
            return (
              <div key={gi}>
                {grp.group && !collapsed && (
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-4)', letterSpacing:'.07em', textTransform:'uppercase', padding:'10px 8px 4px' }}>{grp.group}</div>
                )}
                {grp.group && collapsed && gi > 0 && <div style={{ height:1, background:'var(--border)', margin:'6px 0' }}/>}
                {items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end}
                    title={collapsed ? item.label : undefined}
                    style={({ isActive }) => ({
                      display:'flex', alignItems:'center', gap:8,
                      padding: collapsed ? '8px 0' : '7px 9px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius:'var(--r-sm)', cursor:'pointer',
                      textDecoration:'none', fontSize:13, fontWeight: isActive?600:400,
                      transition:'all var(--t)', marginBottom:1,
                      ...(isActive
                        ? { background:'var(--green-xlight)', color:'var(--green)', border:'1.5px solid rgba(39,103,73,.18)' }
                        : { color:'var(--text-2)', border:'1.5px solid transparent' }
                      )
                    })}>
                    <span style={{ fontSize:14, flexShrink:0, width:16, textAlign:'center', lineHeight:1 }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>{item.label}</span>}
                    {!collapsed && item.badge==='notif' && unreadCount>0 && (
                      <span style={{ background:'var(--red)', color:'#fff', borderRadius:10, fontSize:9, padding:'1px 5px', fontWeight:700, marginLeft:'auto' }}>{unreadCount}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* User */}
        <div style={{ padding: collapsed?'10px 6px':'10px 12px', borderTop:'1.5px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, overflow:'hidden' }}>
            <div onClick={logout} title="Logout" style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:'var(--green-light)', border:'1.5px solid rgba(39,103,73,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--green)', cursor:'pointer' }}>
              {(user?.name||'U')[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize:10.5, color:'var(--text-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{org?.name}</div>
              </div>
            )}
            {!collapsed && (
              <div style={{ padding:'2px 7px', background:'var(--green-xlight)', border:'1px solid rgba(39,103,73,.18)', borderRadius:'var(--r-full)', fontSize:10, fontWeight:600, color:'var(--green)', flexShrink:0 }}>
                {org?.plan||'starter'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <div style={{ background:'var(--surface)', borderBottom:'1.5px solid var(--border)', height:52, padding:'0 22px', display:'flex', alignItems:'center', gap:12, flexShrink:0, boxShadow:'var(--shadow-xs)' }}>
          {/* Phone number */}
          {org?.twilio_phone_number && (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'var(--green-xlight)', border:'1.5px solid rgba(39,103,73,.18)', borderRadius:'var(--r-full)', padding:'4px 11px', fontSize:12, fontFamily:'var(--font-mono)', color:'var(--green)', fontWeight:500 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }}/>
              {org.twilio_phone_number}
            </div>
          )}
          {!org?.twilio_phone_number && (
            <div onClick={()=>navigate('/settings')} style={{ display:'flex', alignItems:'center', gap:5, background:'var(--amber-xlight)', border:'1.5px solid rgba(176,125,44,.2)', borderRadius:'var(--r-full)', padding:'4px 11px', fontSize:12, color:'var(--amber)', fontWeight:500, cursor:'pointer' }}>
              ⚠ Configure Twilio
            </div>
          )}

          <div style={{ flex:1 }}/>

          {/* Actions */}
          <button onClick={()=>navigate('/notifications')} style={{ position:'relative', background:'var(--bg-2)', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', padding:'5px 10px', cursor:'pointer', fontSize:14, color:'var(--text-3)', display:'flex', alignItems:'center' }}>
            ◇
            {unreadCount>0 && <span style={{ position:'absolute', top:-4, right:-4, background:'var(--red)', color:'#fff', borderRadius:10, fontSize:9, padding:'1px 4px', fontWeight:700 }}>{unreadCount}</span>}
          </button>

          <button onClick={()=>navigate('/agent-builder')} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', background:'var(--green)', color:'#fff', border:'none', borderRadius:'var(--r-sm)', fontSize:12.5, fontWeight:600, cursor:'pointer', boxShadow:'0 1px 4px rgba(39,103,73,.25)' }}>
            + New Agent
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
