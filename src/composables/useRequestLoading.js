import { Loading } from 'quasar'

export function useRequestLoading() {
  let count = 0

  const increment = () => {
    if (count === 0) Loading.show()
    count++
  }

  const decrement = () => {
    count = Math.max(0, count - 1)
    if (count === 0) Loading.hide()
  }

  return { increment, decrement }
}
