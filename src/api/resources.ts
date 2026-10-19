import { listWithMeta, request, send } from './client'
import type { Account, Audit, PluginInfo, ExternalIdentity, SiteSettings, Wallet, OAuthClient, Player, Profile, Report, Texture } from './types'

export const api = {
  plugins: (signal?: AbortSignal) => request<PluginInfo[]>('/api/admin/plugins', { signal }),
  pluginQuery: (id: string, path: string, signal?: AbortSignal) => request<unknown>(`/api/plugins/${encodeURIComponent(id)}${path}`, { signal }),
  startExternal: (link: boolean, signal?: AbortSignal) => send<{ url: string
  state: string }>(link ? '/api/account/oidc/start' : '/api/auth/oidc/start', 'POST', undefined, signal),
  completeExternal: (state: string, code: string, signal?: AbortSignal) => send<{ accessToken: string }>('/api/auth/oidc/complete', 'POST', { state, code }, signal),
  externalIdentities: (signal?: AbortSignal) => request<ExternalIdentity[]>('/api/account/oidc', { signal }),
  removeExternal: (id: string, password: string, signal?: AbortSignal) => send(`/api/account/oidc/${id}`, 'DELETE', { password }, signal),
  grants: (signal?: AbortSignal) => request<OAuthClient[]>('/api/account/oauth', { signal }),
  revokeGrant: (id: string, signal?: AbortSignal) => send(`/api/account/oauth/${id}`, 'DELETE', undefined, signal),
  site: (signal?: AbortSignal) => request<SiteSettings>('/api/site', { signal }),
  saveSite: (body: SiteSettings, signal?: AbortSignal) => send('/api/admin/site', 'PUT', body, signal),
  wallet: (signal?: AbortSignal) => request<Wallet>('/api/account/points', { signal }),
  sign: (signal?: AbortSignal) => send<Wallet>('/api/account/sign', 'POST', undefined, signal),
  clients: (signal?: AbortSignal) => request<OAuthClient[]>('/api/admin/oauth/clients', { signal }),
  createClient: (name: string, redirectUri: string, signal?: AbortSignal) => send<OAuthClient>('/api/admin/oauth/clients', 'POST', { name, redirectUri }, signal),
  deleteClient: (id: string, signal?: AbortSignal) => send(`/api/admin/oauth/clients/${id}`, 'DELETE', undefined, signal),
  oauthClient: (id: string, signal?: AbortSignal) => request<OAuthClient>(`/api/oauth/client?client_id=${encodeURIComponent(id)}`, { signal }),
  consent: (body: Record<string, unknown>, signal?: AbortSignal) => send<{ redirect: string }>('/api/oauth/authorize', 'POST', body, signal),
  account: (signal?: AbortSignal) => request<Account>('/api/account', { signal }),
  players: (signal?: AbortSignal) => request<Player[]>('/api/players', { signal }),
  texture: (id: string, signal?: AbortSignal) => request<Texture>(`/api/textures/${encodeURIComponent(id)}`, { signal }),
  textures: (mode: string, query: string, signal?: AbortSignal) => listWithMeta<Texture>(`${mode === 'closet' ? '/api/closet' : mode === 'uploads' ? '/api/textures/mine' : '/api/textures'}?${query}`, signal),
  profile: (id: string, signal?: AbortSignal) => request<Profile>(`/sessionserver/session/minecraft/profile/${id}`, { signal }),
  login: (username: string, password: string, signal?: AbortSignal) => send<{ accessToken: string }>('/api/auth/login', 'POST', { username, password }, signal),
  register: (email: string, password: string, playerName: string, signal?: AbortSignal) => send('/api/auth/register', 'POST', { email, password, playerName }, signal),
  logout: (signal?: AbortSignal) => send('/api/auth/logout', 'POST', undefined, signal),
  savePlayer: (id: string | null, name: string, signal?: AbortSignal) => send(`/api/players${id ? '/' + id : ''}`, id ? 'PUT' : 'POST', { name }, signal),
  deletePlayer: (id: string, signal?: AbortSignal) => send(`/api/players/${id}`, 'DELETE', undefined, signal),
  wear: (id: string, textures: { skin?: string
    cape?: string }, signal?: AbortSignal) => send(`/api/players/${id}/textures`, 'PUT', textures, signal),
  closet: (id: string, name: string, signal?: AbortSignal) => send(`/api/closet/${id}`, 'PUT', { name }, signal),
  removeCloset: (id: string, signal?: AbortSignal) => send(`/api/closet/${id}`, 'DELETE', undefined, signal),
  upload: (data: FormData, signal?: AbortSignal) => request<Texture>('/api/textures', { method: 'POST', body: data, signal }),
  editTexture: (id: string, body: Pick<Texture, 'name' | 'type' | 'public'>, signal?: AbortSignal) => send(`/api/textures/${id}`, 'PUT', body, signal),
  deleteTexture: (id: string, signal?: AbortSignal) => send(`/api/textures/${id}`, 'DELETE', undefined, signal),
  users: (offset: number, signal?: AbortSignal) => listWithMeta<Account>(`/api/admin/users?offset=${offset}`, signal),
  reports: (offset: number, signal?: AbortSignal) => listWithMeta<Report>(`/api/admin/reports?offset=${offset}`, signal),
  audit: (offset: number, signal?: AbortSignal) => listWithMeta<Audit>(`/api/admin/audit?offset=${offset}`, signal),
  manageUser: (id: string, state: number, permission: number, signal?: AbortSignal) => send(`/api/admin/users/${id}`, 'PUT', { state, permission }, signal),
  moderate: (id: string, state: number, signal?: AbortSignal) => send(`/api/admin/textures/${id}/state`, 'PUT', { state }, signal),
  resolve: (id: string, resolution: number, note: string, signal?: AbortSignal) => send(`/api/admin/reports/${id}`, 'PUT', { resolution, state: 1, note }, signal),
  report: (id: string, reason: string, signal?: AbortSignal) => send(`/api/textures/${id}/reports`, 'POST', { reason }, signal),
}

export async function findListedTexture(mode: 'uploads' | 'closet', id: string, signal: AbortSignal, name = '') {
  let offset = 0
  while (!signal.aborted) {
    const page = await api.textures(mode, `limit=100&offset=${offset}&q=${encodeURIComponent(name)}`, signal)
    const found = page.items.find(item => item.id === id)
    if (found) return found
    if (!page.next) return null
    offset += page.limit
  }
  return null
}
