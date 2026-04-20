const API_BASE = 'http://localhost:5000/api'

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!res.ok) {
    if (res.status === 401) localStorage.removeItem('auth_token')
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

export const authAPI = {
  login: (email, password) => 
    apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => apiCall('/auth/me'),
}

export const incidentAPI = {
  create: (data) => 
    apiCall('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiCall('/incidents').then(data => data.incidents ?? data),
  updateStatus: (id, status) => 
    apiCall(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

export const analyticsAPI = {
  summary: () => apiCall('/analytics/summary'),
  byType: () => apiCall('/analytics/by-type'),
  statusBreakdown: () => apiCall('/analytics/status-breakdown'),
  byLocation: () => apiCall('/analytics/by-location'),
  thisWeek: () => apiCall('/analytics/this-week'),
  responseTimeTrend: () => apiCall('/analytics/response-time-trend'),
  all: () => apiCall('/analytics/all'),
}

// Named exports used by page components
export const getIncidents = () => apiCall('/incidents').then(data => data.incidents ?? data)
export const getIncidentById = (id) => apiCall(`/incidents/${id}`)