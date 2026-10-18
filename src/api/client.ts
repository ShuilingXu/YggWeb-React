import { t } from '../i18n/zh-CN'
import { paging } from '../lib/paging'
import type { Page } from './types'

let memoryToken = ''
try { memoryToken = sessionStorage.getItem('ygg.session.token') || '' } catch { /* 存储不可用时只使用内存会话。 */ }
export const getToken = () => memoryToken
export function setToken(value: string) {
  memoryToken = value
  try { value ? sessionStorage.setItem('ygg.session.token', value) : sessionStorage.removeItem('ygg.session.token') } catch { /* 隐私模式不阻止登录。 */ }
}
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
function statusMessage(response: Response) {
  const status = response.status
  if (status === 429) return t('error429', { seconds: Number(response.headers.get('Retry-After')) || 60 })
  const key = ({ 400: 'error400', 401: 'error401', 403: 'error403', 404: 'error404', 409: 'error409', 413: 'error413', 415: 'error415', 503: 'error503' } as const)[status as 400]
  return t(key || 'error500')
}
async function response(path: string, init: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let result: Response
  try { result = await fetch(path, { ...init, headers, credentials: 'omit' }) }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, t('networkError'))
  }
  if (!result.ok) {
    let expired = result.status === 401
    if (result.status === 403 && token) {
      if (path === '/api/account') expired = true
      else {
        try {
          const check = await fetch('/api/account', { headers: { Authorization: `Bearer ${token}` }, credentials: 'omit', signal: init.signal })
          expired = check.status === 401 || check.status === 403
        } catch { /* 网络异常不当作令牌失效。 */ }
      }
    }
    if (expired && token === getToken()) { setToken('')
      window.dispatchEvent(new Event('ygg:expired')) }
    let message = statusMessage(result)
    try { const body = await result.clone().json() as { error?: string }
      if (body.error === 'InsufficientPoints') message = t('insufficientPoints')
      if (body.error === 'AlreadySigned') message = t('alreadySigned')
    } catch { /* 非 JSON 错误仍按状态码显示。 */ }
    throw new ApiError(result.status, expired ? t('reauthenticate') : message)
  }
  return result
}
export async function request<T = void>(path: string, init: RequestInit = {}): Promise<T> {
  const result = await response(path, init)
  if (result.status === 204 || result.status === 201 || result.status === 202) {
    if (!result.headers.get('Content-Type')?.includes('json')) return undefined as T
  }
  try { return await result.json() as T } catch { throw new ApiError(result.status, t('invalidResponse')) }
}
export const send = <T = void>(path: string, method: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method, signal, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) })
export async function listWithMeta<T>(path: string, signal?: AbortSignal): Promise<Page<T>> {
  const result = await response(path, { signal })
  const items: unknown = await result.json()
  if (!Array.isArray(items)) throw new ApiError(200, t('invalidResponse'))
  return { items: items as T[], ...paging(result.headers, items.length, Number(new URL(path, location.origin).searchParams.get('limit')) || 50) }
}
export async function imageBlob(path: string, signal?: AbortSignal) { return (await response(path, { signal })).blob() }
