const API_BASE_URL = 'http://localhost:3001/api'

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.')
  }

  return data
}

export function getIncidents(filters = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  return apiFetch(`/incidents${queryString ? `?${queryString}` : ''}`)
}

export function getIncident(id) {
  return apiFetch(`/incidents/${id}`)
}

export function createIncident(payload) {
  return apiFetch('/incidents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateIncidentStatus(id, status) {
  return apiFetch(`/incidents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
