export type Account = { id: string
  email: string
  state: 0 | 1 | 2
  permission: 0 | 1 | 2
  verified: 0 | 1
  createdAt: string }
export type Player = { id: string
  name: string }
export type Texture = { id: string
  name: string
  type: 0 | 1 | 2
  hash: string
  sizeBytes: number
  width: number
  height: number
  public: 0 | 1
  state: 0 | 1
  createdAt: string
  itemName?: string }
export type Report = { id: string
  texture: string
  reporter: string
  reason: string
  state: 0 | 1 | 2
  createdAt: string
  handledAt: string | null
  handler: string
  note: string }
export type Audit = { id: number
  actor: string
  target: string
  action: 0 | 1 | 2 | 3
  result: 0 | 1
  targetState: number
  targetPermission: number
  requestId: string
  createdAt: string }
export type Page<T> = { items: T[]
  total: number | null
  limit: number
  next: boolean }
export type Profile = Player & { properties: { name: string
  value: string }[] }
