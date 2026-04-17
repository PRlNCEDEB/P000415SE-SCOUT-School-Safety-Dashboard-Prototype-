const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

async function request(path, options = {}) {
  // Attach token from localStorage if it exists
  const token = localStorage.getItem('scout_token')

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      // keep fallback message
    }
    throw new Error(message)
  }

  if (response.status === 204) return null

  return response.json()
}

export async function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getIncidents() {
  const data = await request('/incidents')
  return data.incidents || []
}

export async function getIncidentById(id) {
  const data = await request(`/incidents/${id}`)
  return data.incident || null
}