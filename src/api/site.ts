import { requestJSON, requestEmpty } from './client'
import { isSiteSettings, isWallet, isOAuthClient, isPluginInfo, isArrayOf } from './validate'
import type { SiteSettings } from './types'

export const getSite = (signal?: AbortSignal) =>
  requestJSON('/api/site', isSiteSettings, { signal, authenticated: false })
export const saveSite = (body: SiteSettings, signal?: AbortSignal) =>
  requestEmpty('/api/admin/site', { method: 'PUT', body, signal })
export const getWallet = (signal?: AbortSignal) =>
  requestJSON('/api/account/points', isWallet, { signal })
export const sign = (signal?: AbortSignal) =>
  requestJSON('/api/account/sign', isWallet, { method: 'POST', signal })
export const listClients = (signal?: AbortSignal) =>
  requestJSON('/api/admin/oauth/clients', isArrayOf(isOAuthClient), { signal })
export const createClient = (name: string, redirectUri: string, signal?: AbortSignal) =>
  requestJSON('/api/admin/oauth/clients', isOAuthClient, {
    method: 'POST',
    body: { name, redirectUri },
    signal,
  })
export const deleteClient = (id: string, signal?: AbortSignal) =>
  requestEmpty('/api/admin/oauth/clients/' + encodeURIComponent(id), { method: 'DELETE', signal })
export const getClient = (id: string, signal?: AbortSignal) =>
  requestJSON('/api/oauth/client?client_id=' + encodeURIComponent(id), isOAuthClient, { signal })
export const consent = (body: Record<string, unknown>, signal?: AbortSignal) =>
  requestJSON(
    '/api/oauth/authorize',
    (v): v is { redirect: string } =>
      typeof v === 'object' && v !== null && 'redirect' in v && typeof v.redirect === 'string',
    { method: 'POST', body, signal },
  )
export const listPlugins = (signal?: AbortSignal) =>
  requestJSON('/api/admin/plugins', isArrayOf(isPluginInfo), { signal })
export const queryPlugin = (id: string, path: string, signal?: AbortSignal) => {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(id) || !/^\/[a-z][a-z0-9-]{0,47}$/.test(path))
    throw new Error('invalid plugin path')
  return requestJSON('/api/plugins/' + id + path, (v): v is unknown => v !== undefined, { signal })
}
