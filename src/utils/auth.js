import { LocalStorage } from 'quasar'

const REDIRECT_KEY = 'fotrino-films-redirect'

export function logout(store) {
  return store.dispatch('account/logout')
}

export function storeRedirect() {
  LocalStorage.set(REDIRECT_KEY, window.location.pathname)
}

export function getRedirect(route) {
  const redirect = LocalStorage.getItem(REDIRECT_KEY) || '/'
  LocalStorage.remove(REDIRECT_KEY)
  return redirect + (route?.query?.newUser === 'true' ? '?showTerms=true' : '')
}
