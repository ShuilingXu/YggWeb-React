import { t } from '../i18n/zh-CN.ts'
export const TextureType = { Steve: 0, Alex: 1, Cape: 2 } as const
export const typeLabel = (type: number) => t(type === 2 ? 'cape' : type === 1 ? 'alex' : 'steve')
export const permissionLabel = (value: number) => t(value === 2 ? 'owner' : value === 1 ? 'admin' : 'normalUser')
export const accountStateLabel = (value: number) => t(value === 2 ? 'deleted' : value === 1 ? 'banned' : 'active')
export const reportStateLabel = (value: number) => t(value === 2 ? 'rejected' : value === 1 ? 'resolved' : 'pending')
export const actionLabel = (value: number) => t((['userManage', 'ownerGrant', 'textureModerate', 'reportResolve', 'siteSettings', 'oauthClients', 'externalBindAudit', 'externalUnbindAudit'] as const)[value] ?? 'action')

export const pointKindLabel = (kind: number) => t((['pointInitial', 'pointSign', 'pointPlayer', 'pointUpload', 'pointCloset', 'pointPrivacy'] as const)[kind] ?? 'points')
