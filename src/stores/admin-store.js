import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { isGlobalApiError } from 'src/utils/apiErrors.js'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const jobs = ref([])
  const reportedMedia = ref([])
  const queryCache = useQueryCache()

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
      throw error
    }
  }

  const mutationResult = ({ ok, data = null, cancelled = false }) => ({
    ok,
    data,
    cancelled
  })
  const CANCELLED = Symbol('cancelled')

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
          params: normalizedStatuses.length > 0 ? { status: normalizedStatuses } : undefined,
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

  const useUsersQuery = () => {
    const query = useQuery(usersQueryOptions)

    watch(
      () => query.data.value,
      value => {
        setUsers(Array.isArray(value) ? value : [])
      },
      { immediate: true }
    )

    watch(
      () => query.error.value,
      error => {
        if (error && isGlobalApiError(error, 'forbidden')) {
          setUsers([])
        }
      },
      { immediate: true }
    )

    return query
  }

  const useJobsQuery = (statuses = []) => {
    const query = useQuery(() => jobsQueryOptions(statuses))

    watch(
      () => query.data.value,
      value => {
        setJobs(Array.isArray(value) ? value : [])
      },
      { immediate: true }
    )

    watch(
      () => query.error.value,
      error => {
        if (error && isGlobalApiError(error, 'forbidden')) {
          setJobs([])
        }
      },
      { immediate: true }
    )

    return query
  }

  const useReportedMediaQuery = () => {
    const query = useQuery(reportedMediaQueryOptions)

    watch(
      () => query.data.value,
      value => {
        setReportedMedia(Array.isArray(value) ? value : [])
      },
      { immediate: true }
    )

    watch(
      () => query.error.value,
      error => {
        if (error && isGlobalApiError(error, 'forbidden')) {
          setReportedMedia([])
        }
      },
      { immediate: true }
    )

    return query
  }

  const runJobAction = async job => {
    if (!job?.id || !job?.status) {
      throw new Error('Invalid admin job payload.')
    }
    if (job.status === 'todo') {
      await runStoreMutation({
        request: () => api.post(`/admin/jobs/pending/${job.id}/start-now`)
      })
      void queryCache.invalidateQueries({ key: ['admin', 'jobs'] })
      return mutationResult({ ok: true, data: 'started' })
    }
    if (job.status === 'failed') {
      await runStoreMutation({
        request: () => api.post(`/admin/jobs/failed/${job.id}/replay`)
      })
      void queryCache.invalidateQueries({ key: ['admin', 'jobs'] })
      return mutationResult({ ok: true, data: 'replayed' })
    }
    throw new Error(`No admin action available for status: ${job.status}`)
  }

  const deleteUser = async userId => {
    const response = await runStoreMutation({
      request: () => api.delete(`/admin/users/${userId}`),
      onError: error => {
        if (error?.__userCancelled) {
          return CANCELLED
        }
      }
    })
    if (response === CANCELLED) {
      return mutationResult({ ok: false, cancelled: true })
    }

    void queryCache.invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
    return mutationResult({ ok: true })
  }

  const approveUser = async userId => {
    const response = await runStoreMutation({
      request: () => api.post(`/admin/users/${userId}/approve`),
      onError: error => {
        if (error?.__userCancelled) {
          return CANCELLED
        }
      }
    })
    if (response === CANCELLED) {
      return mutationResult({ ok: false, cancelled: true })
    }

    void queryCache.invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
    return mutationResult({ ok: true })
  }

  const deleteMedia = async privateId => {
    const response = await runStoreMutation({
      request: () => api.delete(`/admin/media/${privateId}`),
      onError: error => {
        if (error?.__userCancelled) {
          return CANCELLED
        }
      }
    })
    if (response === CANCELLED) {
      return mutationResult({ ok: false, cancelled: true })
    }

    void queryCache.invalidateQueries({
      key: reportedMediaQueryOptions().key,
      exact: true
    })
    return mutationResult({ ok: true })
  }

  return {
    users,
    jobs,
    reportedMedia,
    useUsersQuery,
    useJobsQuery,
    useReportedMediaQuery,
    usersQueryOptions,
    jobsQueryOptions,
    reportedMediaQueryOptions,
    runJobAction,
    deleteUser,
    approveUser,
    deleteMedia
  }
})
