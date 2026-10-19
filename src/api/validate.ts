import type {
  Account,
  Player,
  LoginResponse,
  Texture,
  Report,
  AuditEvent,
  SiteSettings,
  Wallet,
  OAuthClient,
  ExternalIdentity,
  PluginInfo,
} from './types'
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown) => typeof v === 'string'
const texts = (v: Record<string, unknown>, keys: string[]) => keys.every((k) => str(v[k]))
const num = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v)
const choice = (v: unknown, values: number[]) => num(v) && values.includes(v)
const date = (v: unknown) => str(v) && Number.isFinite(Date.parse(v as string))
export function isArrayOf<T>(check: (v: unknown) => v is T): (v: unknown) => v is T[] {
  return (v: unknown): v is T[] => Array.isArray(v) && v.every(check)
}
export function isPlayer(v: unknown): v is Player {
  return record(v) && texts(v, ['id', 'name'])
}
export function isAccount(v: unknown): v is Account {
  return (
    record(v) &&
    texts(v, ['id', 'email']) &&
    choice(v.state, [0, 1, 2]) &&
    choice(v.permission, [0, 1, 2]) &&
    choice(v.verified, [0, 1]) &&
    date(v.createdAt)
  )
}
export function isLogin(v: unknown): v is LoginResponse {
  return (
    record(v) &&
    typeof v.accessToken === 'string' &&
    v.accessToken.length > 0 &&
    str(v.clientToken) &&
    isArrayOf(isPlayer)(v.availableProfiles) &&
    (v.selectedProfile === undefined || isPlayer(v.selectedProfile))
  )
}
export function isTexture(v: unknown): v is Texture {
  return (
    record(v) &&
    texts(v, ['id', 'name', 'hash']) &&
    typeof v.hash === 'string' &&
    /^[0-9a-f]{64}$/.test(v.hash) &&
    choice(v.type, [0, 1, 2]) &&
    choice(v.public, [0, 1]) &&
    choice(v.state, [0, 1]) &&
    num(v.sizeBytes) &&
    v.sizeBytes >= 0 &&
    num(v.width) &&
    v.width > 0 &&
    num(v.height) &&
    v.height > 0 &&
    date(v.createdAt) &&
    (v.itemName === undefined || str(v.itemName))
  )
}
export function isReport(v: unknown): v is Report {
  return (
    record(v) &&
    texts(v, ['id', 'texture', 'reporter', 'reason', 'handler', 'note']) &&
    choice(v.state, [0, 1, 2]) &&
    date(v.createdAt) &&
    (v.handledAt === null || date(v.handledAt))
  )
}
export function isAudit(v: unknown): v is AuditEvent {
  return (
    record(v) &&
    num(v.id) &&
    texts(v, ['actor', 'target', 'requestId']) &&
    choice(v.action, [0, 1, 2, 3, 4, 5, 6, 7]) &&
    choice(v.result, [0, 1]) &&
    choice(v.targetState, [-1, 0, 1, 2]) &&
    choice(v.targetPermission, [-1, 0, 1, 2]) &&
    date(v.createdAt)
  )
}

export function isSiteSettings(v: unknown): v is SiteSettings {
  return (
    record(v) &&
    texts(v, [
      'name',
      'description',
      'announcement',
      'emailDomains',
      'skinDomains',
      'oidcIssuer',
      'oidcClientId',
      'oidcName',
    ]) &&
    ['registration', 'singleSession', 'signEnabled', 'oauthEnabled', 'oidcEnabled'].every((key) =>
      choice(v[key], [0, 1]),
    ) &&
    choice(v.emailMode, [0, 1, 2]) &&
    [
      'maxPlayers',
      'signHours',
      'signMin',
      'signMax',
      'initialPoints',
      'playerCost',
      'uploadCost',
      'privateUploadCost',
      'closetCost',
    ].every((key) => num(v[key]) && (v[key] as number) >= 0) &&
    (v.maxPlayers as number) >= 1 &&
    (v.signHours as number) >= 1 &&
    (v.signMax as number) >= (v.signMin as number)
  )
}
export function isWallet(v: unknown): v is Wallet {
  return (
    record(v) &&
    num(v.balance) &&
    v.balance >= 0 &&
    (v.nextSignAt === null || date(v.nextSignAt)) &&
    Array.isArray(v.entries) &&
    v.entries.every(
      (e) =>
        record(e) &&
        num(e.id) &&
        num(e.delta) &&
        choice(e.kind, [0, 1, 2, 3, 4, 5]) &&
        date(e.createdAt),
    )
  )
}
export function isOAuthClient(v: unknown): v is OAuthClient {
  return record(v) && texts(v, ['id', 'name', 'redirectUri'])
}
export function isExternalIdentity(v: unknown): v is ExternalIdentity {
  return record(v) && texts(v, ['id', 'issuer']) && date(v.createdAt)
}
export function isPluginInfo(v: unknown): v is PluginInfo {
  return (
    record(v) &&
    texts(v, ['id', 'version', 'description']) &&
    /^[a-z][a-z0-9-]{0,47}$/.test(v.id as string) &&
    num(v.apiVersion) &&
    choice(v.enabled, [0, 1]) &&
    typeof v.before === 'boolean' &&
    typeof v.after === 'boolean' &&
    Array.isArray(v.actions) &&
    v.actions.every(str) &&
    Array.isArray(v.endpoints) &&
    v.endpoints.every((p) => typeof p === 'string' && /^\/[a-z][a-z0-9-]{0,47}$/.test(p))
  )
}
export function isExternalStart(v: unknown): v is { url: string; state: string } {
  if (!record(v) || !texts(v, ['url', 'state'])) return false
  try {
    const u = new URL(v.url as string)
    return (
      !u.username &&
      !u.password &&
      (u.protocol === 'https:' ||
        (u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))) &&
      (v.state as string).length > 0
    )
  } catch {
    return false
  }
}
