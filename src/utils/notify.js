import { Notify } from 'quasar'

// Action button configs for reuse
const DISMISS_ACTION = Object.freeze([{ label: 'Dismiss', color: 'white' }])
const DEFAULT_TIMEOUTS = Object.freeze({
  positive: 2000,
  info: 2000,
  warning: 2200,
  negative: 3000
})
const createAction = (label, action = {}) => ({
  label,
  color: 'white',
  ...action,
  handler: action.handler || (() => {})
})

const CONFIRM_ACTION = (label = 'Confirm delete', action = {}) => createAction(label, action)
const CANCEL_ACTION = (label = 'Go Back', action = {}) => createAction(label, action)

function notifyWithDefaults(type, icon, message, options = {}) {
  return Notify.create({
    type,
    icon,
    timeout: DEFAULT_TIMEOUTS[type],
    message,
    ...options
  })
}

// Add persistent dismiss button if timeout is 0 and no actions
function withPersistentDismiss(options) {
  const timeout = options?.timeout
  if (timeout !== 0 || options?.actions?.length) {
    return options
  }
  return {
    ...options,
    actions: DISMISS_ACTION
  }
}

// Notify success
export function notifySuccess(message, options = {}) {
  return notifyWithDefaults('positive', 'check', message, options)
}

export function notifyInfo(message, options = {}) {
  return notifyWithDefaults('info', 'info', message, options)
}

export function notifyWarning(message, options = {}) {
  return notifyWithDefaults('warning', 'warning', message, options)
}

// Notify error with persistent dismiss
export function notifyError(message, options = {}) {
  if (typeof message !== 'string' || !message.trim()) {
    return null
  }

  const payload = withPersistentDismiss({
    type: 'negative',
    icon: 'warning',
    timeout: DEFAULT_TIMEOUTS.negative,
    message,
    ...options
  })
  return Notify.create(payload)
}

// Confirm destructive action with custom actions
export function confirmDestructiveAction(options = {}) {
  const {
    message = 'This is a destructive action. Are you sure you want to continue?',
    position = 'center',
    confirmLabel = 'Confirm delete',
    cancelLabel = 'Go Back',
    confirmAction = {},
    cancelAction = {}
  } = options

  return new Promise(resolve => {
    let settled = false
    const settle = value => {
      if (settled) return
      settled = true
      resolve(value)
    }

    Notify.create({
      type: 'negative',
      timeout: 0,
      message,
      position,
      icon: 'info',
      multiLine: true,
      actions: [
        {
          ...CONFIRM_ACTION(confirmLabel, {
            icon: 'error',
            ...confirmAction,
            handler: () => settle(true)
          })
        },
        {
          ...CANCEL_ACTION(cancelLabel, {
            icon: 'undo',
            ...cancelAction,
            handler: () => settle(false)
          })
        }
      ],
      onDismiss: () => settle(false)
    })
  })
}
