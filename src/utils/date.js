import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'

dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isYesterday)

export function daysSince(start, withTime = true) {
  // This implicitly converts from server UTC time to local time
  const day = dayjs(new Date(start))
  if (!withTime) {
    if (day.isToday()) return 'today'
    if (day.isYesterday()) return 'yesterday'
  }
  return day.fromNow()
}
