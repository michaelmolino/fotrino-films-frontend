import { Notify } from 'quasar'

const DISMISS_ACTION = Object.freeze([{ label: 'Dismiss', color: 'white' }])

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

export function notifySuccess(message, options = {}) {
    return Notify.create({
        type: 'positive',
        icon: 'check',
        timeout: 2000,
        message,
        ...options
    })
}

export function notifyInfo(message, options = {}) {
    return Notify.create({
        type: 'info',
        icon: 'info',
        timeout: 2000,
        message,
        ...options
    })
}

export function notifyWarning(message, options = {}) {
    return Notify.create({
        type: 'warning',
        icon: 'warning',
        timeout: 3000,
        message,
        ...options
    })
}

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
                    icon: 'error',
                    label: confirmLabel,
                    color: 'white',
                    ...confirmAction,
                    handler: () => settle(true)
                },
                {
                    icon: 'undo',
                    label: cancelLabel,
                    color: 'white',
                    ...cancelAction,
                    handler: () => settle(false)
                }
            ],
            onDismiss: () => settle(false)
        })
    })
}
