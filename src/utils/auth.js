import { LocalStorage } from 'quasar'

const REDIRECT_KEY = 'fotrino-films-redirect'


// Store the current path for redirect after login
export function storeRedirect() {
  LocalStorage.set(REDIRECT_KEY, globalThis.location.pathname)
}

// Get the redirect path after login, with fallback and new user query param
export function getRedirect(route) {
  let redirect = LocalStorage.getItem(REDIRECT_KEY) || '/'
  LocalStorage.remove(REDIRECT_KEY)
  // Defensive: handle cases where LocalStorage returns an object or invalid string
  if (typeof redirect !== 'string' || redirect === '[object Object]') {
    redirect = '/'
  }
  // If new user, show terms
  return redirect + (route?.query?.newUser === 'true' ? '?showTerms=true' : '')
}
