import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { isGlobalApiError } from 'src/utils/apiErrors.js'
import { mutationResult, runMutation } from 'src/utils/storeMutations.js'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const jobs = ref([])
  const reportedMedia = ref([])
  const queryCache = useQueryCache()

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

  const invalidateQueries = options => {
    queryCache.invalidateQueries(options).catch(() => { })
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
      await runMutation({
        request: () => api.post(`/admin/jobs/pending/${job.id}/start-now`)
      })
      invalidateQueries({ key: ['admin', 'jobs'] })
      return mutationResult({ ok: true, data: 'started' })
    }
    if (job.status === 'failed') {
      await runMutation({
        request: () => api.post(`/admin/jobs/failed/${job.id}/replay`)
      })
      invalidateQueries({ key: ['admin', 'jobs'] })
      return mutationResult({ ok: true, data: 'replayed' })
    }
    throw new Error(`No admin action available for status: ${job.status}`)
  }

  const deleteUser = async userEmail => {
    const response = await runMutation({
      request: () => api.delete(`/admin/users/email/${encodeURIComponent(userEmail)}`),
      onError: error => {
        if (error?.__userCancelled) {
          return CANCELLED
        }
      }
    })
    if (response === CANCELLED) {
      return mutationResult({ ok: false, cancelled: true })
    }

    invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
    return mutationResult({ ok: true })
  }

  const approveUser = async userEmail => {
    const response = await runMutation({
      request: () => api.post(`/admin/users/email/${encodeURIComponent(userEmail)}/approve`),
      onError: error => {
        if (error?.__userCancelled) {
          return CANCELLED
        }
      }
    })
    if (response === CANCELLED) {
      return mutationResult({ ok: false, cancelled: true })
    }

    invalidateQueries({
      key: usersQueryOptions().key,
      exact: true
    })
    return mutationResult({ ok: true })
  }

  const deleteMedia = async privateId => {
    const response = await runMutation({
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

    invalidateQueries({
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
