import { t } from '../i18n/zh-CN'
import { listMeta, PAGE_SIZE, queryString } from '../lib/paging'
import type { ListResult } from './types'

const TOKEN_KEY = 'ygg.session.token'
const STATUS_MESSAGES: Record<number, string> = {
  400: t('error.400'),
  401: t('error.401'),
  403: t('error.403'),
  404: t('error.404'),
  409: t('error.409'),
  413: t('error.413'),
  415: t('error.415'),
  429: t('error.429'),
  503: t('error.503'),
}

let memoryToken: string | null = null
let sessionLostHandler: (() => void) | null = null

/** 令牌只存 sessionStorage，隐私模式下降级为内存态（关标签页即失效）。 */
export function getToken(): string | null {
  if (memoryToken) return memoryToken
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  memoryToken = token
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // sessionStorage 不可用时保持内存态，不影响本次会话。
  }
}

export function setSessionLostHandler(handler: (() => void) | null): void {
  sessionLostHandler = handler
}

export class ApiError extends Error {
  readonly status: number
  readonly retryAfter: number
  /** 后端错误体的固定 error 标识，仅用于映射文案，不直接展示。 */
  readonly code: string | null

  constructor(status: number, message: string, retryAfter = 0, code: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfter = retryAfter
    this.code = code
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** 页面只展示这里的文案；后端 errorMessage 原样不进 DOM。 */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message
  if (isAbortError(error)) return ''
  return t('error.500')
}

type RequestOptions = {
  method?: string
  json?: unknown
  form?: FormData
  signal?: AbortSignal
}

function dropSession(): void {
  if (!getToken()) return
  setToken(null)
  sessionLostHandler?.()
}

// 403 同时用于"无权限"和"令牌失效"，所以要回查账号才能区分（AGENTS.md §3.2）。
async function accountStillValid(): Promise<boolean> {
  const token = getToken()
  if (!token) return false
  try {
    const response = await fetch('/api/account', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      credentials: 'omit',
    })
    return response.ok
  } catch {
    return false
  }
}

const ERROR_CODES: Record<string, string> = {
  InsufficientPoints: t('error.insufficientPoints'),
  AlreadySigned: t('error.alreadySigned'),
  PluginDenied: t('error.pluginDenied'),
}

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const body = (await response.clone().json()) as { error?: unknown }
    return typeof body.error === 'string' ? body.error : null
  } catch {
    return null
  }
}

async function fail(response: Response, path: string): Promise<never> {
  const status = response.status
  const retryAfter = Number(response.headers.get('Retry-After') ?? 0) || 0
  if (status === 401) {
    dropSession()
    throw new ApiError(status, t('error.sessionExpired'), retryAfter)
  }
  if (status === 403 && getToken() && !(await accountStillValid())) {
    dropSession()
    throw new ApiError(status, t('error.sessionExpired'), retryAfter)
  }
  const code = await readErrorCode(response)
  const fallback = status >= 500 ? t('error.500') : t('error.400')
  let message =
    status === 429 && retryAfter > 0
      ? t('error.rateLimited', { seconds: retryAfter })
      : (STATUS_MESSAGES[status] ?? fallback)
  if (code && ERROR_CODES[code]) {
    message = ERROR_CODES[code]
  } else if (status === 403) {
    // 403 在这些端点表示"凭证不正确"，与权限不足区分开。
    if (path === '/api/auth/login') message = t('auth.invalidCredentials')
    else if (path.startsWith('/api/account')) message = t('account.wrongPassword')
  }
  throw new ApiError(status, message, retryAfter, code)
}

async function raw(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (options.form) {
    body = options.form
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.json)
  }
  let response: Response
  try {
    response = await fetch(path, {
      method: options.method ?? (body === undefined ? 'GET' : 'POST'),
      headers,
      body,
      signal: options.signal,
      credentials: 'omit',
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError(0, t('error.network'))
  }
  if (!response.ok) await fail(response, path)
  return response
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await raw(path, options)
  return (await response.json()) as T
}

/** 用于 204 无内容或后端可能返回 204 的端点。 */
export async function requestOptionalJson<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  const response = await raw(path, options)
  if (response.status === 204) return null
  return (await response.json()) as T
}

export async function requestVoid(path: string, options: RequestOptions = {}): Promise<void> {
  await raw(path, options)
}

export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await raw(path, options)
  return await response.blob()
}

/** 列表端点的数组 + 响应头分页。 */
export async function listWithMeta<T>(
  path: string,
  params: Record<string, string | number | undefined | null>,
  signal?: AbortSignal,
): Promise<ListResult<T>> {
  const offset = Number(params.offset ?? 0) || 0
  const limit = Number(params.limit ?? PAGE_SIZE) || PAGE_SIZE
  const response = await raw(`${path}${queryString(params)}`, { signal })
  const items = (await response.json()) as T[]
  return { items, meta: listMeta(response.headers, items.length, offset, limit) }
}
