// Universal sortBy utility for arrays of objects
export function sortBy(items, field, direction = 'desc') {
  return [...(items || [])].sort((a, b) => {
    const aValue = a[field]
    const bValue = b[field]

    // Handle null/undefined values
    if (!aValue && !bValue) return 0
    if (!aValue) return direction === 'desc' ? 1 : -1
    if (!bValue) return direction === 'desc' ? -1 : 1

    // Check if values are dates by trying to parse them
    const aDate = new Date(aValue)
    const bDate = new Date(bValue)
    const aIsValidDate = !Number.isNaN(aDate.getTime())
    const bIsValidDate = !Number.isNaN(bDate.getTime())

    // Sort dates
    if (aIsValidDate && bIsValidDate) {
      return direction === 'desc' ? bDate - aDate : aDate - bDate
    }

    // Sort strings/numbers
    if (direction === 'desc') {
      if (bValue > aValue) return 1
      if (bValue < aValue) return -1
      return 0
    } else {
      if (aValue > bValue) return 1
      if (aValue < bValue) return -1
      return 0
    }
  })
}
