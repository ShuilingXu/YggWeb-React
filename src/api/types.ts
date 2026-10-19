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

export type SiteSettings = {
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

export type PointEntry = {
  id: number
  delta: number
  kind: number
  createdAt: string
}

export type Wallet = {
  balance: number
  nextSignAt: string | null
  entries: PointEntry[]
}

export type OAuthClient = {
  id: string
  name: string
  redirectUri: string
}

export type OAuthConsentInput = {
  client_id: string
  redirect_uri: string
  response_type: string
  scope: string
  state: string
  code_challenge: string
  code_challenge_method: string
  approve: boolean
}

export type ExternalIdentity = {
  id: string
  issuer: string
  createdAt: string
}

export type OidcStart = {
  url: string
  state: string
}

export type PluginInfo = {
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
