import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'
import { getGlobalApiErrorPayload, isGlobalApiError } from 'src/utils/api-errors.js'
import { fetchAndApplyGet } from 'src/stores/utils/fetch-and-apply.js'

const sortUsers = users => {
    const sortedUsers = sortBy(users, 'lastLogin', 'desc')
    for (const user of sortedUsers) {
        if (Array.isArray(user.channels)) {
            user.channels = sortBy(user.channels, 'created', 'desc')
        }
    }
    return sortedUsers
}

export const useAdminStore = defineStore('admin', () => {
    const users = ref([])
    const outboxDlq = ref([])
    const reportedMedia = ref([])

    const setUsers = value => {
        users.value = value
    }

    const setOutboxDlq = value => {
        outboxDlq.value = Array.isArray(value) ? value : []
    }

    const setReportedMedia = value => {
        reportedMedia.value = Array.isArray(value) ? value : []
    }

    const loadUsers = () => fetchAndApplyGet({
        api,
        url: '/admin/users',
        apply: setUsers,
        requestConfig: {
            __skipGlobalErrorNotify: true
        },
        extract: data => sortUsers(data),
        onError: error => {
            if (isGlobalApiError(error, 'forbidden')) {
                return null
            }
            getGlobalApiErrorPayload(error)
        }
    })

    const loadOutboxDlq = () => fetchAndApplyGet({
        api,
        url: '/admin/outbox/dlq',
        apply: setOutboxDlq,
        requestConfig: {
            __skipGlobalErrorNotify: true
        },
        onError: error => {
            if (isGlobalApiError(error, 'forbidden')) {
                return null
            }
            getGlobalApiErrorPayload(error)
        }
    })

    const requeueDLQItem = async eventId => {
        await api.post(`/admin/outbox/requeue/${eventId}`, null, {
            __skipGlobalErrorNotify: true
        })
        await loadOutboxDlq()
    }

    const deleteUser = async userId => {
        try {
            await api.delete(`/admin/users/${userId}`, {
                __skipGlobalErrorNotify: true
            })
        } catch (error) {
            if (error?.__userCancelled) {
                return false
            }
            throw error
        }

        setUsers([])
        await loadUsers()
    }

    const approveUser = async userId => {
        try {
            await api.post(`/admin/users/${userId}/approve`, null, {
                __skipGlobalErrorNotify: true
            })
        } catch (error) {
            if (error?.__userCancelled) {
                return false
            }
            throw error
        }

        setUsers([])
        await loadUsers()
    }

    const loadReportedMedia = () => fetchAndApplyGet({
        api,
        url: '/admin/media/reported',
        apply: setReportedMedia,
        requestConfig: {
            __skipGlobalErrorNotify: true
        },
        onError: error => {
            if (isGlobalApiError(error, 'forbidden')) {
                return null
            }
            getGlobalApiErrorPayload(error)
        }
    })

    const deleteMedia = async privateId => {
        try {
            await api.delete(`/admin/media/${privateId}`, {
                __skipGlobalErrorNotify: true
            })
        } catch (error) {
            if (error?.__userCancelled) {
                return false
            }
            throw error
        }

        setReportedMedia([])
        await loadReportedMedia()
        return true
    }

    return {
        users,
        outboxDlq,
        reportedMedia,
        loadUsers,
        loadOutboxDlq,
        requeueDLQItem,
        deleteUser,
        approveUser,
        loadReportedMedia,
        deleteMedia
    }
})
