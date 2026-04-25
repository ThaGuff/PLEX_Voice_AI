import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AuthCtx } from '../App';

export default function Login() {
  const { login } = useContext(AuthCtx);
  const navigate  = useNavigate();
  const [mode, setMode]   = useState('login');
  const [form, setForm]   = useState({ email:'', password:'', name:'', orgName:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await (mode==='login' ? api.login : api.register)(form);
      login(res.token, res.user, res.org);
      navigate('/');
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = (style={}) => ({
    background:'#fff', border:'1.5px solid #ddd9cf', borderRadius:8,
    padding:'9px 12px', fontSize:13, width:'100%', outline:'none',
    fontFamily:'Inter,sans-serif', color:'#1c1a16', lineHeight:1.4,
    transition:'border-color .14s, box-shadow .14s',
    ...style,
  });

  const onfocus = (e) => { e.target.style.borderColor='#276749'; e.target.style.boxShadow='0 0 0 3px rgba(39,103,73,.1)'; };
  const onblur  = (e) => { e.target.style.borderColor='#ddd9cf'; e.target.style.boxShadow='none'; };

  return (
    <div style={{ minHeight:'100vh', background:'#f7f5f0', display:'flex', fontFamily:'Inter,sans-serif' }}>
      {/* Left hero */}
      <div style={{ flex:1, background:'var(--green,#276749)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', color:'#fff', minWidth:0 }}>
        <div style={{ maxWidth:440 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
            <div style={{ width:36, height:36, background:'rgba(255,255,255,.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Lora,Georgia,serif', fontWeight:700, fontSize:16 }}>A</div>
            <span style={{ fontFamily:'Lora,Georgia,serif', fontWeight:700, fontSize:18 }}>ARIA Platform</span>
          </div>
          <h1 style={{ fontFamily:'Lora,Georgia,serif', fontSize:38, fontWeight:700, lineHeight:1.15, marginBottom:18 }}>
            Never miss<br/>another call.
          </h1>
          <p style={{ fontSize:15, lineHeight:1.75, opacity:.88, marginBottom:36 }}>
            ARIA handles every inbound call 24/7 — answering questions, booking appointments, capturing leads, and routing emergencies to your team instantly.
          </p>
          {[
            ['📞','Answers every call instantly, 24/7'],
            ['📅','Books appointments directly into your calendar'],
            ['💬','Sends SMS follow-ups to missed callers automatically'],
            ['🔗','Syncs every lead to your CRM in real time'],
            ['🚨','Detects emergencies and routes them instantly'],
          ].map(([icon,text])=>(
            <div key={text} style={{ display:'flex', alignItems:'center', gap:11, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{icon}</div>
              <span style={{ fontSize:13.5, opacity:.92 }}>{text}</span>
            </div>
          ))}
          <div style={{ marginTop:36, padding:'16px 20px', background:'rgba(255,255,255,.1)', borderRadius:12, border:'1px solid rgba(255,255,255,.15)' }}>
            <div style={{ fontSize:11, opacity:.65, marginBottom:3, textTransform:'uppercase', letterSpacing:'.06em' }}>Industry average</div>
            <div style={{ fontFamily:'Lora,Georgia,serif', fontSize:22, fontWeight:700 }}>60–80% of calls go unanswered</div>
            <div style={{ fontSize:12, opacity:.65, marginTop:4 }}>Each missed call costs $12–$3,500+ in lost revenue</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:'#fff', boxShadow:'-4px 0 20px rgba(28,26,22,.06)' }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <h2 style={{ fontFamily:'Lora,Georgia,serif', fontSize:24, fontWeight:700, color:'#1c1a16', marginBottom:6 }}>
            {mode==='login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize:13, color:'#7a7670', marginBottom:24 }}>
            {mode==='login' ? 'Sign in to your ARIA dashboard' : 'Set up your AI voice agent in minutes'}
          </p>

          {/* Mode toggle */}
          <div style={{ display:'flex', background:'#f7f5f0', borderRadius:9, padding:3, marginBottom:24, border:'1.5px solid #ddd9cf' }}>
            {['login','register'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError('');}} style={{ flex:1, padding:'7px 0', borderRadius:7, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .14s', background: mode===m?'#fff':'transparent', color: mode===m?'#1c1a16':'#7a7670', boxShadow: mode===m?'0 1px 4px rgba(28,26,22,.08)':'none' }}>
                {m==='login'?'Sign In':'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode==='register' && [['Full Name','name','text','Ryan Guffey'],['Business Name','orgName','text','S&S Maintenance HVAC']].map(([l,k,t,ph])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#44413a', marginBottom:5 }}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} required style={inp()} onFocus={onfocus} onBlur={onblur}/>
              </div>
            ))}
            {[['Email address','email','email','you@company.com'],['Password','password','password','••••••••']].map(([l,k,t,ph])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#44413a', marginBottom:5 }}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} required style={inp()} onFocus={onfocus} onBlur={onblur}/>
              </div>
            ))}
            {error && (
              <div style={{ background:'#fff3f3', border:'1.5px solid rgba(184,50,50,.2)', borderRadius:8, padding:'10px 14px', fontSize:12.5, color:'#b83232', marginBottom:16 }}>{error}</div>
            )}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px 0', background: loading?'#3a8a60':'#276749', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: loading?'not-allowed':'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 2px 8px rgba(39,103,73,.28)', transition:'background .14s', marginBottom:16 }}>
              {loading ? 'Please wait…' : mode==='login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign:'center', fontSize:11.5, color:'#aba79f' }}>
            Powered by PLEX Automation · <a href="/setup-admin" style={{ color:'#276749' }}>Admin setup</a>
          </div>
        </div>
      </div>
    </div>
  );
}
