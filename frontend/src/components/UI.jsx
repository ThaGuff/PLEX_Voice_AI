// Shared UI primitives used across all pages

export function Card({ children, style }) {
  return <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, overflow:'hidden', marginBottom:12, ...style }}>{children}</div>;
}

export function CardHead({ title, meta, children }) {
  return (
    <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ fontFamily:'var(--font-head)', fontSize:12.5, fontWeight:700, letterSpacing:'-.1px' }}>{title}</div>
      {meta && <div style={{ marginLeft:'auto', fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{meta}</div>}
      {children}
    </div>
  );
}

export function CardBody({ children, style }) {
  return <div style={{ padding:14, ...style }}>{children}</div>;
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    green: { bg:'rgba(34,197,94,.1)', color:'var(--green)', border:'rgba(34,197,94,.18)' },
    yellow: { bg:'rgba(245,158,11,.1)', color:'var(--yellow)', border:'rgba(245,158,11,.18)' },
    red: { bg:'rgba(239,68,68,.1)', color:'var(--red)', border:'rgba(239,68,68,.18)' },
    blue: { bg:'rgba(59,130,246,.1)', color:'var(--blue)', border:'rgba(59,130,246,.18)' },
    purple: { bg:'rgba(168,85,247,.1)', color:'var(--purple)', border:'rgba(168,85,247,.18)' },
    teal: { bg:'rgba(20,184,166,.1)', color:'var(--teal)', border:'rgba(20,184,166,.18)' },
    gray: { bg:'var(--surface3)', color:'var(--text3)', border:'var(--border2)' },
    accent: { bg:'rgba(240,90,26,.1)', color:'var(--accent)', border:'rgba(240,90,26,.18)' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:500, whiteSpace:'nowrap', background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
      {children}
    </span>
  );
}

export function Tag({ children }) {
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 6px', borderRadius:3, fontSize:10, fontFamily:'var(--font-mono)', background:'var(--surface3)', color:'var(--text2)', border:'1px solid var(--border)' }}>{children}</span>;
}

export function Btn({ children, variant = 'ghost', size = 'md', onClick, style, type = 'button', disabled }) {
  const base = { display:'inline-flex', alignItems:'center', gap:5, borderRadius:6, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', transition:'.12s', whiteSpace:'nowrap', border:'none' };
  const variants = {
    primary: { background:'var(--accent)', color:'#fff' },
    ghost: { background:'transparent', color:'var(--text2)', border:'1px solid var(--border2)' },
    danger: { background:'transparent', color:'var(--red)', border:'1px solid rgba(239,68,68,.3)' },
  };
  const sizes = {
    sm: { padding:'4px 9px', fontSize:11 },
    md: { padding:'6px 13px', fontSize:12 },
    lg: { padding:'9px 18px', fontSize:13 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...sizes[size], ...(disabled ? { opacity:.5, cursor:'not-allowed' } : {}), ...style }}>
      {children}
    </button>
  );
}

export function ProgBar({ value, max = 100, color = 'accent' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background:'var(--surface3)', borderRadius:3, height:4, overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:3, background:`var(--${color})`, width:`${pct}%`, transition:'width .5s' }}/>
    </div>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width:30, height:17, borderRadius:8, background: on ? 'var(--accent)' : 'var(--surface3)', border:`1px solid ${on ? 'var(--accent)' : 'var(--border2)'}`, position:'relative', cursor:'pointer', transition:'.15s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left: on ? 15 : 2, width:11, height:11, borderRadius:'50%', background:'#fff', transition:'.15s' }}/>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, width = 500 }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.72)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, backdropFilter:'blur(3px)' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, width, maxWidth:'96vw', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700 }}>{title}</div>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid var(--border2)', color:'var(--text2)', width:26, height:26, borderRadius:5, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ padding:18 }}>{children}</div>
        {footer && <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:7, justifyContent:'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{label}</label>}
      {children}
    </div>
  );
}

export function Spinner() {
  return <div style={{ width:20, height:20, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>;
}

export function KPI({ label, value, change, changeDir, color }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, padding:14 }}>
      <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800, letterSpacing:'-.4px', lineHeight:1, color: color ? `var(--${color})` : 'var(--text)' }}>{value}</div>
      {change && <div style={{ fontSize:10, marginTop:3, color: changeDir === 'up' ? 'var(--green)' : changeDir === 'down' ? 'var(--red)' : 'var(--text3)' }}>{change}</div>}
    </div>
  );
}

export function Table({ cols, rows, onRowClick }) {
  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr>{cols.map(c => <th key={c.key} style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', padding:'7px 11px', borderBottom:'1px solid var(--border)', textAlign:'left', whiteSpace:'nowrap' }}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.015)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            {cols.map(c => <td key={c.key} style={{ padding:'9px 11px', borderBottom:'1px solid var(--border)', fontSize:12, verticalAlign:'middle' }}>{c.render ? c.render(row) : row[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const outcomeBadge = (outcome) => {
  const map = { answered:'green', booked:'teal', voicemail:'yellow', transferred:'blue', missed:'red', 'in-progress':'accent' };
  return <Badge color={map[outcome] || 'gray'}>{outcome}</Badge>;
};
