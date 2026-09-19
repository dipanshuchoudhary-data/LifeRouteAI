const KEY = 'sathi-session-token'

export function getSessionToken() {
  try {
    return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

export function setSessionToken(token) {
  try {
    sessionStorage.setItem(KEY, token)
    localStorage.setItem(KEY, token)
  } catch {
    /* ignore quota */
  }
}
