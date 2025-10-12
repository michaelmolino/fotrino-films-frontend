import isoCountries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'

isoCountries.registerLocale(enLocale)

export function getFlagEmoji(code) {
  if (!code || code.length !== 2) return '🏳️'
  const codePoints = [...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function getCountry(code) {
  if (!code || code.toUpperCase() === 'XX') return { flag: '🏳️', name: 'Unknown' }
  const upper = code.toUpperCase()
  const name = isoCountries.getName(upper, 'en') || 'Unknown'
  const flag = getFlagEmoji(upper)
  return { flag, name }
}
