import { ApiError, getToken, messageForStatus, request, requestBlob } from './client'
import { parsePaging } from '../lib/paging'
import type {
  Account,
  AuditEvent,
  AuthResponse,
  ExternalIdentity,
  ListQuery,
  OAuthClient,
  OAuthConsentInput,
  OidcStart,
  Paged,
  Player,
  PluginInfo,
  ProfileAppearance,
  Report,
  SiteSettings,
  Texture,
  Wallet,
} from './types'

async function listWithMeta<T>(path: string, query: ListQuery, signal?: AbortSignal): Promise<Paged<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const url = new URL(path, window.location.origin)
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || value === null) continue
    url.searchParams.set(key, String(value))
  }
  const response = await fetch(url.pathname + url.search, { headers, signal })
  if (!response.ok) {
    throw new ApiError(response.status, messageForStatus(response.status))
  }
  const items = (await response.json()) as T[]
  const paging = parsePaging(response.headers, items.length)
  return { items, total: paging.total, nextOffset: paging.nextOffset }
}

export const authApi = {
  register: (email: string, password: string, playerName: string) =>
    request<void>('/api/auth/register', { method: 'POST', body: { email, password, playerName }, anonymous: true }),
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: { username, password }, anonymous: true }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  me: (signal?: AbortSignal) => request<Account>('/api/account', { signal }),
  forgotPassword: (email: string) =>
    request<void>('/api/auth/forgot-password', { method: 'POST', body: { email }, anonymous: true }),
  resetPassword: (token: string, newPassword: string) =>
    request<void>('/api/auth/reset-password', { method: 'POST', body: { token, newPassword }, anonymous: true }),
  resendVerification: () => request<void>('/api/account/verification', { method: 'POST' }),
}

export const accountApi = {
  changePassword: (password: string, newPassword: string) =>
    request<void>('/api/account/password', { method: 'PUT', body: { password, newPassword } }),
  changeEmail: (password: string, email: string) =>
    request<void>('/api/account/email', { method: 'PUT', body: { password, email } }),
  deleteAccount: (password: string) =>
    request<void>('/api/account', { method: 'DELETE', body: { password } }),
}

export const textureApi = {
  list: (query: ListQuery, signal?: AbortSignal) => listWithMeta<Texture>('/api/textures', query, signal),
  mine: (query: ListQuery, signal?: AbortSignal) => listWithMeta<Texture>('/api/textures/mine', query, signal),
  closet: (query: ListQuery, signal?: AbortSignal) => listWithMeta<Texture>('/api/closet', query, signal),
  get: (id: string, signal?: AbortSignal) => request<Texture>(`/api/textures/${id}`, { signal }),
  upload: (form: FormData) => request<Texture>('/api/textures', { method: 'POST', body: form }),
  update: (id: string, body: { name: string; type: number; public: number }) =>
    request<void>(`/api/textures/${id}`, { method: 'PUT', body }),
  remove: (id: string) => request<void>(`/api/textures/${id}`, { method: 'DELETE' }),
  addToCloset: (id: string, name: string) =>
    request<void>(`/api/closet/${id}`, { method: 'PUT', body: { name } }),
  removeFromCloset: (id: string) => request<void>(`/api/closet/${id}`, { method: 'DELETE' }),
  report: (id: string, reason: string) =>
    request<void>(`/api/textures/${id}/reports`, { method: 'POST', body: { reason } }),
  previewUrl: (id: string, size = 256) => `/api/textures/${id}/preview?size=${size}`,
  avatarUrl: (id: string, size = 128) => `/api/textures/${id}/avatar?size=${size}`,
  rawBlob: (id: string) => requestBlob(`/api/textures/${id}/file`),
}

export const playerApi = {
  list: (signal?: AbortSignal) => request<Player[]>('/api/players', { signal }),
  create: (name: string) => request<void>('/api/players', { method: 'POST', body: { name } }),
  rename: (id: string, name: string) => request<void>(`/api/players/${id}`, { method: 'PUT', body: { name } }),
  remove: (id: string) => request<void>(`/api/players/${id}`, { method: 'DELETE' }),
  bind: (id: string, body: { skin?: string; cape?: string }) =>
    request<void>(`/api/players/${id}/textures`, { method: 'PUT', body }),
  /** 用 Yggdrasil 公开 profile 反查当前穿戴（不含签名）。 */
  appearance: async (id: string): Promise<ProfileAppearance> => {
    const response = await fetch(`/sessionserver/session/minecraft/profile/${id}`)
    if (!response.ok || response.status === 204) return {}
    const payload = (await response.json()) as {
      properties?: { name: string; value: string }[]
    }
    const property = payload.properties?.find((item) => item.name === 'textures')
    if (!property) return {}
    try {
      const decoded = JSON.parse(atob(property.value)) as {
        textures?: { SKIN?: { url: string }; CAPE?: { url: string } }
      }
      return {
        skin: decoded.textures?.SKIN?.url,
        cape: decoded.textures?.CAPE?.url,
      }
    } catch {
      return {}
    }
  },
}

export const siteApi = {
  get: (signal?: AbortSignal) => request<SiteSettings>('/api/site', { signal, anonymous: true }),
  save: (settings: SiteSettings) =>
    request<void>('/api/admin/site', { method: 'PUT', body: settings }),
}

export const pointsApi = {
  wallet: (signal?: AbortSignal) => request<Wallet>('/api/account/points', { signal }),
  sign: () => request<Wallet>('/api/account/sign', { method: 'POST' }),
}

export const oauthApi = {
  client: (clientId: string, signal?: AbortSignal) =>
    request<OAuthClient>('/api/oauth/client', { query: { client_id: clientId }, signal }),
  authorize: (input: OAuthConsentInput) =>
    request<{ redirect: string }>('/api/oauth/authorize', { method: 'POST', body: input }),
  authorizedApps: (signal?: AbortSignal) => request<OAuthClient[]>('/api/account/oauth', { signal }),
  revoke: (clientId: string) =>
    request<void>(`/api/account/oauth/${clientId}`, { method: 'DELETE' }),
  adminClients: (signal?: AbortSignal) => request<OAuthClient[]>('/api/admin/oauth/clients', { signal }),
  createClient: (name: string, redirectUri: string) =>
    request<OAuthClient>('/api/admin/oauth/clients', { method: 'POST', body: { name, redirectUri } }),
  deleteClient: (clientId: string) =>
    request<void>(`/api/admin/oauth/clients/${clientId}`, { method: 'DELETE' }),
}

export const oidcApi = {
  start: (link: boolean) =>
    request<OidcStart>(link ? '/api/account/oidc/start' : '/api/auth/oidc/start', { method: 'POST' }),
  complete: (state: string, code: string) =>
    request<AuthResponse>('/api/auth/oidc/complete', {
      method: 'POST',
      body: { state, code },
      anonymous: true,
    }),
  identities: (signal?: AbortSignal) => request<ExternalIdentity[]>('/api/account/oidc', { signal }),
  unlink: (id: string, password: string) =>
    request<void>(`/api/account/oidc/${id}`, { method: 'DELETE', body: { password } }),
}

export const pluginApi = {
  list: (signal?: AbortSignal) => request<PluginInfo[]>('/api/admin/plugins', { signal }),
  query: (id: string, path: string, signal?: AbortSignal) =>
    request<unknown>(`/api/plugins/${id}${path}`, { signal }),
}

export const adminApi = {
  users: (offset: number, signal?: AbortSignal) =>
    request<Account[]>('/api/admin/users', { query: { offset }, signal }),
  updateUser: (id: string, body: { state: number; permission: number }) =>
    request<void>(`/api/admin/users/${id}`, { method: 'PUT', body }),
  reports: (offset: number, signal?: AbortSignal) =>
    request<Report[]>('/api/admin/reports', { query: { offset }, signal }),
  resolveReport: (id: string, body: { state?: number; resolution: number; note?: string }) =>
    request<void>(`/api/admin/reports/${id}`, { method: 'PUT', body }),
  setTextureState: (id: string, state: number, note = '') =>
    request<void>(`/api/admin/textures/${id}/state`, { method: 'PUT', body: { state, note } }),
  audit: (offset: number, signal?: AbortSignal) =>
    request<AuditEvent[]>('/api/admin/audit', { query: { offset }, signal }),
}
