import {
  listWithMeta,
  requestJson,
  requestOptionalJson,
  requestVoid,
} from './client'
import type {
  Account,
  Appearance,
  AuditEvent,
  ListResult,
  LoginResponse,
  Profile,
  Report,
  ReportResolution,
  SessionProfile,
  Texture,
  TextureState,
  TextureType,
} from './types'
import { PAGE_SIZE } from '../lib/paging'
import { toDistributedPath } from '../lib/images'

export const ADMIN_PAGE_SIZE = 50

export type TextureQuery = {
  offset?: number
  limit?: number
  q?: string
  type?: TextureType
  sort?: 'newest' | 'oldest' | 'name'
}

// ---------- 认证 ----------
export function login(username: string, password: string, signal?: AbortSignal): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/api/auth/login', {
    method: 'POST',
    json: { username, password },
    signal,
  })
}

export function register(
  email: string,
  password: string,
  playerName: string,
  signal?: AbortSignal,
): Promise<void> {
  return requestVoid('/api/auth/register', {
    method: 'POST',
    json: { email, password, playerName },
    signal,
  })
}

export function logout(): Promise<void> {
  return requestVoid('/api/auth/logout', { method: 'POST' })
}

export function requestPasswordReset(email: string): Promise<void> {
  return requestVoid('/api/auth/forgot-password', { method: 'POST', json: { email } })
}

// ---------- 账号 ----------
export function fetchAccount(signal?: AbortSignal): Promise<Account> {
  return requestJson<Account>('/api/account', { signal })
}

export function changePassword(password: string, newPassword: string): Promise<void> {
  return requestVoid('/api/account/password', {
    method: 'PUT',
    json: { password, newPassword },
  })
}

export function changeEmail(password: string, email: string): Promise<void> {
  return requestVoid('/api/account/email', { method: 'PUT', json: { password, email } })
}

export function requestEmailVerification(): Promise<void> {
  return requestVoid('/api/account/verification', { method: 'POST' })
}

export function deleteAccount(password: string): Promise<void> {
  return requestVoid('/api/account', { method: 'DELETE', json: { password } })
}

// ---------- 角色 ----------
export function fetchPlayers(signal?: AbortSignal): Promise<Profile[]> {
  return requestJson<Profile[]>('/api/players', { signal })
}

export function createPlayer(name: string): Promise<void> {
  return requestVoid('/api/players', { method: 'POST', json: { name } })
}

export function renamePlayer(uuid: string, name: string): Promise<void> {
  return requestVoid(`/api/players/${uuid}`, { method: 'PUT', json: { name } })
}

export function removePlayer(uuid: string): Promise<void> {
  return requestVoid(`/api/players/${uuid}`, { method: 'DELETE' })
}

/** 省略字段表示保留原值，空字符串表示清空。 */
export function bindPlayerTextures(
  uuid: string,
  textures: { skin?: string; cape?: string },
): Promise<void> {
  return requestVoid(`/api/players/${uuid}/textures`, { method: 'PUT', json: textures })
}

// ---------- 材质 ----------
export function fetchTextures(query: TextureQuery, signal?: AbortSignal): Promise<ListResult<Texture>> {
  return listWithMeta<Texture>('/api/textures', { ...query, limit: query.limit ?? PAGE_SIZE }, signal)
}

export function fetchMyTextures(query: TextureQuery, signal?: AbortSignal): Promise<ListResult<Texture>> {
  return listWithMeta<Texture>('/api/textures/mine', { ...query, limit: query.limit ?? PAGE_SIZE }, signal)
}

export function fetchTexture(uuid: string, signal?: AbortSignal): Promise<Texture> {
  return requestJson<Texture>(`/api/textures/${uuid}`, { signal })
}

export function uploadTexture(
  input: { file: File; name: string; type: TextureType; public: 0 | 1 },
  signal?: AbortSignal,
): Promise<Texture> {
  const form = new FormData()
  form.set('name', input.name)
  form.set('type', String(input.type))
  form.set('public', String(input.public))
  form.set('file', input.file, input.file.name)
  return requestJson<Texture>('/api/textures', { method: 'POST', form, signal })
}

export function updateTexture(
  uuid: string,
  input: { name: string; type: TextureType; public: 0 | 1 },
): Promise<void> {
  return requestVoid(`/api/textures/${uuid}`, { method: 'PUT', json: input })
}

export function deleteTexture(uuid: string): Promise<void> {
  return requestVoid(`/api/textures/${uuid}`, { method: 'DELETE' })
}

export function reportTexture(uuid: string, reason: string): Promise<void> {
  return requestVoid(`/api/textures/${uuid}/reports`, { method: 'POST', json: { reason } })
}

// ---------- 衣柜 ----------
export function fetchCloset(query: TextureQuery, signal?: AbortSignal): Promise<ListResult<Texture>> {
  return listWithMeta<Texture>('/api/closet', { ...query, limit: query.limit ?? PAGE_SIZE }, signal)
}

/** 收藏进衣柜或改备注名：后端同一个 PUT，name 为空表示清空备注。 */
export function saveToCloset(uuid: string, name: string): Promise<void> {
  return requestVoid(`/api/closet/${uuid}`, { method: 'PUT', json: { name } })
}

export function removeFromCloset(uuid: string): Promise<void> {
  return requestVoid(`/api/closet/${uuid}`, { method: 'DELETE' })
}

// ---------- 角色当前外观（sessionserver 反查） ----------
export function fetchSessionProfile(
  uuid: string,
  signal?: AbortSignal,
): Promise<SessionProfile | null> {
  return requestOptionalJson<SessionProfile>(`/sessionserver/session/minecraft/profile/${uuid}`, {
    signal,
  })
}

function decodeBase64Json(value: string): unknown {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

/** Yggdrasil profile 的 textures 属性是 base64 JSON，签名不影响展示。 */
export function parseAppearance(profile: SessionProfile | null): Appearance {
  if (!profile) return { skin: null, cape: null }
  const property = profile.properties.find((item) => item.name === 'textures')
  if (!property) return { skin: null, cape: null }
  try {
    const payload = decodeBase64Json(property.value) as {
      textures?: {
        SKIN?: { url?: string; metadata?: { model?: string } }
        CAPE?: { url?: string }
      }
    }
    const skinUrl = payload.textures?.SKIN?.url
    const capeUrl = payload.textures?.CAPE?.url
    return {
      skin: skinUrl
        ? {
            url: toDistributedPath(skinUrl),
            model: payload.textures?.SKIN?.metadata?.model === 'slim' ? 'slim' : 'default',
          }
        : null,
      cape: capeUrl ? { url: toDistributedPath(capeUrl) } : null,
    }
  } catch {
    return { skin: null, cape: null }
  }
}

export async function fetchAppearance(uuid: string, signal?: AbortSignal): Promise<Appearance> {
  return parseAppearance(await fetchSessionProfile(uuid, signal))
}

// ---------- 管理 ----------
export function fetchUsers(offset: number, signal?: AbortSignal): Promise<Account[]> {
  return requestJson<Account[]>(`/api/admin/users?offset=${offset}`, { signal })
}

export function updateUser(
  uuid: string,
  input: { state: 0 | 1; permission: 0 | 1 },
): Promise<void> {
  return requestVoid(`/api/admin/users/${uuid}`, { method: 'PUT', json: input })
}

export function fetchReports(offset: number, signal?: AbortSignal): Promise<Report[]> {
  return requestJson<Report[]>(`/api/admin/reports?offset=${offset}`, { signal })
}

export function resolveReport(
  uuid: string,
  input: { resolution: ReportResolution; state?: TextureState; note: string },
): Promise<void> {
  return requestVoid(`/api/admin/reports/${uuid}`, { method: 'PUT', json: input })
}

export function setTextureState(uuid: string, state: TextureState): Promise<void> {
  return requestVoid(`/api/admin/textures/${uuid}/state`, { method: 'PUT', json: { state } })
}

export function fetchAudit(offset: number, signal?: AbortSignal): Promise<AuditEvent[]> {
  return requestJson<AuditEvent[]>(`/api/admin/audit?offset=${offset}`, { signal })
}
