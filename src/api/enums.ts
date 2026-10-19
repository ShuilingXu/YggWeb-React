import { t } from '../i18n/zh-CN'
import type {
  AccountState,
  AuditAction,
  AuditResult,
  EmailMode,
  Permission,
  PointKind,
  ReportResolution,
  ReportState,
  TextureState,
  TextureType,
} from './types'

// 枚举取值与后端字典一致（AGENTS.md §3.4），前端不新增取值。
export const TEXTURE_TYPE = { STEVE: 0, ALEX: 1, CAPE: 2 } as const
export const TEXTURE_STATE = { ACTIVE: 0, HIDDEN: 1 } as const
export const ACCOUNT_STATE = { ACTIVE: 0, BANNED: 1, DELETED: 2 } as const
export const PERMISSION = { USER: 0, ADMIN: 1, OWNER: 2 } as const
export const REPORT_STATE = { PENDING: 0, RESOLVED: 1, REJECTED: 2 } as const
export const REPORT_RESOLUTION = { HIDE: 1, REJECT: 2 } as const
export const EMAIL_MODE = { UNRESTRICTED: 0, ALLOW: 1, DENY: 2 } as const
export const POINT_KIND = {
  INITIAL: 0,
  SIGN: 1,
  PLAYER: 2,
  UPLOAD: 3,
  CLOSET: 4,
  PRIVACY: 5,
} as const

const TEXTURE_TYPES: Record<number, { labelKey: string; tone: string }> = {
  [TEXTURE_TYPE.STEVE]: { labelKey: 'enum.textureType.0', tone: 'steve' },
  [TEXTURE_TYPE.ALEX]: { labelKey: 'enum.textureType.1', tone: 'alex' },
  [TEXTURE_TYPE.CAPE]: { labelKey: 'enum.textureType.2', tone: 'cape' },
}

export function textureTypeLabel(type: TextureType | number): string {
  return t(TEXTURE_TYPES[type]?.labelKey ?? 'common.unknown')
}

export function textureTypeTone(type: TextureType | number): string {
  return TEXTURE_TYPES[type]?.tone ?? 'muted'
}

export function textureStateLabel(state: TextureState | number): string {
  return t(state === TEXTURE_STATE.HIDDEN ? 'enum.textureState.1' : 'enum.textureState.0')
}

export function textureStateTone(state: TextureState | number): string {
  return state === TEXTURE_STATE.HIDDEN ? 'danger' : 'ok'
}

export function accountStateLabel(state: AccountState | number): string {
  return t(`enum.accountState.${state}` as 'enum.accountState.0')
}

export function accountStateTone(state: AccountState | number): string {
  if (state === ACCOUNT_STATE.BANNED) return 'danger'
  if (state === ACCOUNT_STATE.DELETED) return 'muted'
  return 'ok'
}

export function permissionLabel(permission: Permission | number): string {
  return t(`enum.permission.${permission}` as 'enum.permission.0')
}

export function permissionTone(permission: Permission | number): string {
  if (permission === PERMISSION.OWNER) return 'gold'
  if (permission === PERMISSION.ADMIN) return 'lapis'
  return 'muted'
}

export function reportStateLabel(state: ReportState | number): string {
  return t(`enum.reportState.${state}` as 'enum.reportState.0')
}

export function reportStateTone(state: ReportState | number): string {
  if (state === REPORT_STATE.RESOLVED) return 'ok'
  if (state === REPORT_STATE.REJECTED) return 'muted'
  return 'warn'
}

export function resolutionLabel(resolution: ReportResolution | number): string {
  return t(resolution === REPORT_RESOLUTION.REJECT ? 'enum.reportResolution.2' : 'enum.reportResolution.1')
}

export function auditActionLabel(action: AuditAction | number): string {
  return t(`enum.auditAction.${action}` as 'enum.auditAction.0')
}

export function auditResultLabel(result: AuditResult | number): string {
  return t(`enum.auditResult.${result}` as 'enum.auditResult.0')
}

export function auditResultTone(result: AuditResult | number): string {
  if (result === 1) return 'muted'
  if (result === -1) return 'muted'
  return 'ok'
}

const POINT_KINDS: Record<number, { labelKey: string; tone: string }> = {
  [POINT_KIND.INITIAL]: { labelKey: 'enum.pointKind.0', tone: 'gold' },
  [POINT_KIND.SIGN]: { labelKey: 'enum.pointKind.1', tone: 'ok' },
  [POINT_KIND.PLAYER]: { labelKey: 'enum.pointKind.2', tone: 'lapis' },
  [POINT_KIND.UPLOAD]: { labelKey: 'enum.pointKind.3', tone: 'lapis' },
  [POINT_KIND.CLOSET]: { labelKey: 'enum.pointKind.4', tone: 'lapis' },
  [POINT_KIND.PRIVACY]: { labelKey: 'enum.pointKind.5', tone: 'warn' },
}

export function pointKindLabel(kind: PointKind | number): string {
  return t(POINT_KINDS[kind]?.labelKey ?? 'common.unknown')
}

export function pointKindTone(kind: PointKind | number): string {
  return POINT_KINDS[kind]?.tone ?? 'muted'
}

export function emailModeLabel(mode: EmailMode | number): string {
  return t((['enum.emailMode.0', 'enum.emailMode.1', 'enum.emailMode.2'] as const)[mode] ?? 'common.unknown')
}

const PLUGIN_ACTIONS: Record<string, string> = {
  'account.create': 'enum.pluginAction.account.create',
  'session.issue': 'enum.pluginAction.session.issue',
  'player.save': 'enum.pluginAction.player.save',
  'player.delete': 'enum.pluginAction.player.delete',
  'texture.upload': 'enum.pluginAction.texture.upload',
  'account.check_in': 'enum.pluginAction.account.check_in',
}

export function pluginActionLabel(action: string): string {
  const key = PLUGIN_ACTIONS[action]
  return key ? t(key) : action
}
