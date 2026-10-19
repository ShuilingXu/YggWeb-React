import { t } from '../i18n'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** 令牌只允许放 sessionStorage：刷新可恢复，关闭标签页即失效，避免长期驻留。 */
const TOKEN_KEY = 'ygg.session.token'

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

let token: string | null = readStoredToken()
let onUnauthorized: (() => void) | null = null
let verifySession: (() => Promise<boolean>) | null = null

export function getToken(): string | null {
  return token
}

export function setToken(value: string | null): void {
  token = value
  try {
    if (value) sessionStorage.setItem(TOKEN_KEY, value)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // 隐私模式或被禁用存储时退回纯内存态，不阻断登录。
  }
}

/** 由 AuthProvider 注册：带令牌的请求返回 401/403 时清理会话。 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

/** 后端对无效令牌和无权限都回 403，需要回调 /api/account 才能区分。 */
export function setSessionVerifier(verifier: (() => Promise<boolean>) | null): void {
  verifySession = verifier
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof DOMException && error.name === 'AbortError') return ''
  return t('common.errorGeneric')
}

function messageForCode(code: string): string | null {
  switch (code) {
    case 'InsufficientPoints':
      return t('common.errorInsufficientPoints')
    case 'AlreadySigned':
      return t('common.errorAlreadySigned')
    case 'PluginDenied':
      return t('common.errorPluginDenied')
    default:
      return null
  }
}

export function messageForStatus(status: number, code?: string, path?: string): string {
  const mapped = code ? messageForCode(code) : null
  if (mapped) return mapped
  switch (status) {
    case 0:
      return t('common.errorNetwork')
    case 400:
      return t('common.errorBadRequest')
    case 403:
      if (path === '/api/auth/login') return t('auth.invalidCredentials')
      if (path === '/api/auth/register') return t('auth.registrationClosed')
      if (path === '/api/auth/oidc/complete') return t('oidc.denied')
      if (path?.startsWith('/api/oauth/') || path === '/api/oauth/authorize') return t('oauth.disabled')
      if (path === '/api/account' || path?.startsWith('/api/account/oidc/') || path === '/api/account/password' || path === '/api/account/email') {
        return t('profile.wrongPassword')
      }
      return t('common.errorForbidden')
    case 404:
      return t('common.errorNotFound')
    case 409:
      return t('common.errorConflict')
    case 413:
      return t('common.errorQuota')
    case 415:
      return t('common.errorForbidden')
    case 429:
      return t('common.errorTooMany')
    case 503:
      return t('common.errorUnavailable')
    default:
      return status >= 500 ? t('common.errorServer') : t('common.errorGeneric')
  }
}

type Query = Record<string, string | number | undefined | null>

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Query
  body?: unknown
  signal?: AbortSignal
  anonymous?: boolean
}

function buildUrl(path: string, query?: Query): string {
  // 前端产物挂在 /web/ 下，接口必须用绝对路径，不能相对拼接。
  const url = new URL(path, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.pathname + url.search
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const active = options.anonymous ? null : token
  if (active) headers.Authorization = `Bearer ${active}`

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, t('common.errorNetwork'))
  }

  if (!response.ok) {
    let code: string | undefined
    try {
      const payload = (await response.json()) as { error?: string }
      code = payload.error
    } catch {
      // 非 JSON 错误体：状态码足够定位问题。
    }
    const sessionProbe = path === '/api/account' && (options.method ?? 'GET') === 'GET'
    if (active && (response.status === 401 || response.status === 403)) {
      if (sessionProbe) {
        onUnauthorized?.()
        throw new ApiError(response.status, t('auth.sessionExpired'), code)
      }
      if (verifySession) {
        const valid = response.status === 401 ? false : await verifySession().catch(() => false)
        if (!valid) {
          onUnauthorized?.()
          throw new ApiError(response.status, t('auth.sessionExpired'), code)
        }
      }
    }
    throw new ApiError(response.status, messageForStatus(response.status, code, path), code)
  }

  if (response.status === 204) return undefined as T
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json')) {
    return (await response.text()) as unknown as T
  }
  return (await response.json()) as T
}

export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const headers: Record<string, string> = {}
  const active = options.anonymous ? null : token
  if (active) headers.Authorization = `Bearer ${active}`
  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), { headers, signal: options.signal })
  } catch {
    throw new ApiError(0, t('common.errorNetwork'))
  }
  if (!response.ok) {
    if (active && (response.status === 401 || response.status === 403)) {
      const valid = response.status === 401 ? false : await verifySession?.().catch(() => false)
      if (!valid) onUnauthorized?.()
    }
    throw new ApiError(response.status, messageForStatus(response.status))
  }
  return response.blob()
}
