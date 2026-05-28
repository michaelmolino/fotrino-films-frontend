import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { isGlobalApiError } from 'src/utils/apiErrors.js'
import { mutationResult, runMutation } from 'src/utils/storeMutations.js'
import {
  createApiGetQueryOptionsFactory,
  invalidateQueriesSafely,
  toArray
} from 'src/stores/utils/query-helpers.js'
import { api } from 'src/clients/axios-client.js'
import { assertArrayResponse } from 'src/utils/responseGuards.js'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const jobs = ref([])
  const reportedMedia = ref([])
  const queryCache = useQueryCache()

  const CANCELLED = Symbol('cancelled')

  const usersQueryOptions = createApiGetQueryOptionsFactory({
    key: ['admin', 'users'],
    staleTime: 0,
    url: '/admin/users',
    config: {
      __skipGlobalErrorNotify: true,
      __responseGuard: data => assertArrayResponse(data, 'Admin users')
    },
    transform: data => toArray(data)
  })

  const jobsQueryOptions = (statuses = []) => {
    const normalizedStatuses = Array.isArray(statuses)
      ? [...statuses]
        .filter(Boolean)
        .map(String)
        .sort((a, b) => a.localeCompare(b))
      : []

    return createApiGetQueryOptionsFactory({
      key: ['admin', 'jobs', normalizedStatuses],
      staleTime: 0,
      url: '/admin/jobs',
      config: {
        params: normalizedStatuses.length > 0 ? { status: normalizedStatuses } : undefined,
        __skipGlobalErrorNotify: true,
        __responseGuard: data => assertArrayResponse(data, 'Admin jobs')
      },
      transform: data => toArray(data)
    })()
  }

  const reportedMediaQueryOptions = createApiGetQueryOptionsFactory({
    key: ['admin', 'media', 'reported'],
    staleTime: 0,
    url: '/admin/media/reported',
    config: {
      __skipGlobalErrorNotify: true,
      __responseGuard: data => assertArrayResponse(data, 'Admin reported media')
    },
    transform: data => toArray(data)
  })

  const setUsers = value => {
    users.value = value
  }

  const setJobs = value => {
    jobs.value = toArray(value)
  }

  const setReportedMedia = value => {
    reportedMedia.value = toArray(value)
  }

  const useUsersQuery = () => {
    const query = useQuery(usersQueryOptions)

    watch(
      () => query.data.value,
      value => {
        setUsers(toArray(value))
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
        setJobs(toArray(value))
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
        setReportedMedia(toArray(value))
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
      invalidateQueriesSafely(queryCache, { key: ['admin', 'jobs'] })
      return mutationResult({ ok: true, data: 'started' })
    }
    if (job.status === 'failed') {
      await runMutation({
        request: () => api.post(`/admin/jobs/failed/${job.id}/replay`)
      })
      invalidateQueriesSafely(queryCache, { key: ['admin', 'jobs'] })
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

    invalidateQueriesSafely(queryCache, {
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

    invalidateQueriesSafely(queryCache, {
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

    invalidateQueriesSafely(queryCache, {
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
