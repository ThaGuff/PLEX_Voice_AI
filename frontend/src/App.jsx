import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { api, createWS } from './lib/api';
import Layout from './components/Layout';

// Lazy load pages
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Calls from './pages/Calls';
import Voicemail from './pages/Voicemail';
import Recordings from './pages/Recordings';
import Transcripts from './pages/Transcripts';
import AgentBuilder from './pages/AgentBuilder';
import Contacts from './pages/Contacts';
import Appointments from './pages/Appointments';
import Conversations from './pages/Conversations';
import Pipeline from './pages/Pipeline';
import Campaigns from './pages/Campaigns';
import Forms from './pages/Forms';
import Automation from './pages/Automation';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';

export const AuthCtx = createContext(null);
export const WSCtx   = createContext(null);

function RequireAuth({ children }) {
  const { user } = useContext(AuthCtx);
  return user ? children : <Navigate to="/login" replace />;
}

const Placeholder = ({ name }) => (
  <div style={{ padding:32, textAlign:'center', color:'var(--text-3)' }}>
    <div style={{ fontSize:32, marginBottom:12 }}>🚧</div>
    <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>{name}</div>
    <div style={{ fontSize:13 }}>This module is coming soon. Configure your integrations in Settings to unlock full functionality.</div>
  </div>
);

export default function App() {
  const [user, setUser]         = useState(null);
  const [org, setOrg]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [wsEvents, setWsEvents] = useState([]);
  const [liveCall, setLiveCall] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const t = localStorage.getItem('aria_token');
    if (t) {
      api.me()
        .then(({ user, org }) => { setUser(user); setOrg(org); })
        .catch(() => localStorage.removeItem('aria_token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const ws = createWS((event) => {
      setWsEvents(p => [event, ...p.slice(0,99)]);
      if (event.type==='call_started') setLiveCall(event);
      if (event.type==='call_ended')   setLiveCall(null);
      if (event.type==='notification') setUnreadCount(n=>n+1);
    });
    api.getNotifications().then(({unread})=>setUnreadCount(unread||0)).catch(()=>{});
    return () => ws.close();
  }, [user]);

  const login = (token, user, org) => {
    localStorage.setItem('aria_token', token);
    setUser(user); setOrg(org);
  };
  const logout = () => {
    localStorage.removeItem('aria_token');
    setUser(null); setOrg(null);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', flexDirection:'column', gap:16 }}>
      <div style={{ width:44, height:44, background:'var(--green)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:20 }}>A</div>
      <div style={{ width:24, height:24, border:'2px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
    </div>
  );

  return (
    <AuthCtx.Provider value={{ user, org, login, logout, setOrg }}>
      <WSCtx.Provider value={{ wsEvents, liveCall, unreadCount, setUnreadCount }}>
        <Routes>
          <Route path="/login"       element={<Login />} />
          <Route path="/setup-admin" element={<Setup />} />
          <Route path="/*" element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/"             element={<Dashboard />} />
                  <Route path="/calls"        element={<Calls />} />
                  <Route path="/voicemail"    element={<Voicemail />} />
                  <Route path="/recordings"   element={<Recordings />} />
                  <Route path="/transcripts"  element={<Transcripts />} />
                  <Route path="/agent-builder" element={<AgentBuilder />} />
                  <Route path="/contacts"     element={<Contacts />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/pipeline"     element={<Pipeline />} />
                  <Route path="/campaigns"    element={<Campaigns />} />
                  <Route path="/forms"        element={<Forms />} />
                  <Route path="/automation"   element={<Automation />} />
                  <Route path="/analytics"    element={<Analytics />} />
                  <Route path="/reports"      element={<Reports />} />
                  <Route path="/settings"     element={<Settings />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/admin"        element={<AdminDashboard />} />
                  <Route path="*"             element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            </RequireAuth>
          } />
        </Routes>
      </WSCtx.Provider>
    </AuthCtx.Provider>
  );
}
