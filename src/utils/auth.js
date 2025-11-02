import { LocalStorage } from 'quasar'

const REDIRECT_KEY = 'fotrino-films-redirect'

export async function logout(store) {
  await store.dispatch('account/logout')
}

export function storeRedirect() {
  LocalStorage.set(REDIRECT_KEY, globalThis.location.pathname)
}

export function getRedirect(route) {
  let redirect = LocalStorage.getItem(REDIRECT_KEY) || '/'
  LocalStorage.remove(REDIRECT_KEY)
  if (typeof redirect !== 'string' || redirect === '[object Object]') {
    redirect = '/'
  }
  return redirect + (route?.query?.newUser === 'true' ? '?showTerms=true' : '')
}
