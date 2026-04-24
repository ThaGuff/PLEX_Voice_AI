import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { AuthCtx } from '../App';

export default function Login() {
  const { login } = useContext(AuthCtx);
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ email:'', password:'', name:'', orgName:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fn = mode === 'login' ? api.login : api.register;
      const res = await fn(form);
      login(res.token, res.user, res.org);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:48, height:48, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:800, fontSize:18, color:'#fff', margin:'0 auto 12px' }}>AR</div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, letterSpacing:'-.4px' }}>ARIA Platform</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>AI Voice Agent Management</div>
        </div>

        {/* Card */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:28 }}>
          <div style={{ display:'flex', marginBottom:20, background:'var(--surface2)', borderRadius:7, padding:3 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'7px 0', borderRadius:5, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background: mode===m ? 'var(--accent)' : 'transparent', color: mode===m ? '#fff' : 'var(--text3)', transition:'.15s' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Your Name</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ryan Guffey" required />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Business Name</label>
                  <input value={form.orgName} onChange={e => set('orgName', e.target.value)} placeholder="S&S Maintenance HVAC" required />
                </div>
              </>
            )}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ryan@plexautomation.io" required />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
            </div>

            {error && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:6, padding:'8px 12px', fontSize:12, color:'var(--red)', marginBottom:14 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'10px 0', background:'var(--accent)', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, fontFamily:'var(--font-body)' }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>
        </div>
        <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:16 }}>ARIA Platform · Powered by PLEX Automation</div>
      </div>
    </div>
  );
}
