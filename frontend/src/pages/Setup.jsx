import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      setTimeout(() => { window.location.href='/admin'; }, 1500);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:'#fafaf8',display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'Inter,sans-serif'}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:52,height:52,background:'#4a2c6e',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 14px',color:'#fff'}}>✦</div>
          <div style={{fontSize:22,fontWeight:700,marginBottom:6}}>Agency Admin Setup</div>
          <div style={{fontSize:13,color:'#8a8680'}}>Create your PLEX Automation super admin account. This can only be done once.</div>
        </div>
        {done ? (
          <div style={{textAlign:'center',padding:28,background:'#f0faf2',border:'2px solid rgba(45,106,79,.2)',borderRadius:14}}>
            <div style={{fontSize:40,marginBottom:10}}>✓</div>
            <div style={{fontSize:18,fontWeight:700,color:'#2d6a4f'}}>Admin account created!</div>
            <div style={{fontSize:13,color:'#8a8680',marginTop:6}}>Redirecting to the agency dashboard…</div>
          </div>
        ) : (
          <div style={{background:'#fff',border:'1.5px solid #e2ddd5',borderRadius:14,padding:28}}>
            <form onSubmit={submit}>
              {[['Your Name','name','text'],['Email','email','email'],['Password','password','password'],['Setup Secret','secret','password']].map(([l,k,t])=>(
                <div key={k} style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a4740',marginBottom:5}}>{l}</label>
                  <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} required
                    placeholder={k==='secret'?'Value of SETUP_SECRET env var':''} 
                    style={{border:'1.5px solid #e2ddd5',borderRadius:8,padding:'9px 12px',fontSize:13,width:'100%',outline:'none',fontFamily:'inherit',background:'#fff',color:'#1a1916'}}/>
                </div>
              ))}
              <div style={{background:'#f8f4ff',border:'1.5px solid rgba(74,44,110,.15)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#4a2c6e'}}>
                Set SETUP_SECRET in Railway Variables first. This endpoint only works once.
              </div>
              {error && <div style={{background:'#fde8e6',border:'1.5px solid rgba(192,57,43,.2)',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#c0392b',marginBottom:14}}>{error}</div>}
              <button type="submit" disabled={loading} style={{width:'100%',padding:'11px 0',background:'#4a2c6e',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?.7:1}}>
                {loading?'Creating…':'Create Super Admin Account →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
