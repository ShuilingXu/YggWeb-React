export const TextureType = {
  Steve: 0,
  Alex: 1,
  Cape: 2,
} as const
export type TextureTypeValue = (typeof TextureType)[keyof typeof TextureType]

export const TextureState = { Active: 0, Hidden: 1 } as const
export type TextureStateValue = (typeof TextureState)[keyof typeof TextureState]

export const Visibility = { Private: 0, Public: 1 } as const

export const AccountState = { Active: 0, Banned: 1, Deleted: 2 } as const
export type AccountStateValue = (typeof AccountState)[keyof typeof AccountState]

export const Permission = { User: 0, Admin: 1, Owner: 2 } as const
export type PermissionValue = (typeof Permission)[keyof typeof Permission]

export const ReportState = { Pending: 0, Resolved: 1, Rejected: 2 } as const
export type ReportStateValue = (typeof ReportState)[keyof typeof ReportState]

export const AuditAction = {
  UserManage: 0,
  OwnerGrant: 1,
  TextureModerate: 2,
  ReportResolve: 3,
} as const

export const AuditResult = { Applied: 0, Dismissed: 1, Unchanged: -1 } as const

export function isSkinType(type: number): boolean {
  return type === TextureType.Steve || type === TextureType.Alex
}
