import { computed } from 'vue'
import { sortBy } from '@utils/sort.js'

/**
 * Composable for sorting media items
 * @param {Ref<Array>} items - Array of media items (can include nested media in objects)
 * @param {string} field - Field path to sort by (supports nested: 'media.resourceDate')
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @param {Ref<boolean>} isLoading - Optional loading state to suppress results while loading
 * @returns {Ref<Array>} Sorted computed array
 */
export function useMediaSort(items, field = 'media.resourceDate', direction = 'desc', isLoading = null) {
  return computed(() => {
    if (isLoading?.value) return []
    return sortBy(items.value || [], field, direction)
  })
}
