import { boot } from 'quasar/wrappers'

export default boot(() => {
  // Try to make touch/wheel listeners passive by default where safe to improve
  // scroll performance. This monkey-patch wraps addEventListener and, when the
  // event is touchstart/touchmove/wheel, sets { passive: true } unless the
  // caller explicitly supplies options.
  if (typeof window === 'undefined' || !window.addEventListener) return

  try {
    const orig = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      try {
        if (
          (type === 'touchstart' ||
            type === 'touchmove' ||
            type === 'wheel' ||
            type === 'mousewheel') &&
          typeof options !== 'object'
        ) {
          orig.call(this, type, listener, { passive: true })
          return
        }
      } catch (e) {
        console.error(e)
        // fallback to original
      }
      orig.call(this, type, listener, options)
    }
  } catch (err) {
    // if monkey-patching is forbidden by the environment, silently ignore
    // - this keeps the app functional without altering behavior
    console.warn('passive-events boot: could not patch addEventListener', err)
  }
})
