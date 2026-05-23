import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/clients/axios-client.js'
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
  const jobs = ref([])
  const reportedMedia = ref([])

  const setUsers = value => {
    users.value = value
  }

  const setJobs = value => {
    jobs.value = Array.isArray(value) ? value : []
  }

  const setReportedMedia = value => {
    reportedMedia.value = Array.isArray(value) ? value : []
  }

  const loadUsers = () =>
    fetchAndApplyGet({
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

  const loadJobs = (statuses = []) =>
    fetchAndApplyGet({
      api,
      url: '/admin/jobs',
      apply: setJobs,
      requestConfig: {
        params: Array.isArray(statuses) && statuses.length > 0 ? { status: statuses } : undefined,
        __skipGlobalErrorNotify: true
      },
      onError: error => {
        if (isGlobalApiError(error, 'forbidden')) {
          return null
        }
        getGlobalApiErrorPayload(error)
      }
    })

  const runJobAction = async job => {
    if (!job?.id || !job?.status) {
      throw new Error('Invalid admin job payload.')
    }
    if (job.status === 'todo') {
      await api.post(`/admin/jobs/pending/${job.id}/start-now`, null, {
        __skipGlobalErrorNotify: true
      })
      await loadJobs()
      return 'started'
    }
    if (job.status === 'failed') {
      await api.post(`/admin/jobs/failed/${job.id}/replay`, null, {
        __skipGlobalErrorNotify: true
      })
      await loadJobs()
      return 'replayed'
    }
    throw new Error(`No admin action available for status: ${job.status}`)
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

  const loadReportedMedia = () =>
    fetchAndApplyGet({
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
    jobs,
    reportedMedia,
    loadUsers,
    loadJobs,
    runJobAction,
    deleteUser,
    approveUser,
    loadReportedMedia,
    deleteMedia
  }
})
