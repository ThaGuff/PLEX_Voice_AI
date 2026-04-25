import { useState } from 'react';

export default function Setup() {
  const [form, setForm] = useState({ name:'Ryan Guffey', email:'ryan@plexautomation.io', password:'', secret:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/setup/superadmin', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Setup failed');
      localStorage.setItem('aria_token', data.token);
      setDone(true);
      setTimeout(()=>{ window.location.href='/admin'; }, 1500);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = { background:'#fff', border:'1.5px solid #ddd9cf', borderRadius:8, padding:'9px 12px', fontSize:13, width:'100%', outline:'none', fontFamily:'Inter,sans-serif', color:'#1c1a16' };

  return (
    <div style={{ minHeight:'100vh', background:'#f7f5f0', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, background:'#4a2882', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px', color:'#fff', fontWeight:700 }}>✦</div>
          <h1 style={{ fontFamily:'Lora,Georgia,serif', fontSize:22, fontWeight:700, color:'#1c1a16', marginBottom:6 }}>Agency Admin Setup</h1>
          <p style={{ fontSize:13, color:'#7a7670' }}>Create your PLEX Automation super admin account. This can only be done once.</p>
        </div>

        {done ? (
          <div style={{ textAlign:'center', padding:28, background:'#edf7f1', border:'2px solid rgba(39,103,73,.2)', borderRadius:14 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>✓</div>
            <div style={{ fontFamily:'Lora,Georgia,serif', fontSize:18, fontWeight:700, color:'#276749' }}>Admin account created!</div>
            <div style={{ fontSize:13, color:'#7a7670', marginTop:6 }}>Redirecting to agency dashboard…</div>
          </div>
        ) : (
          <div style={{ background:'#fff', border:'1.5px solid #ddd9cf', borderRadius:14, padding:28, boxShadow:'0 4px 20px rgba(28,26,22,.08)' }}>
            <form onSubmit={submit}>
              {[['Your Name','name','text'],['Email','email','email'],['Password','password','password'],['Setup Secret','secret','password']].map(([l,k,t])=>(
                <div key={k} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#44413a', marginBottom:5 }}>{l}</label>
                  <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} required placeholder={k==='secret'?'Value of SETUP_SECRET Railway variable':''} style={inp}/>
                </div>
              ))}
              <div style={{ background:'#f4effd', border:'1.5px solid rgba(74,40,130,.15)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12.5, color:'#4a2882', lineHeight:1.55 }}>
                Add <code style={{ fontFamily:'monospace', background:'rgba(74,40,130,.1)', padding:'1px 4px', borderRadius:3 }}>SETUP_SECRET</code> to your Railway Variables first. This page only works once.
              </div>
              {error && <div style={{ background:'#fff3f3', border:'1.5px solid rgba(184,50,50,.2)', borderRadius:8, padding:'10px 14px', fontSize:12.5, color:'#b83232', marginBottom:14 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px 0', background:'#4a2882', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: loading?'not-allowed':'pointer', opacity: loading?.7:1, fontFamily:'Inter,sans-serif', boxShadow:'0 2px 10px rgba(74,40,130,.25)' }}>
                {loading ? 'Creating…' : 'Create Super Admin Account →'}
              </button>
            </form>
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#aba79f' }}>
          Already have an account? <a href="/login" style={{ color:'#276749', textDecoration:'none' }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
