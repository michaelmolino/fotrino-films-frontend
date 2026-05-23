// useMediaMetadata.js
// Composable for extracting media metadata (currently: capture date) using exifr
import * as exifr from 'exifr'

/**
 * Extracts the best available capture/creation date from a File (image or video).
 * Returns a Date object if found, else falls back to file.lastModified (if available), else null.
 * @param {File|Blob} file
 * @returns {Promise<Date|null>}
 */
export async function extractExifDate(file) {
  if (!file) return null
  try {
    const date = await getExifDate(file)
    if (date) return date
    return getFallbackDate(file)
  } catch (e) {
    // Only log unexpected errors
    if (!String(e).includes('Unknown file format')) {
      console.debug('exifr error', e)
    }
    return getFallbackDate(file)
  }
}

/**
 * Attempts to extract date from EXIF metadata
 * @param {File|Blob} file
 * @returns {Promise<Date|null>}
 */
async function getExifDate(file) {
  const meta = await exifr.parse(file, [
    'DateTimeOriginal',
    'CreateDate',
    'MediaCreateDate',
    'TrackCreateDate',
    'ModifyDate',
    'CreationTime',
    'date',
    'creation_time'
  ])
  if (!meta) return null

  const date =
    meta.DateTimeOriginal ||
    meta.CreateDate ||
    meta.MediaCreateDate ||
    meta.TrackCreateDate ||
    meta.ModifyDate ||
    meta.CreationTime ||
    meta.date ||
    meta.creation_time
  return validateDate(date)
}

/**
 * Validates and converts date to Date object
 * @param {string|Date|null} date
 * @returns {Date|null}
 */
function validateDate(date) {
  if (!date) return null
  if (typeof date === 'string') {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date
  }
  return null
}

/**
 * Gets fallback date from file.lastModified
 * @param {File|Blob} file
 * @returns {Date|null}
 */
function getFallbackDate(file) {
  if (!file.lastModified) return null
  const fallback = new Date(file.lastModified)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

// Future: add more metadata extraction helpers as needed
