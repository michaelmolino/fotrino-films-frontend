export function logout(store) {
  fetch('/api/account/logout')
    .then(() => store.dispatch('account/getProfile'))
    .catch(err => console.error('Logout failed:', err))
}
