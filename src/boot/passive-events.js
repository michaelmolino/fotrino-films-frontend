export default ({ app, router, store, Vue }) => {
  // Try to make touch/wheel listeners passive by default where safe to improve
  // scroll performance. This monkey-patch wraps addEventListener and, when the
  // event is touchstart/touchmove/wheel, sets { passive: true } unless the
  // caller explicitly supplies options.
  if (typeof window === 'undefined' || !window.addEventListener) return

  try {
    const orig = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      try {
        if ((type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel') && typeof options !== 'object') {
          orig.call(this, type, listener, { passive: true })
          return
        }
      } catch (e) {
        // fallback to original
      }
      orig.call(this, type, listener, options)
    }
  } catch (err) {
    // if monkey-patching is forbidden by the environment, silently ignore
    // - this keeps the app functional without altering behavior
    // eslint-disable-next-line no-console
    console.warn('passive-events boot: could not patch addEventListener', err)
  }
}
