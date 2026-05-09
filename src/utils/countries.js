import isoCountries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'

isoCountries.registerLocale(enLocale)

// Get the flag emoji for a 2-letter country code
export function getFlagEmoji(code) {
  if (code?.length !== 2) return '🏳️'
  const codePoints = [...code.toUpperCase()].map(c => 127397 + c.codePointAt(0))
  return String.fromCodePoint(...codePoints)
}

// Get country name and flag for a code
export function getCountry(code) {
  if (!code || code.toUpperCase() === 'XX') return { flag: '🏳️', name: 'Unknown' }
  const name = isoCountries.getName(code.toUpperCase(), 'en') || 'Unknown'
  const flag = getFlagEmoji(code.toUpperCase())
  return { flag, name }
}
