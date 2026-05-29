export const REQUEST_POLICY_LOADING = Object.freeze({
  GLOBAL: 'global',
  NONE: 'none'
})

export const REQUEST_POLICY_NOTIFY = Object.freeze({
  GLOBAL: 'global',
  LOCAL: 'local',
  NONE: 'none'
})

export const REQUEST_POLICY_NOT_FOUND = Object.freeze({
  ROUTE_404: 'route404',
  NONE: 'none'
})

export const REQUEST_POLICY_AUTH_REDIRECT = Object.freeze({
  GLOBAL: 'global',
  NONE: 'none'
})

const DEFAULT_REQUEST_POLICY = Object.freeze({
  loading: REQUEST_POLICY_LOADING.GLOBAL,
  notify: REQUEST_POLICY_NOTIFY.GLOBAL,
  notFound: REQUEST_POLICY_NOT_FOUND.NONE,
  authRedirect: REQUEST_POLICY_AUTH_REDIRECT.GLOBAL
})

function getPolicy(config) {
  return config?.__policy && typeof config.__policy === 'object' ? config.__policy : null
}

export function resolveRequestPolicy(config) {
  const policy = getPolicy(config)
  return {
    loading: policy?.loading ?? DEFAULT_REQUEST_POLICY.loading,
    notify: policy?.notify ?? DEFAULT_REQUEST_POLICY.notify,
    notFound: policy?.notFound ?? DEFAULT_REQUEST_POLICY.notFound,
    authRedirect: policy?.authRedirect ?? DEFAULT_REQUEST_POLICY.authRedirect
  }
}