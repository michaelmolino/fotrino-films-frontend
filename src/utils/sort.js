function asValidDate(val) {
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

export function sortBy(items, field, direction = 'desc') {
  const dir = direction === 'desc' ? -1 : 1

  function compareNulls(aVal, bVal) {
    const aIsNull = aVal == null
    const bIsNull = bVal == null
    if (aIsNull && bIsNull) return 0
    if (aIsNull) return dir === -1 ? 1 : -1
    if (bIsNull) return dir === -1 ? -1 : 1
    return null // no nulls involved
  }

  function compareValues(aVal, bVal) {
    // Dates
    const aDate = asValidDate(aVal)
    const bDate = asValidDate(bVal)
    if (aDate && bDate) {
      return dir * (aDate - bDate)
    }
    // Primitives (number/string/boolean)
    if (aVal > bVal) return dir * 1
    if (aVal < bVal) return dir * -1
    return 0
  }

  const list = Array.isArray(items) ? [...items] : []
  return list.sort((a, b) => {
    const aValue = a?.[field]
    const bValue = b?.[field]

    const nullCmp = compareNulls(aValue, bValue)
    if (nullCmp !== null) return nullCmp

    return compareValues(aValue, bValue)
  })
}
