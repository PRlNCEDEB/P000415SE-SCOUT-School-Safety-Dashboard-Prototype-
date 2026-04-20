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

export async function getIncidents() {
  const data = await request('/incidents')
  return data.incidents || []
}

export async function getIncidentById(id) {
  const data = await request(`/incidents/${id}`)
  return data.incident || null
}
