import { boot } from 'quasar/wrappers'

export default boot(() => {
  if (typeof globalThis.window === 'undefined') return
  if (process.env.NODE_ENV !== 'development') return

  const roError = /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/

  // Suppress ResizeObserver loop errors that bubble to window and trigger the dev overlay
  globalThis.window.addEventListener(
    'error',
    event => {
      if (event?.message && roError.test(event.message)) {
        event.preventDefault()
      }
    },
    { capture: true }
  )
})
