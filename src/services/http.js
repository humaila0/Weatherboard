export class ApiError extends Error {
  constructor(message, { code = 'unknown', status = null, provider = null, cause = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.provider = provider
    this.cause = cause
  }
}

function createAbortError(reason) {
  if (reason instanceof Error) return reason
  const error = new Error('The request was aborted.')
  error.name = 'AbortError'
  return error
}

function statusToCode(status) {
  if (status === 401 || status === 403) return 'invalid_key'
  if (status === 404) return 'not_found'
  if (status === 429) return 'rate_limit'
  if (status >= 500) return 'server'
  return 'request'
}

export async function fetchJson(
  url,
  { signal, timeoutMs = 10_000, headers = {}, provider = null } = {},
) {
  if (signal?.aborted) throw createAbortError(signal.reason)

  const controller = new AbortController()
  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const forwardAbort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', ...headers },
    })

    if (!response.ok) {
      const code = statusToCode(response.status)
      throw new ApiError(`Request failed with status ${response.status}.`, {
        code,
        status: response.status,
        provider,
      })
    }

    try {
      return await response.json()
    } catch (error) {
      throw new ApiError('The service returned an unreadable response.', {
        code: 'missing_data',
        status: response.status,
        provider,
        cause: error,
      })
    }
  } catch (error) {
    if (signal?.aborted) throw createAbortError(signal.reason)
    if (timedOut) {
      throw new ApiError('The request timed out.', { code: 'timeout', provider })
    }
    if (error instanceof ApiError) throw error
    if (error?.name === 'AbortError') throw error
    throw new ApiError('The network request failed.', { code: 'network', provider, cause: error })
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
