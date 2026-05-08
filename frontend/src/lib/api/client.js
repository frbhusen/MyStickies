const getRuntimeConfig = () => window.__MY_STICKIES_RUNTIME__ || {}

const normalizeApiBaseUrl = (value) => value.replace(/\/$/, '')

const getDefaultApiBaseUrl = () => {
  const runtimeBaseUrl = getRuntimeConfig().API_BASE_URL
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (runtimeBaseUrl) {
    return normalizeApiBaseUrl(runtimeBaseUrl)
  }

  if (configuredBaseUrl) {
    return normalizeApiBaseUrl(configuredBaseUrl)
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'
  }

  return '/api'
}

const API_BASE_URL = getDefaultApiBaseUrl()
const ADMIN_ACCESS_TOKEN_KEY = 'my-stickies-admin-access-token'
const ADMIN_AUTH_PATHS = ['/admin/auth/login/', '/admin/auth/refresh/']

export async function apiRequest(path, options = {}) {
  const shouldSendAuth = options.auth ?? (path.startsWith('/admin/') && !ADMIN_AUTH_PATHS.includes(path))
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

