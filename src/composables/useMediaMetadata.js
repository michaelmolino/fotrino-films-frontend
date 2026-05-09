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
        let date = null
        const meta = await exifr.parse(file, [
            'DateTimeOriginal',
            'CreateDate',
            'MediaCreateDate',
            'TrackCreateDate',
            'ModifyDate',
            'CreationTime',
            'date',
            'creation_time',
        ])
        if (meta) {
            date = meta.DateTimeOriginal || meta.CreateDate || meta.MediaCreateDate || meta.TrackCreateDate || meta.ModifyDate || meta.CreationTime || meta.date || meta.creation_time || null
        }
        if (date && typeof date === 'string') {
            const parsed = new Date(date)
            if (!Number.isNaN(parsed.getTime())) return parsed
        } else if (date instanceof Date && !Number.isNaN(date.getTime())) {
            return date
        }
        // If no date found in metadata, fall back to lastModified
        if (file.lastModified) {
            const fallback = new Date(file.lastModified)
            if (!Number.isNaN(fallback.getTime())) return fallback
        }
        return null
    } catch (e) {
        // Only log unexpected errors
        if (!String(e).includes('Unknown file format')) {
            console.debug('exifr error', e)
        }
        // Fallback to lastModified if available
        if (file.lastModified) {
            const fallback = new Date(file.lastModified)
            if (!Number.isNaN(fallback.getTime())) return fallback
        }
        return null
    }
}

// Future: add more metadata extraction helpers as needed
