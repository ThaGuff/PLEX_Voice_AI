// src/lib/api.js
const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('aria_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/me'),
  updateOrg: (data) => request('/api/auth/org', { method: 'PUT', body: JSON.stringify(data) }),

  // Calls
  getCalls: (params = {}) => request(`/api/calls?${new URLSearchParams(params)}`),
  getCall: (id) => request(`/api/calls/${id}`),

  // Appointments
  getAppointments: () => request('/api/appointments'),
  createAppointment: (data) => request('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAppointment: (id) => request(`/api/appointments/${id}`, { method: 'DELETE' }),

  // Agents
  getAgents: () => request('/api/agents'),
  updateAgent: (id, data) => request(`/api/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // FAQs
  getFAQs: () => request('/api/faqs'),
  createFAQ: (data) => request('/api/faqs', { method: 'POST', body: JSON.stringify(data) }),
  updateFAQ: (id, data) => request(`/api/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFAQ: (id) => request(`/api/faqs/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalytics: (days = 30) => request(`/api/analytics/summary?days=${days}`),
  getCallsOverTime: (days = 14) => request(`/api/analytics/calls-over-time?days=${days}`),

  // Voicemails
  getVoicemails: () => request('/api/voicemails'),
  markVoicemailRead: (id) => request(`/api/voicemails/${id}/read`, { method: 'PUT' }),

  // Recordings
  getRecordings: () => request('/api/recordings'),

  // Notifications
  getNotifications: () => request('/api/notifications'),
  markAllRead: () => request('/api/notifications/read-all', { method: 'PUT' }),
};

export function createWebSocket(token, onMessage) {
  const wsBase = (import.meta.env.VITE_API_URL || window.location.origin).replace('http', 'ws');
  const ws = new WebSocket(`${wsBase}/ws?token=${token}`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onerror = console.error;
  return ws;
}
