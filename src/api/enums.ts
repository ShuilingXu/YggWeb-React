export const TextureType = { Steve: 0, Alex: 1, Cape: 2 } as const
export type TextureType = (typeof TextureType)[keyof typeof TextureType]
export const TextureState = { Active: 0, Hidden: 1 } as const
export type TextureState = 0 | 1
export const Visibility = { Private: 0, Public: 1 } as const
export type Visibility = 0 | 1
export const AccountState = { Active: 0, Banned: 1, Deleted: 2 } as const
export type AccountState = 0 | 1 | 2
export const Permission = { User: 0, Admin: 1, Owner: 2 } as const
export type Permission = 0 | 1 | 2
export const ReportState = { Pending: 0, Resolved: 1, Rejected: 2 } as const
export type ReportState = 0 | 1 | 2
export const ReportResolution = { Hide: 1, Reject: 2 } as const
export const accountStateKeys = {
  0: 'admin.normal',
  1: 'admin.banned',
  2: 'admin.deleted',
} as const
export const permissionKeys = {
  0: 'admin.user',
  1: 'admin.administrator',
  2: 'admin.owner',
} as const
export const reportStateKeys = {
  0: 'admin.pending',
  1: 'admin.resolved',
  2: 'admin.rejected',
} as const
export const auditActionKeys = {
  0: 'admin.userAction',
  1: 'admin.ownerAction',
  2: 'admin.textureAction',
  3: 'admin.reportAction',
  4: 'ops.siteAudit',
  5: 'ops.oauthAudit',
  6: 'ops.bindAudit',
  7: 'ops.unbindAudit',
} as const
export const auditResultKeys = { 0: 'admin.applied', 1: 'admin.dismissed' } as const
export const textureStateKeys = { 0: 'admin.normal', 1: 'admin.hidden' } as const

export const pointKindKeys = {
  0: 'ops.initial',
  1: 'ops.checkIn',
  2: 'ops.player',
  3: 'ops.upload',
  4: 'ops.closet',
  5: 'ops.privacy',
} as const
