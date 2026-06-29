import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { mutationResult, runMutation } from 'src/stores/utils/store-mutations.js'
import { computed } from 'vue'
import {
  createApiGetQueryOptionsFactory,
  invalidateQueriesSafely,
  toArray
} from 'src/stores/utils/query-helpers.js'
import { api } from 'src/clients/axios-client.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-error-service.js'

export const useAdminStore = defineStore('admin', () => {
  const queryCache = useQueryCache()

  const CANCELLED = Symbol('cancelled')

  const usersQueryOptions = createApiGetQueryOptionsFactory({
    key: ['admin', 'users'],
    staleTime: 0,
    url: '/admin/users',
    config: {
      __policy: {
        errorHandling: 'none'
      }
    },
    transform: data => toArray(data?.data)
  })

  const jobsQueryOptions = (statuses = []) => {
    const statusList = [...statuses]

    return createApiGetQueryOptionsFactory({
      key: ['admin', 'jobs', statusList],
      staleTime: 0,
      url: '/admin/jobs',
      config: {
        params: statusList.length > 0 ? { status: statusList } : undefined,
        __policy: {
          errorHandling: 'none'
        }
      },
      transform: data => toArray(data?.data)
    })()
  }

  const reportedMediaQueryOptions = createApiGetQueryOptionsFactory({
    key: ['admin', 'media', 'reported'],
    staleTime: 0,
    url: '/admin/media/reported',
    config: {
      __policy: {
        errorHandling: 'none'
      }
    },
    transform: data => toArray(data?.data)
  })

  const useUsersQuery = () => {
    const query = useQuery(usersQueryOptions)
    return {
      ...query,
      data: computed(() => {
        if (getGlobalApiErrorPayload(query.error.value)?.error === 'forbidden') {
          return []
        }
        return toArray(query.data.value)
      })
    }
  }

  const useJobsQuery = (statuses = []) => {
    const query = useQuery(() => jobsQueryOptions(statuses))
    return {
      ...query,
      data: computed(() => {
        if (getGlobalApiErrorPayload(query.error.value)?.error === 'forbidden') {
          return []
        }
        return toArray(query.data.value)
      })
    }
  }

  const useReportedMediaQuery = () => {
    const query = useQuery(reportedMediaQueryOptions)
    return {
      ...query,
      data: computed(() => {
        if (getGlobalApiErrorPayload(query.error.value)?.error === 'forbidden') {
          return []
        }
        return toArray(query.data.value)
      })
    }
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
    if (job.status === 'doing' || job.status === 'stalled') {
      await runMutation({
        request: () => api.post(`/admin/jobs/doing/${job.id}/requeue`)
      })
      invalidateQueriesSafely(queryCache, { key: ['admin', 'jobs'] })
      return mutationResult({ ok: true, data: 'requeued' })
    }
    throw new Error(`No admin action available for status: ${job.status}`)
  }

  const cleanupPendingUploads = async ({
    dryRun = true,
    olderThanHours = 24,
    limit = 200
  } = {}) => {
    const parsedOlderThanHours = Number.parseInt(String(olderThanHours), 10)
    const parsedLimit = Number.parseInt(String(limit), 10)
    if (!Number.isInteger(parsedOlderThanHours) || parsedOlderThanHours < 1) {
      throw new Error('Older Than Hours must be an integer greater than 0.')
    }
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new Error('Limit must be an integer greater than 0.')
    }

    const response = await runMutation({
      request: () =>
        api.post('/admin/maintenance/pending-uploads/cleanup', null, {
          params: {
            dryRun: dryRun ? 'true' : 'false',
            olderThanHours: parsedOlderThanHours,
            limit: parsedLimit
          },
          __policy: {
            errorHandling: 'none'
          }
        })
    })

    return mutationResult({ ok: true, data: response?.data?.data || null })
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
    useUsersQuery,
    useJobsQuery,
    useReportedMediaQuery,
    usersQueryOptions,
    jobsQueryOptions,
    reportedMediaQueryOptions,
    runJobAction,
    cleanupPendingUploads,
    deleteUser,
    approveUser,
    deleteMedia
  }
})
