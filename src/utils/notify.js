import { Notify } from 'quasar'

// Action button configs for reuse
const DISMISS_ACTION = Object.freeze([{ label: 'Dismiss', color: 'white' }])
const CONFIRM_ACTION = (label = 'Confirm delete', action = {}) => ({
    label,
    color: 'negative',
    ...action,
    handler: action.handler || (() => { })
})
const CANCEL_ACTION = (label = 'Go Back', action = {}) => ({
    label,
    color: 'white',
    ...action,
    handler: action.handler || (() => { })
})

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
    return Notify.create({
        type: 'positive',
        icon: 'check',
        timeout: 2000,
        message,
        ...options
    })
}

// Notify info
export function notifyInfo(message, options = {}) {
    return Notify.create({
        type: 'info',
        icon: 'info',
        timeout: 2000,
        message,
        ...options
    })
}

// Notify warning
export function notifyWarning(message, options = {}) {
    return Notify.create({
        type: 'warning',
        icon: 'warning',
        timeout: 3000,
        message,
        ...options
    })
}

// Notify error with persistent dismiss
export function notifyError(message, options = {}) {
    const payload = withPersistentDismiss({
        type: 'negative',
        icon: 'warning',
        timeout: 3000,
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
