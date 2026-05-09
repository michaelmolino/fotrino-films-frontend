import { ref } from 'vue'
import {
    acquirePendingUploadLock,
    releasePendingUploadLock,
    startPendingUploadLockHeartbeat
} from '@utils/pendingUploadLocks.js'

/**
 * Composable for managing pending upload locks.
 * Handles acquire, heartbeat, and release lifecycle.
 *
 * @returns {Object} Methods to acquire, release, and manage lock lifecycle
 */
export function usePendingUploadLock() {
    const activeMediaRef = ref(null)
    let stopHeartbeat = null

    function acquire(mediaRef) {
        if (mediaRef == null) {
            return
        }

        activeMediaRef.value = mediaRef
        acquirePendingUploadLock(mediaRef)
        stopHeartbeat = startPendingUploadLockHeartbeat(mediaRef)
    }

    function release() {
        if (typeof stopHeartbeat === 'function') {
            stopHeartbeat()
            stopHeartbeat = null
        }

        if (activeMediaRef.value != null) {
            releasePendingUploadLock(activeMediaRef.value)
            activeMediaRef.value = null
        }
    }

    return {
        activeMediaRef,
        acquire,
        release
    }
}
