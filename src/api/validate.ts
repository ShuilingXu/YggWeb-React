import type { Account, Player, LoginResponse, Texture, Report, AuditEvent } from './types'
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
    choice(v.action, [0, 1, 2, 3]) &&
    choice(v.result, [0, 1]) &&
    choice(v.targetState, [-1, 0, 1, 2]) &&
    choice(v.targetPermission, [-1, 0, 1, 2]) &&
    date(v.createdAt)
  )
}
