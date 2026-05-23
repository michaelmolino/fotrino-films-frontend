import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useQueryCache } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { sortBy } from '@utils/sort.js'
import { getGlobalApiErrorPayload, isGlobalApiError } from 'src/utils/api-errors.js'

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
  const queryCache = useQueryCache()

  const usersQueryOptions = () => ({
    key: ['admin', 'users'],
    staleTime: 0,
    query: async () => {
      const { data } = await api.get('/admin/users', {
        __skipGlobalErrorNotify: true
      })
      return sortUsers(data)
    }
  })

  const jobsQueryOptions = (statuses = []) => {
    const normalizedStatuses = Array.isArray(statuses)
      ? [...statuses]
        .filter(Boolean)
        .map(String)
        .sort((a, b) => a.localeCompare(b))
      : []

    return {
      key: ['admin', 'jobs', normalizedStatuses],
      staleTime: 0,
      query: async () => {
        const { data } = await api.get('/admin/jobs', {
          params:
            normalizedStatuses.length > 0 ? { status: normalizedStatuses } : undefined,
          __skipGlobalErrorNotify: true
        })
        return data
      }
    }
  }

  const reportedMediaQueryOptions = () => ({
    key: ['admin', 'media', 'reported'],
    staleTime: 0,
    query: async () => {
      const { data } = await api.get('/admin/media/reported', {
        __skipGlobalErrorNotify: true
      })
      return data
    }
  })

  const runAdminQuery = async ({ options, apply, onError }) => {
    const entry = queryCache.ensure(options)

    try {
      const state = await queryCache.refresh(entry, options)
      if (state?.status === 'error') {
        throw state.error || new Error('Admin query failed')
      }
      const value = state?.data ?? null
      apply(value)
      return value
    } catch (error) {
      apply(null)
      if (typeof onError === 'function') {
        const maybe = onError(error)
        if (maybe !== undefined) {
          return maybe
        }
      }
      throw error
    }
  }

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
    runAdminQuery({
      options: usersQueryOptions(),
      apply: setUsers,
      onError: error => {
        if (isGlobalApiError(error, 'forbidden')) {
          return null
        }
        getGlobalApiErrorPayload(error)
      }
    })

  const loadJobs = (statuses = []) =>
    runAdminQuery({
      options: jobsQueryOptions(statuses),
      apply: setJobs,
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
      void queryCache.invalidateQueries({ key: ['admin', 'jobs'] })
      await loadJobs()
      return 'started'
    }
    if (job.status === 'failed') {
      await api.post(`/admin/jobs/failed/${job.id}/replay`, null, {
        __skipGlobalErrorNotify: true
      })
      void queryCache.invalidateQueries({ key: ['admin', 'jobs'] })
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

    void queryCache.invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
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

    void queryCache.invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
    setUsers([])
    await loadUsers()
  }

  const loadReportedMedia = () =>
    runAdminQuery({
      options: reportedMediaQueryOptions(),
      apply: setReportedMedia,
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

    void queryCache.invalidateQueries({
      key: reportedMediaQueryOptions().key,
      exact: true
    })
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
