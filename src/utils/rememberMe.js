const FLAG_KEY = 'rb_remember'

// "Remember Me" decides where the session lives: localStorage survives browser
// restarts, sessionStorage clears the moment the tab/browser closes.
export function getRememberMe() {
  return localStorage.getItem(FLAG_KEY) !== 'false'
}

export function setRememberMe(remember) {
  localStorage.setItem(FLAG_KEY, remember ? 'true' : 'false')
}

export function getSessionStore() {
  return getRememberMe() ? localStorage : sessionStorage
}
