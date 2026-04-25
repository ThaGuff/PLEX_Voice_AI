const BASE = import.meta.env.VITE_API_URL || '';

function token() { return localStorage.getItem('aria_token'); }

async function req(path, opts = {}) {
  const t = token();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login:          (d) => req('/api/auth/login',    { method:'POST', body:JSON.stringify(d) }),
  register:       (d) => req('/api/auth/register', { method:'POST', body:JSON.stringify(d) }),
  me:             ()  => req('/api/auth/me'),
  updateOrg:      (d) => req('/api/auth/org',       { method:'PUT',  body:JSON.stringify(d) }),
  // Agents
  getAgents:      ()      => req('/api/agents'),
  getAgent:       (id)    => req(`/api/agents/${id}`),
  createAgent:    (d)     => req('/api/agents',       { method:'POST', body:JSON.stringify(d) }),
  updateAgent:    (id, d) => req(`/api/agents/${id}`, { method:'PUT',  body:JSON.stringify(d) }),
  // Calls
  getCalls:       (p={}) => req(`/api/calls?${new URLSearchParams(p)}`),
  getCall:        (id)   => req(`/api/calls/${id}`),
  // Appointments
  getAppts:       ()      => req('/api/appointments'),
  createAppt:     (d)     => req('/api/appointments',       { method:'POST', body:JSON.stringify(d) }),
  updateAppt:     (id, d) => req(`/api/appointments/${id}`, { method:'PUT',  body:JSON.stringify(d) }),
  // Voicemails
  getVoicemails:  ()   => req('/api/voicemails'),
  markVMRead:     (id) => req(`/api/voicemails/${id}/read`, { method:'PUT' }),
  // Recordings
  getRecordings:  () => req('/api/recordings'),
  // FAQs
  getFAQs:        ()      => req('/api/faqs'),
  createFAQ:      (d)     => req('/api/faqs',       { method:'POST', body:JSON.stringify(d) }),
  updateFAQ:      (id, d) => req(`/api/faqs/${id}`, { method:'PUT',  body:JSON.stringify(d) }),
  deleteFAQ:      (id)    => req(`/api/faqs/${id}`, { method:'DELETE' }),
  // Contacts
  getContacts:    (p={}) => req(`/api/contacts?${new URLSearchParams(p)}`),
  createContact:  (d)     => req('/api/contacts',       { method:'POST', body:JSON.stringify(d) }),
  updateContact:  (id, d) => req(`/api/contacts/${id}`, { method:'PUT',  body:JSON.stringify(d) }),
  deleteContact:  (id)    => req(`/api/contacts/${id}`, { method:'DELETE' }),
  // Conversations
  getConversations:   ()      => req('/api/conversations'),
  getMessages:        (id)    => req(`/api/conversations/${id}/messages`),
  sendMessage:        (id, d) => req(`/api/conversations/${id}/messages`, { method:'POST', body:JSON.stringify(d) }),
  // Analytics
  getAnalytics:       (days=30) => req(`/api/analytics/summary?days=${days}`),
  getCallsOverTime:   (days=14) => req(`/api/analytics/calls-over-time?days=${days}`),
  // Notifications
  getNotifications:   () => req('/api/notifications'),
  markAllRead:        () => req('/api/notifications/read-all', { method:'PUT' }),
  // Integrations
  getIntegrations:    ()         => req('/api/integrations'),
  testIntegration:    (provider) => req(`/api/integrations/test/${provider}`, { method:'POST' }),
  getELVoices:        ()         => req('/api/integrations/elevenlabs/voices'),
  // Admin
  adminStats:     ()     => req('/api/admin/stats'),
  adminOrgs:      ()     => req('/api/admin/orgs'),
  adminOrgDetail: (id)   => req(`/api/admin/orgs/${id}`),
  adminUpdateOrg: (id,d) => req(`/api/admin/orgs/${id}`, { method:'PUT', body:JSON.stringify(d) }),
  adminUsers:     ()     => req('/api/admin/users'),
  adminCreateUser:(d)    => req('/api/admin/users', { method:'POST', body:JSON.stringify(d) }),
  adminDeleteUser:(id)   => req(`/api/admin/users/${id}`, { method:'DELETE' }),
  adminCalls:     (p={}) => req(`/api/admin/calls?${new URLSearchParams(p)}`),
};

export function createWS(onMessage) {
  const wsBase = (import.meta.env.VITE_API_URL || window.location.origin).replace(/^http/, 'ws');
  const t = token();
  const ws = new WebSocket(`${wsBase}/ws?token=${t}`);
  ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
  ws.onerror = (e) => console.error('WS error', e);
  return ws;
}
