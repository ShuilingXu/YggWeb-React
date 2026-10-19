// 后端 JSON 契约（字段名与 YggServer-Go internal/*/*.go 的 json tag 一致）。
export type TextureType = 0 | 1 | 2
export type TextureState = 0 | 1
export type AccountState = 0 | 1 | 2
export type Permission = 0 | 1 | 2
export type ReportState = 0 | 1 | 2
export type ReportResolution = 1 | 2
export type AuditAction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export type AuditResult = -1 | 0 | 1
export type PublicFlag = 0 | 1
export type EmailMode = 0 | 1 | 2
export type PointKind = 0 | 1 | 2 | 3 | 4 | 5

export type Profile = {
  /** 32 位无横线 UUID */
  id: string
  name: string
}

export type Account = {
  id: string
  email: string
  state: AccountState
  permission: Permission
  verified: PublicFlag
  createdAt: string
}

export type Texture = {
  id: string
  name: string
  type: TextureType
  hash: string
  sizeBytes: number
  width: number
  height: number
  public: PublicFlag
  createdAt: string
  state: TextureState
  itemName?: string
}

export type Report = {
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

export type AuditEvent = {
  id: number
  actor: string
  target: string
  action: AuditAction
  requestId: string
  result: AuditResult
  targetState: number
  targetPermission: number
  createdAt: string
}

export type LoginResponse = {
  accessToken: string
  clientToken: string
  availableProfiles: Profile[]
  selectedProfile?: Profile
}

export type Property = {
  name: string
  value: string
  signature?: string
}

export type SessionProfile = Profile & { properties: Property[] }

export type Appearance = {
  skin: { url: string; model: 'default' | 'slim' } | null
  cape: { url: string } | null
}

export type ListMeta = {
  total: number
  limit: number
  next: number | null
}

export type ListResult<T> = {
  items: T[]
  meta: ListMeta
}

// 站点公开配置：GET /api/site，字段与 internal/site.Settings 一致。
export type SiteSettings = {
  name: string
  description: string
  announcement: string
  registration: PublicFlag
  emailMode: EmailMode
  emailDomains: string
  skinDomains: string
  maxPlayers: number
  singleSession: PublicFlag
  signEnabled: PublicFlag
  signHours: number
  signMin: number
  signMax: number
  initialPoints: number
  playerCost: number
  uploadCost: number
  privateUploadCost: number
  closetCost: number
  oauthEnabled: PublicFlag
  oidcEnabled: PublicFlag
  oidcIssuer: string
  oidcClientId: string
  oidcName: string
}

export type PointEntry = {
  id: number
  delta: number
  kind: PointKind
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

// internal/httpserver/plugins.go 与 plugin.Info 的公开字段。
export type PluginInfo = {
  id: string
  version: string
  apiVersion: number
  description: string
  enabled: PublicFlag
  actions: string[]
  before: boolean
  after: boolean
  endpoints: string[]
}
