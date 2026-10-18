import { t } from '../i18n/zh-CN'
import type {
  AccountState,
  AuditAction,
  AuditResult,
  Permission,
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
