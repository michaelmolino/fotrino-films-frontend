import { LocalStorage } from 'quasar'

export function logout(store) {
  fetch('/api/account/logout')
    .then(() => store.dispatch('account/getProfile'))
    .catch(err => console.error('Logout failed:', err))
}

export function storeRedirect() {
  LocalStorage.set('postLoginRedirect', window.location.pathname)
}
