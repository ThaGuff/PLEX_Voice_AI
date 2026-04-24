import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { api, createWebSocket } from './lib/api';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calls from './pages/Calls';
import Recordings from './pages/Recordings';
import Transcripts from './pages/Transcripts';
import Appointments from './pages/Appointments';
import Voicemail from './pages/Voicemail';
import AgentBuilder from './pages/AgentBuilder';
import Scripts from './pages/Scripts';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import CRM from './pages/CRM';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';

export const AuthCtx = createContext(null);
export const WSCtx = createContext(null);

function useAuth() { return useContext(AuthCtx); }

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsEvents, setWsEvents] = useState([]);
  const [liveCall, setLiveCall] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('aria_token');
    if (token) {
      api.me().then(({ user, org }) => {
        setUser(user); setOrg(org);
      }).catch(() => {
        localStorage.removeItem('aria_token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('aria_token');
    const ws = createWebSocket(token, (event) => {
      setWsEvents(prev => [event, ...prev.slice(0, 99)]);
      if (event.type === 'call_started') setLiveCall(event);
      if (event.type === 'call_ended') setLiveCall(null);
      if (event.type === 'notification') setUnreadCount(n => n + 1);
    });
    // Load initial unread count
    api.getNotifications().then(({ unread }) => setUnreadCount(unread)).catch(() => {});
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
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
      <div style={{width:32,height:32,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    </div>
  );

  return (
    <AuthCtx.Provider value={{ user, org, login, logout, setOrg }}>
      <WSCtx.Provider value={{ wsEvents, liveCall, unreadCount, setUnreadCount }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/calls" element={<Calls />} />
                  <Route path="/recordings" element={<Recordings />} />
                  <Route path="/transcripts" element={<Transcripts />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/voicemail" element={<Voicemail />} />
                  <Route path="/agent-builder" element={<AgentBuilder />} />
                  <Route path="/scripts" element={<Scripts />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/crm" element={<CRM />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            </RequireAuth>
          } />
        </Routes>
      </WSCtx.Provider>
    </AuthCtx.Provider>
  );
}
