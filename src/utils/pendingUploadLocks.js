// Pending upload lock logic for multi-tab safety
const LOCK_PREFIX = 'fotrino.pending-upload.lock.'
const TAB_ID_KEY = 'fotrino.upload.tab-id'
const LOCK_TTL_MS = 45000
const HEARTBEAT_MS = 10000

// Generate a unique tab ID for this browser tab
function createTabId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Get or create the tab ID for this tab
function getTabId() {
  try {
    const existing = globalThis.sessionStorage?.getItem(TAB_ID_KEY)
    if (existing) return existing
    const created = createTabId()
    globalThis.sessionStorage?.setItem(TAB_ID_KEY, created)
    return created
  } catch {
    return 'unknown-tab'
  }
}

// Get the localStorage key for a mediaId
function getLockKey(mediaId) {
  return `${LOCK_PREFIX}${mediaId}`
}

// Read the lock object from localStorage
function readLock(mediaId) {
  const raw = globalThis.localStorage?.getItem(getLockKey(mediaId))
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Check if a lock is still alive (not stale)
function isLockAlive(lock) {
  if (!lock?.heartbeatAt) return false
  return Date.now() - Number(lock.heartbeatAt) <= LOCK_TTL_MS
}

// Remove stale lock if expired, otherwise return lock
function clearStaleLock(mediaId) {
  const lock = readLock(mediaId)
  if (!lock) return null
  if (isLockAlive(lock)) return lock
  globalThis.localStorage?.removeItem(getLockKey(mediaId))
  return null
}

// Acquire a lock for a pending upload
export function acquirePendingUploadLock(mediaId) {
  if (mediaId == null) return null
  const lock = {
    mediaId,
    ownerTabId: getTabId(),
    startedAt: Date.now(),
    heartbeatAt: Date.now()
  }
  globalThis.localStorage?.setItem(getLockKey(mediaId), JSON.stringify(lock))
  return lock
}

// Update the heartbeat for a lock if owned by this tab
export function touchPendingUploadLock(mediaId) {
  const lock = clearStaleLock(mediaId)
  if (!lock) return false
  if (lock.ownerTabId !== getTabId()) return false

  const next = {
    ...lock,
    heartbeatAt: Date.now()
  }
  globalThis.localStorage?.setItem(getLockKey(mediaId), JSON.stringify(next))
  return true
}

// Start a heartbeat interval for a lock; returns a cleanup function
export function startPendingUploadLockHeartbeat(mediaId) {
  if (mediaId == null) {
    return () => {}
  }
  const timerId = globalThis.setInterval(() => {
    touchPendingUploadLock(mediaId)
  }, HEARTBEAT_MS)

  return () => {
    globalThis.clearInterval(timerId)
  }
}

// Release a lock if owned by this tab
export function releasePendingUploadLock(mediaId) {
  if (mediaId == null) return
  const lock = clearStaleLock(mediaId)
  if (!lock) return
  if (lock.ownerTabId !== getTabId()) return
  globalThis.localStorage?.removeItem(getLockKey(mediaId))
}

// Check if a lock is held by another tab
export function isPendingUploadLockedByAnotherTab(mediaId) {
  if (mediaId == null) return false
  const lock = clearStaleLock(mediaId)
  if (!lock) return false
  return lock.ownerTabId !== getTabId()
}
