const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

window.__MY_STICKIES_RUNTIME__ = {
  API_BASE_URL: isLocalHost ? 'http://localhost:8000/api' : window.location.origin + '/api',
}