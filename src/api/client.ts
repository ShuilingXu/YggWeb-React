import { apiMessages, apiRetryMessage } from '../i18n/api'
import { isAccount } from './validate'
export type ErrorKind = keyof typeof apiMessages
export class ApiError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    public readonly status = 0,
    public readonly retryAfter: number | null = null,
  ) {
    super(apiMessages[kind])
    this.name = 'ApiError'
  }
}
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return apiMessages.server
  if (error.kind === 'rateLimit' && error.retryAfter !== null && error.retryAfter > 0)
    return apiRetryMessage.replace('{seconds}', String(error.retryAfter))
  return error.message
}
let accessToken: string | null = null
const listeners = new Set<() => void>()
export function setAccessToken(value: string) {
  accessToken = value
}
export function clearAccessToken() {
  accessToken = null
}
export function subscribeAuthExpired(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
  authenticated?: boolean
}
function kind(status: number): ErrorKind {
  return status === 401
    ? 'unauthorized'
    : status === 403
      ? 'forbidden'
      : status === 404
        ? 'missing'
        : status === 409
          ? 'conflict'
          : status === 413
            ? 'quota'
            : status === 429
              ? 'rateLimit'
              : status >= 500
                ? 'server'
                : 'validation'
}
async function request<T>(
  path: string,
  decode: (response: Response) => Promise<T>,
  options: Options = {},
): Promise<T> {
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  if (options.signal?.aborted) controller.abort()
  else options.signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.timeoutMs ?? 20000)
  const headers = new Headers({ Accept: 'application/json' })
  const token = options.authenticated === false ? null : accessToken
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const multipart = options.body instanceof FormData
  if (options.body !== undefined && !multipart) headers.set('Content-Type', 'application/json')
  try {
    const response = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
      body:
        options.body === undefined
          ? undefined
          : multipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    })
    if (!response.ok) {
      if (
        response.status === 401 ||
        (response.status === 403 &&
          path === '/api/account' &&
          (options.method ?? 'GET') === 'GET' &&
          token)
      ) {
        if (accessToken === token) {
          clearAccessToken()
          listeners.forEach((l) => l())
        }
        throw new ApiError('unauthorized', response.status)
      }
      if (response.status === 403 && token && accessToken === token) {
        try {
          await requestJSON('/api/account', isAccount, { signal: controller.signal })
        } catch (e) {
          if (e instanceof ApiError && e.kind === 'unauthorized') throw e
          if (controller.signal.aborted) throw new ApiError(timedOut ? 'timeout' : 'aborted')
        }
      }
      let failure: ErrorKind = kind(response.status)
      try {
        const body: unknown = await response.json()
        if (typeof body === 'object' && body !== null && 'error' in body) {
          if (body.error === 'InsufficientPoints') failure = 'insufficientPoints'
          if (body.error === 'AlreadySigned') failure = 'alreadySigned'
          if (body.error === 'PluginDenied') failure = 'pluginDenied'
        }
      } catch {
        /* 错误正文不是 JSON 时沿用状态码文案。 */
      }
      const raw = response.headers.get('Retry-After')
      const retry =
        raw === null
          ? null
          : /^\d+$/.test(raw)
            ? Number(raw)
            : Math.max(0, Math.ceil((Date.parse(raw) - Date.now()) / 1000))
      throw new ApiError(
        failure,
        response.status,
        retry !== null && Number.isFinite(retry) ? retry : null,
      )
    }
    return await decode(response)
  } catch (e) {
    if (e instanceof ApiError) throw e
    if (controller.signal.aborted) throw new ApiError(timedOut ? 'timeout' : 'aborted')
    throw new ApiError('network')
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abort)
  }
}
export function requestJSON<T>(
  path: string,
  validate: (v: unknown) => v is T,
  options?: Options,
): Promise<T> {
  return request(
    path,
    async (response) => {
      let v: unknown
      try {
        v = await response.json()
      } catch {
        throw new ApiError('response')
      }
      if (!validate(v)) throw new ApiError('response')
      return v
    },
    options,
  )
}
export function requestEmpty(path: string, options?: Options): Promise<void> {
  return request(path, async () => undefined, options)
}
export function requestBlob(path: string, options?: Options): Promise<Blob> {
  return request(
    path,
    async (response) => {
      if (!response.headers.get('Content-Type')?.startsWith('image/png'))
        throw new ApiError('response')
      return response.blob()
    },
    options,
  )
}
export function requestPage<T>(
  path: string,
  validate: (v: unknown) => v is T[],
  options?: Options,
): Promise<import('./types').Page<T>> {
  return request(
    path,
    async (response) => {
      let items: unknown
      try {
        items = await response.json()
      } catch {
        throw new ApiError('response')
      }
      const total = Number(response.headers.get('X-Total-Count'))
      const limit = Number(response.headers.get('X-Limit'))
      if (
        !validate(items) ||
        !response.headers.has('X-Total-Count') ||
        !Number.isInteger(total) ||
        total < 0 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      )
        throw new ApiError('response')
      return {
        items,
        total,
        limit,
        next: response.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null,
      }
    },
    options,
  )
}
