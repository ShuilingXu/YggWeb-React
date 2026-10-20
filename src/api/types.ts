import type {
  AccountState,
  Permission,
  TextureType,
  TextureState,
  Visibility,
  ReportState,
} from './enums'
export interface Account {
  id: string
  email: string
  state: AccountState
  permission: Permission
  verified: 0 | 1
  createdAt: string
}
export interface Player {
  id: string
  name: string
}
export interface LoginResponse {
  accessToken: string
  clientToken: string
  availableProfiles: Player[]
  selectedProfile?: Player
}
export interface Texture {
  id: string
  name: string
  type: TextureType
  hash: string
  sizeBytes: number
  width: number
  height: number
  public: Visibility
  state: TextureState
  createdAt: string
  itemName?: string
}
export interface TextureQuery {
  q?: string
  type?: TextureType
  uploader?: string
  sort?: 'newest' | 'oldest' | 'name'
  offset?: number
  limit?: number
}
export interface Page<T> {
  items: T[]
  total: number
  limit: number
  next: string | null
}
export interface TextureInput {
  name: string
  type: TextureType
  public: Visibility
}
export interface TextureUpload extends TextureInput {
  file: File
}
export interface Report {
  id: string
  texture: string
  reporter: string
  reason: string
  state: ReportState
  createdAt: string
  handledAt: string | null
  handler: string
  note: string
}
export interface AuditEvent {
  id: number
  actor: string
  target: string
  action: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  requestId: string
  result: 0 | 1
  targetState: -1 | AccountState
  targetPermission: -1 | Permission
  createdAt: string
}

export interface SiteSettings {
  name: string
  description: string
  announcement: string
  registration: number
  emailMode: number
  emailDomains: string
  skinDomains: string
  maxPlayers: number
  singleSession: number
  signEnabled: number
  signHours: number
  signMin: number
  signMax: number
  initialPoints: number
  playerCost: number
  uploadCost: number
  privateUploadCost: number
  closetCost: number
  oauthEnabled: number
  oidcEnabled: number
  oidcIssuer: string
  oidcClientId: string
  oidcName: string
}
export interface Wallet {
  balance: number
  nextSignAt: string | null
  entries: { id: number; delta: number; kind: 0 | 1 | 2 | 3 | 4 | 5 | 6; createdAt: string }[]
}
export interface OAuthClient {
  id: string
  name: string
  redirectUri: string
}
export interface ExternalIdentity {
  id: string
  issuer: string
  createdAt: string
}
export interface PluginInfo {
  id: string
  version: string
  apiVersion: number
  description: string
  enabled: number
  actions: string[]
  before: boolean
  after: boolean
  endpoints: string[]
}
