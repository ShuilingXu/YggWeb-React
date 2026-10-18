import { useMemo, useSyncExternalStore } from 'react'
import { queryString } from './paging'

export type AdminTab = 'users' | 'reports' | 'audit'

type PlainRouteName =
  | 'home'
  | 'library'
  | 'upload'
  | 'closet'
  | 'players'
  | 'account'
  | 'login'
  | 'register'
  | 'forgot'
  | 'notfound'

export type Route =
  | { name: 'texture'; uuid: string; query: URLSearchParams }
  | { name: 'admin'; tab: AdminTab; query: URLSearchParams }
  | { name: PlainRouteName; query: URLSearchParams }

const ADMIN_TABS: AdminTab[] = ['users', 'reports', 'audit']

/** hash 路由：后端 `/web/` 是纯 FileServer，没有 SPA 回落。 */
export function parseRoute(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const split = raw.indexOf('?')
  const path = (split === -1 ? raw : raw.slice(0, split)).replace(/^\/+/, '').replace(/\/+$/, '')
  const query = new URLSearchParams(split === -1 ? '' : raw.slice(split + 1))
  const segments = path === '' ? [] : path.split('/')

  const first = segments[0]
  if (!first) return { name: 'home', query }
  if (first === 'skinlib' && segments.length === 1) return { name: 'library', query }
  if (first === 'texture' && segments.length === 2 && segments[1]) {
    return { name: 'texture', uuid: segments[1], query }
  }
  if (first === 'upload' && segments.length === 1) return { name: 'upload', query }
  if (first === 'closet' && segments.length === 1) return { name: 'closet', query }
  if (first === 'players' && segments.length === 1) return { name: 'players', query }
  if (first === 'account' && segments.length === 1) return { name: 'account', query }
  if (first === 'admin' && segments.length <= 2) {
    const tab = segments[1]
    return {
      name: 'admin',
      tab: ADMIN_TABS.includes(tab as AdminTab) ? (tab as AdminTab) : 'users',
      query,
    }
  }
  if (first === 'auth' && segments.length === 2) {
    if (segments[1] === 'login') return { name: 'login', query }
    if (segments[1] === 'register') return { name: 'register', query }
    if (segments[1] === 'forgot') return { name: 'forgot', query }
  }
  return { name: 'notfound', query }
}

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') window.addEventListener('hashchange', emit)

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const target = path.startsWith('/') ? path : `/${path}`
  const next = `#${target}`
  if (window.location.hash === next) return
  if (options.replace) {
    window.history.replaceState(null, '', next)
    emit()
    return
  }
  window.location.hash = next
}

/** 生成可放在 href 里的路径，例如 `/skinlib?type=1`。 */
export function pathWithQuery(path: string, params: Record<string, string | number | undefined | null>): string {
  return `${path}${queryString(params)}`
}

export function href(path: string): string {
  return `#${path.startsWith('/') ? path : `/${path}`}`
}

function currentHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, currentHash, () => '')
  return useMemo(() => parseRoute(hash), [hash])
}
