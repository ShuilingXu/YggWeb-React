import { useCallback, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

export type Route = {
  path: string
  search: URLSearchParams
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '')
  const [pathPart = '/', searchPart = ''] = raw.split('?')
  const path = pathPart === '' ? '/' : pathPart
  return { path, search: new URLSearchParams(searchPart) }
}

export function navigate(to: string, options: { replace?: boolean } = {}): void {
  const target = `#${to.startsWith('/') ? to : `/${to}`}`
  if (options.replace) {
    window.history.replaceState(null, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  window.location.hash = target
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash())
  useEffect(() => {
    const handler = () => setRoute(parseHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return route
}

export function match(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index]
    const actual = pathParts[index]
    if (expected === undefined || actual === undefined) return null
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual)
      continue
    }
    if (expected !== actual) return null
  }
  return params
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
    },
    [onClick],
  )
  return (
    <a href={`#${to}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}

export function useQueryParam(route: Route, key: string): string {
  return route.search.get(key) ?? ''
}
