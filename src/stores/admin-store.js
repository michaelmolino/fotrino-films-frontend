import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useQueryCache } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { getGlobalApiErrorPayload, isGlobalApiError } from 'src/utils/api-errors.js'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const jobs = ref([])
  const reportedMedia = ref([])
  const queryCache = useQueryCache()

  const runStoreQuery = async ({ options, apply, onError }) => {
    const entry = queryCache.ensure(options)

    try {
      const state = await queryCache.refresh(entry, options)
      if (state?.status === 'error') {
        throw state.error || new Error('Admin query failed')
      }
      const value = state?.data ?? null
      if (typeof apply === 'function') {
        apply(value)
      }
      return value
    } catch (error) {
      if (typeof apply === 'function') {
        apply(null)
      }
      if (typeof onError === 'function') {
        const maybe = onError(error)
        if (maybe !== undefined) {
          return maybe
        }
      }
      throw error
    }
  }

  const runStoreMutation = async ({ request, onSuccess, onError }) => {
    try {
      const result = await request()
      if (typeof onSuccess === 'function') {
        await onSuccess(result)
      }
      return result
    } catch (error) {
      if (typeof onError === 'function') {
        const maybe = onError(error)
        if (maybe !== undefined) {
          return maybe
        }
      }
      getGlobalApiErrorPayload(error)
      throw error
    }
  }

  const usersQueryOptions = () => ({
    key: ['admin', 'users'],
    staleTime: 0,
    query: async () => {
      const { data } = await api.get('/admin/users', {
        __skipGlobalErrorNotify: true
      })
      return Array.isArray(data) ? data : []
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
        return Array.isArray(data) ? data : []
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
      return Array.isArray(data) ? data : []
    }
  })

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
    runStoreQuery({
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
    runStoreQuery({
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
      await runStoreMutation({
        request: () =>
          api.post(`/admin/jobs/pending/${job.id}/start-now`, null, {
            __skipGlobalErrorNotify: true
          })
      })
      void queryCache.invalidateQueries({ key: ['admin', 'jobs'] })
      await loadJobs()
      return 'started'
    }
    if (job.status === 'failed') {
      await runStoreMutation({
        request: () =>
          api.post(`/admin/jobs/failed/${job.id}/replay`, null, {
            __skipGlobalErrorNotify: true
          })
      })
      void queryCache.invalidateQueries({ key: ['admin', 'jobs'] })
      await loadJobs()
      return 'replayed'
    }
    throw new Error(`No admin action available for status: ${job.status}`)
  }

  const deleteUser = async userId => {
    const response = await runStoreMutation({
      request: () =>
        api.delete(`/admin/users/${userId}`, {
          __skipGlobalErrorNotify: true
        }),
      onError: error => {
        if (error?.__userCancelled) {
          return false
        }
      }
    })
    if (response === false) {
      return false
    }

    void queryCache.invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
    setUsers([])
    await loadUsers()
  }

  const approveUser = async userId => {
    const response = await runStoreMutation({
      request: () =>
        api.post(`/admin/users/${userId}/approve`, null, {
          __skipGlobalErrorNotify: true
        }),
      onError: error => {
        if (error?.__userCancelled) {
          return false
        }
      }
    })
    if (response === false) {
      return false
    }

    void queryCache.invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
    setUsers([])
    await loadUsers()
  }

  const loadReportedMedia = () =>
    runStoreQuery({
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
    const response = await runStoreMutation({
      request: () =>
        api.delete(`/admin/media/${privateId}`, {
          __skipGlobalErrorNotify: true
        }),
      onError: error => {
        if (error?.__userCancelled) {
          return false
        }
      }
    })
    if (response === false) {
      return false
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
