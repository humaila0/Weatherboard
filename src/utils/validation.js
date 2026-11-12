export const WEATHER_ERROR_TITLE = 'Weather unavailable'
export const WEATHER_ERROR_MESSAGE = 'Weather information could not be loaded. Please retry.'

export function validateCityQuery(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 'Please enter a city name.'
  if (trimmed.length < 2) return 'Enter at least 2 characters to search for a city.'
  if (trimmed.length > 80) return 'City names must be 80 characters or fewer.'
  return null
}

export function validateReminderTime(value) {
  if (!value) return 'Choose a time for your reminder.'
  const match = /^(\d{2}):(\d{2})$/.exec(String(value))
  if (!match) return 'Enter a valid time, for example 07:30.'
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return 'Enter a valid time between 00:00 and 23:59.'
  return null
}

export function getSearchErrorMessage(error) {
  switch (error?.code) {
    case 'network':
      return 'Unable to connect to the city service. Check your internet connection and try again.'
    case 'rate_limit':
      return 'The city service is receiving too many requests. Please wait a moment and try again.'
    case 'invalid_key':
      return 'The city search service rejected its API key. Check the GeoDB configuration and try again.'
    case 'timeout':
      return 'The city search took too long to respond. Please try again.'
    case 'not_found':
      return 'No matching city found. Try another spelling.'
    case 'server':
      return 'The city service is temporarily unavailable. Please try again in a moment.'
    case 'missing_data':
      return 'The city service returned an incomplete response. Please try again.'
    default:
      return 'City search could not be completed. Check your connection and try again.'
  }
}

export function getWeatherErrorDetail(error) {
  switch (error?.code) {
    case 'network':
      return 'Unable to connect to the weather service. Check your internet connection and try again.'
    case 'rate_limit':
      return 'The weather service is rate-limited right now. Please wait a minute and retry.'
    case 'invalid_key':
      return 'OpenWeatherMap rejected its API key, and the backup weather service could not complete the request.'
    case 'timeout':
      return 'The weather service did not respond in time. Please try again.'
    case 'missing_data':
      return 'The weather service returned an incomplete response. Please retry.'
    case 'server':
      return 'The weather service is temporarily unavailable. Please try again in a moment.'
    case 'offline':
      return 'Reconnect to load live weather, or choose a city you have viewed before.'
    default:
      return 'Check your internet connection and try again.'
  }
}
