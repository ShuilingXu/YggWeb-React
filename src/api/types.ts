import type {
  AccountStateValue,
  PermissionValue,
  ReportStateValue,
  TextureStateValue,
  TextureTypeValue,
} from './enums'

export type Account = {
  id: string
  email: string
  state: AccountStateValue
  permission: PermissionValue
  verified: number
  createdAt: string
}

export type Player = {
  id: string
  name: string
}

export type Texture = {
  id: string
  name: string
  type: TextureTypeValue
  hash: string
  sizeBytes: number
  width: number
  height: number
  public: number
  createdAt: string
  state: TextureStateValue
  itemName?: string
}

export type AuthResponse = {
  accessToken: string
  clientToken: string
  availableProfiles: Player[]
  selectedProfile?: Player
}

export type Report = {
  id: string
  texture: string
  reporter: string
  reason: string
  state: ReportStateValue
  createdAt: string
  handledAt: string | null
  handler: string
  note: string
}

export type AuditEvent = {
  id: number
  actor: string
  target: string
  action: number
  requestId: string
  result: number
  targetState: number
  targetPermission: number
  createdAt: string
}

export type ListQuery = {
  q?: string
  type?: number
  uploader?: string
  sort?: 'newest' | 'oldest' | 'name'
  offset?: number
  limit?: number
}

export type Paged<T> = {
  items: T[]
  total: number
  nextOffset: number | null
}

export type ProfileAppearance = {
  skin?: string
  cape?: string
}
