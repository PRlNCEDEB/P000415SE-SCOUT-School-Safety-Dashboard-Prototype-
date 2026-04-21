const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const payload = await response.json()
      message = payload.error || message
    } catch {
      // Keep the fallback message when the error response is not JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const incidentAPI = {
  create: (data) => 
    apiCall('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiCall('/incidents').then(data => data.incidents ?? data),
  updateStatus: (id, status) => 
    apiCall(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

export const notificationsAPI = {
  list: () => apiCall('/notifications').then(data => data.notifications ?? data),
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
export const getIncidentById = (id) => apiCall(`/incidents/${id}`).then(data => data.incident ?? data)
