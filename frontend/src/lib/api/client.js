const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
const ADMIN_ACCESS_TOKEN_KEY = 'my-stickies-admin-access-token'

export async function apiRequest(path, options = {}) {
  const shouldSendAuth = options.auth ?? path.startsWith('/admin/')
  const token = shouldSendAuth ? window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) : null
  const isFormData = options.body instanceof FormData
  const baseHeaders = isFormData ? {} : { 'Content-Type': 'application/json' }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export { API_BASE_URL }

