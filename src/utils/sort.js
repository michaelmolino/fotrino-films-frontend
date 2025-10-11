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
    const aIsValidDate = !isNaN(aDate.getTime())
    const bIsValidDate = !isNaN(bDate.getTime())

    // Sort dates
    if (aIsValidDate && bIsValidDate) {
      return direction === 'desc' ? bDate - aDate : aDate - bDate
    }

    // Sort strings/numbers
    if (direction === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    }
  })
}
