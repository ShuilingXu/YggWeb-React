export type DimensionProblem =
  | 'tooWide'
  | 'badCape'
  | 'dimsNotMultiple'
  | 'badAlex'
  | 'badSteve'

export const MAX_TEXTURE_SIDE = 8192

/**
 * 与后端 skin.ValidDimensions 对齐的客户端预检：
 * steve 允许正方形或 2:1，alex 只允许正方形，披风允许 2:1 或 22×17 的整数倍。
 */
export function checkDimensions(width: number, height: number, type: number): DimensionProblem | null {
  if (width > MAX_TEXTURE_SIDE || height > MAX_TEXTURE_SIDE) return 'tooWide'
  if (type === 2) {
    const okRatio = width === height * 2
    const okCapeGrid = width % 22 === 0 && height % 17 === 0 && width / 22 === height / 17
    return okRatio || okCapeGrid ? null : 'badCape'
  }
  if (width % 64 !== 0 || height % 32 !== 0) return 'dimsNotMultiple'
  if (type === 1) return width === height ? null : 'badAlex'
  return width === height || width === height * 2 ? null : 'badSteve'
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

export function isPngSignature(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
}

const PLAYER_NAME = /^[A-Za-z0-9_]{3,16}$/

export function isValidPlayerName(value: string): boolean {
  return PLAYER_NAME.test(value)
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** 后端按字节计 8–72 字节（bcrypt 上限）。 */
export function passwordByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export function isValidPassword(value: string): boolean {
  const length = passwordByteLength(value)
  return length >= 8 && length <= 72
}

/** 与后端 site.Settings.AllowsEmail 一致：精确域名、大小写不敏感、不含子域名。 */
export function emailDomainAllowed(email: string, mode: number, domains: string): boolean {
  if (mode === 0) return true
  const domain = email.split('@')[1]?.trim().toLowerCase()
  if (!domain) return false
  const listed = domains
    .split(/\s+/)
    .filter(Boolean)
    .some((entry) => entry.toLowerCase() === domain)
  return mode === 1 ? listed : !listed
}

/** 与后端 validRedirect 对齐：HTTPS，或 loopback HTTP；拒绝凭据与 fragment。 */
export function isValidRedirectUri(value: string): boolean {
  if (!value || value.length > 2048) return false
  try {
    const url = new URL(value)
    if (url.username || url.password || url.hash) return false
    if (url.protocol === 'https:') return true
    if (url.protocol !== 'http:') return false
    const host = url.hostname.replace(/^\[|\]$/g, '')
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  } catch {
    return false
  }
}

/** 与后端 site.ValidIssuer 对齐：HTTPS，或 loopback HTTP；拒绝 query/fragment。 */
export function isValidOidcIssuer(value: string): boolean {
  if (!value || value.length > 255) return false
  try {
    const url = new URL(value)
    if (url.username || url.password || url.search || url.hash || !url.hostname) return false
    if (url.protocol === 'https:') return true
    if (url.protocol !== 'http:') return false
    const host = url.hostname.replace(/^\[|\]$/g, '')
    return host === 'localhost' || host === '::1' || host.startsWith('127.')
  } catch {
    return false
  }
}
