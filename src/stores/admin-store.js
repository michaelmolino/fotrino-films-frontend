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
    const outboxDLQ = ref([])
    const reportedMedia = ref([])

    const setUsers = payload => {
        users.value = payload
    }

    const setOutboxDLQ = payload => {
        outboxDLQ.value = Array.isArray(payload) ? payload : []
    }

    const setReportedMedia = payload => {
        reportedMedia.value = Array.isArray(payload) ? payload : []
    }

    const getAllUsers = () => fetchAndApplyGet({
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

    const getDLQ = () => fetchAndApplyGet({
        api,
        url: '/admin/outbox/dlq',
        apply: setOutboxDLQ,
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
        await getDLQ()
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
        await getAllUsers()
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
        await getAllUsers()
    }

    const getReportedMedia = () => fetchAndApplyGet({
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
        await getReportedMedia()
        return true
    }

    return {
        users,
        outboxDLQ,
        reportedMedia,
        getAllUsers,
        getDLQ,
        requeueDLQItem,
        deleteUser,
        approveUser,
        getReportedMedia,
        deleteMedia
    }
})
