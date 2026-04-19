const API_BASE = 'http://localhost:3001/api'

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
  list: () => apiCall('/incidents'),
  updateStatus: (id, status) => 
    apiCall(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

// Named exports used by page components
export const getIncidents = () => apiCall('/incidents')
export const getIncidentById = (id) => apiCall(`/incidents/${id}`)