// ── ARIA Platform v2 — Complete UI Component Library ──────────────────────────

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:'var(--surface)', border:'1.5px solid var(--border)',
      borderRadius:'var(--r-md)', boxShadow:'var(--shadow-sm)',
      overflow:'hidden', marginBottom:12,
      cursor: onClick ? 'pointer' : undefined, ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHead({ title, subtitle, children, noBorder }) {
  return (
    <div style={{ padding:'13px 17px', borderBottom: noBorder ? 'none' : '1.5px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:1 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export function CardBody({ children, style }) {
  return <div style={{ padding:'15px 17px', ...style }}>{children}</div>;
}

const BS = {
  green:  ['var(--green-light)','var(--green-text)','rgba(39,103,73,.18)'],
  amber:  ['var(--amber-light)','var(--amber)','rgba(176,125,44,.2)'],
  red:    ['var(--red-light)','var(--red)','rgba(184,50,50,.2)'],
  purple: ['var(--purple-light)','var(--purple)','rgba(74,40,130,.2)'],
  yellow: ['var(--yellow-light)','var(--yellow)','rgba(158,124,10,.2)'],
  gray:   ['var(--bg-3)','var(--text-3)','var(--border)'],
};

export function Badge({ children, color='gray', dot, style }) {
  const [bg,clr,bdr] = BS[color] || BS.gray;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2.5px 8px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:600, background:bg, color:clr, border:`1px solid ${bdr}`, whiteSpace:'nowrap', ...style }}>
      {dot && <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', flexShrink:0 }}/>}
      {children}
    </span>
  );
}

export function Tag({ children, style }) {
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 7px', borderRadius:'var(--r-xs)', fontSize:11, fontFamily:'var(--font-mono)', background:'var(--bg-2)', color:'var(--text-3)', border:'1px solid var(--border)', ...style }}>{children}</span>;
}

const BV = {
  primary:   ['var(--green)','#fff','var(--green)','var(--green-h)'],
  secondary: ['var(--surface)','var(--text-2)','var(--border)','var(--bg-2)'],
  danger:    ['var(--red-xlight)','var(--red)','rgba(184,50,50,.2)','var(--red-light)'],
  ghost:     ['transparent','var(--text-3)','transparent','var(--bg-2)'],
  amber:     ['var(--amber)','#fff','var(--amber)','var(--amber-h)'],
  purple:    ['var(--purple)','#fff','var(--purple)','var(--purple-h)'],
  outline:   ['transparent','var(--green)','var(--green)','var(--green-xlight)'],
};

export function Btn({ children, variant='secondary', size='md', onClick, style, disabled, type='button', icon, full }) {
  const [bg,clr,bdr,hbg] = BV[variant] || BV.secondary;
  const SZ = { xs:['2px 8px',11,3], sm:['5px 11px',12,4], md:['7px 15px',13,5], lg:['10px 22px',14,6] };
  const [p,fs,gap] = SZ[size]||SZ.md;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.background=hbg; }}
      onMouseLeave={e=>{ e.currentTarget.style.background=bg; }}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap, padding:p, fontSize:fs, fontWeight:600, fontFamily:'var(--font-body)', lineHeight:1, background:bg, color:clr, border:`1.5px solid ${bdr}`, borderRadius:'var(--r-sm)', cursor: disabled?'not-allowed':'pointer', opacity: disabled?.55:1, transition:'background var(--t)', whiteSpace:'nowrap', width: full?'100%':undefined, ...style }}>
      {icon && <span style={{ fontSize:fs+1 }}>{icon}</span>}
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label, size='md' }) {
  const [w,h,d] = size==='sm' ? [30,17,11] : [36,20,14];
  return (
    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
      <div onClick={()=>onChange(!on)} style={{ width:w, height:h, borderRadius:h, background: on?'var(--green)':'var(--border-2)', position:'relative', cursor:'pointer', transition:'background var(--t)', flexShrink:0 }}>
        <div style={{ position:'absolute', top:(h-d)/2, left: on?w-d-(h-d)/2:(h-d)/2, width:d, height:d, borderRadius:'50%', background:'#fff', transition:'left var(--t)', boxShadow:'0 1px 3px rgba(0,0,0,.15)' }}/>
      </div>
      {label && <span style={{ fontSize:13, color:'var(--text-2)', userSelect:'none' }}>{label}</span>}
    </label>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, width=520 }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(28,26,22,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'var(--r-lg)', width, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)', animation:'fadeIn .18s ease' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:'1.5px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--text)' }}>{title}</div>
            {subtitle && <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background:'var(--bg-2)', border:'1.5px solid var(--border)', color:'var(--text-3)', width:28, height:28, borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
        {footer && <div style={{ padding:'12px 20px', borderTop:'1.5px solid var(--border)', display:'flex', gap:7, justifyContent:'flex-end', background:'var(--bg-2)' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function FormGroup({ label, hint, children, required }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:5 }}>{label}{required&&<span style={{color:'var(--red)',marginLeft:2}}>*</span>}</label>}
      {children}
      {hint && <div style={{ fontSize:11, color:'var(--text-4)', marginTop:3, lineHeight:1.5 }}>{hint}</div>}
    </div>
  );
}

export function Spinner({ size=20, color='var(--green)' }) {
  return <div style={{ width:size, height:size, border:`2px solid var(--border)`, borderTopColor:color, borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>;
}

export function KPI({ label, value, change, up, icon, color, compact }) {
  return (
    <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', padding: compact?'12px 14px':'16px 18px', boxShadow:'var(--shadow-xs)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: compact?6:8 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</div>
        {icon && <span style={{ fontSize:18, opacity:.5 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily:'var(--font-head)', fontSize: compact?22:28, fontWeight:700, letterSpacing:'-.02em', color: color?`var(--${color})`:'var(--text)', lineHeight:1 }}>{value}</div>
      {change && <div style={{ fontSize:11, marginTop:5, color: up?'var(--green)':up===false?'var(--red)':'var(--text-3)', fontWeight:500 }}>{up===true?'↑':up===false?'↓':''} {change}</div>}
    </div>
  );
}

export function ProgBar({ value, max=100, color='green', height=5 }) {
  const pct = Math.min(100, Math.round((value/Math.max(1,max))*100));
  return (
    <div style={{ background:'var(--bg-3)', borderRadius:height, height, overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:height, background:`var(--${color})`, width:`${pct}%`, transition:'width .5s ease' }}/>
    </div>
  );
}

export function DataTable({ cols, rows, onRow, emptyMsg='No data', loading }) {
  if (loading) return <div style={{ padding:32, textAlign:'center', display:'flex', justifyContent:'center' }}><Spinner/></div>;
  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead><tr>{cols.map(c=><th key={c.key} style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', padding:'8px 13px', borderBottom:'1.5px solid var(--border)', textAlign:'left', whiteSpace:'nowrap' }}>{c.label}</th>)}</tr></thead>
      <tbody>
        {!rows?.length
          ? <tr><td colSpan={cols.length} style={{ padding:32, textAlign:'center', color:'var(--text-4)', fontSize:13 }}>{emptyMsg}</td></tr>
          : rows.map((row,i)=>(
            <tr key={row.id||i} onClick={()=>onRow?.(row)} style={{ cursor: onRow?'pointer':'default' }}
              onMouseEnter={e=>{ if(onRow) e.currentTarget.style.background='var(--surface-2)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; }}>
              {cols.map(c=><td key={c.key} style={{ padding:'9px 13px', borderBottom:'1px solid var(--border)', fontSize:12.5, verticalAlign:'middle' }}>{c.render?c.render(row):row[c.key]??'—'}</td>)}
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}

export function Empty({ icon, title, desc, action }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      {icon && <div style={{ fontSize:36, marginBottom:12, opacity:.35 }}>{icon}</div>}
      <div style={{ fontSize:14, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>{title}</div>
      {desc && <div style={{ fontSize:12.5, color:'var(--text-3)', maxWidth:320, margin:'0 auto', lineHeight:1.6 }}>{desc}</div>}
      {action && <div style={{ marginTop:18 }}>{action}</div>}
    </div>
  );
}

export function Alert({ type='info', children, style }) {
  const T = {
    info:    ['var(--purple-xlight)','rgba(74,40,130,.15)','var(--purple)','ℹ'],
    success: ['var(--green-xlight)','rgba(39,103,73,.15)','var(--green)','✓'],
    warning: ['var(--amber-xlight)','rgba(176,125,44,.15)','var(--amber)','⚠'],
    error:   ['var(--red-xlight)','rgba(184,50,50,.15)','var(--red)','✕'],
  };
  const [bg,bdr,clr,ico] = T[type]||T.info;
  return (
    <div style={{ background:bg, border:`1.5px solid ${bdr}`, borderRadius:'var(--r-sm)', padding:'10px 14px', fontSize:12.5, color:clr, display:'flex', gap:8, alignItems:'flex-start', lineHeight:1.55, marginBottom:14, ...style }}>
      <span style={{ flexShrink:0, marginTop:1 }}>{ico}</span>
      <span>{children}</span>
    </div>
  );
}

export function Tabs({ tabs, active, onChange, style }) {
  return (
    <div style={{ display:'flex', gap:1, borderBottom:'1.5px solid var(--border)', marginBottom:18, ...style }}>
      {tabs.map(t=>{
        const key=typeof t==='string'?t:t.key;
        const label=typeof t==='string'?t:t.label;
        const ia=active===key;
        return (
          <button key={key} onClick={()=>onChange(key)} style={{ padding:'8px 14px', fontSize:13, fontWeight:ia?600:400, color:ia?'var(--green)':'var(--text-3)', background:'transparent', border:'none', borderBottom:`2.5px solid ${ia?'var(--green)':'transparent'}`, marginBottom:-1.5, cursor:'pointer', transition:'color var(--t)', whiteSpace:'nowrap' }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function OutcomeBadge({ outcome }) {
  const m = { answered:'green', booked:'green', voicemail:'yellow', transferred:'purple', missed:'red', 'in-progress':'amber', failed:'red', confirmed:'green', pending:'yellow', cancelled:'red', completed:'green' };
  return <Badge color={m[outcome]||'gray'} dot>{outcome||'—'}</Badge>;
}

export function SectionHead({ title, desc, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-head)', fontSize:21, fontWeight:700, letterSpacing:'-.02em', color:'var(--text)', lineHeight:1.2 }}>{title}</h1>
        {desc && <p style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>{desc}</p>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
  );
}

export function CopyField({ label, value }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <div style={{ fontSize:11.5, fontWeight:600, color:'var(--text-3)', marginBottom:5 }}>{label}</div>}
      <div style={{ display:'flex', gap:7 }}>
        <input readOnly value={value||''} style={{ flex:1, fontFamily:'var(--font-mono)', fontSize:11, background:'var(--bg-2)', color:'var(--text-2)' }}/>
        <Btn size="sm" onClick={()=>navigator.clipboard?.writeText(value)}>Copy</Btn>
      </div>
    </div>
  );
}

export function IntCard({ icon, name, desc, connected, onConnect, onConfig }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 15px', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', marginBottom:8, boxShadow:'var(--shadow-xs)' }}>
      <div style={{ width:38, height:38, borderRadius:10, background:'var(--bg-2)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:13 }}>{name}</div>
        <div style={{ fontSize:11.5, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{desc}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
        <Badge color={connected?'green':'gray'} dot>{connected?'Connected':'Not set'}</Badge>
        {connected ? <Btn size="sm" onClick={onConfig}>Configure</Btn> : <Btn size="sm" variant="primary" onClick={onConnect}>Connect</Btn>}
      </div>
    </div>
  );
}
