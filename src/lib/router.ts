import { useSyncExternalStore } from 'react'
function subscribe(onChange: () => void) { window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange) }
export function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => location.hash.slice(1) || '/')
  const [path, query = ''] = hash.split('?')
  return { path, params: new URLSearchParams(query) }
}
export const navigate = (path: string) => { location.hash = path }
export function setQuery(path: string, values: Record<string, string>) { const params = new URLSearchParams(values)
  navigate(`${path}?${params}`) }
