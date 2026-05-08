const ADMIN_ACCESS_TOKEN_KEY = 'my-stickies-admin-access-token'
const ADMIN_REFRESH_TOKEN_KEY = 'my-stickies-admin-refresh-token'

export function saveAdminTokens(tokens) {
  if (tokens?.access) {
    window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, tokens.access)
  }
  if (tokens?.refresh) {
    window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, tokens.refresh)
  }
}

export function clearAdminTokens() {
  window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
}

export function isAdminAuthenticated() {
  return Boolean(window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY))
}
