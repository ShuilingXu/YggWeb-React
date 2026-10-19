const PLAYER_NAME = /^[A-Za-z0-9_]{3,16}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidPlayerName(name: string): boolean {
  return PLAYER_NAME.test(name)
}

export function isValidEmail(email: string): boolean {
  return email.length <= 255 && EMAIL.test(email)
}

/** 后端 ValidPassword 按字节计：8–72 字节（bcrypt 上限）。 */
export function passwordByteLength(password: string): number {
  return new TextEncoder().encode(password).length
}

export function isValidPassword(password: string): boolean {
  const length = passwordByteLength(password)
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

/** 与后端 site.ValidIssuer 对齐：HTTPS，或 loopback HTTP；拒绝凭据与 query/fragment。 */
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

/** 与后端 validRedirect 对齐：HTTPS，或 loopback 的 HTTP；拒绝凭据/fragment。 */
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

export type TextureKind = 0 | 1 | 2

export type DimensionProblem = 'dimensions' | 'alex' | 'cape' | null

/**
 * 与后端 ValidDimensions 对齐的客户端预检：
 * steve 允许 1:1 与 2:1，alex 只允许正方形，披风允许 2:1 或 22:17 的透明补边比例。
 */
export function textureDimensionProblem(kind: number, width: number, height: number): DimensionProblem {
  if (width <= 0 || height <= 0 || width > 8192 || height > 8192) return 'dimensions'
  if (kind === 2) {
    const padded = width % 22 === 0 && height % 17 === 0 && width / 22 === height / 17
    if (padded) return null
    return width === 2 * height ? null : 'cape'
  }
  if (width < 64 || height < 32 || width % 64 !== 0 || height % 32 !== 0) return 'dimensions'
  if (kind === 1) return width === height ? null : 'alex'
  return width === height || width === 2 * height ? null : 'dimensions'
}

export async function readPngSize(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  try {
    return { width: bitmap.width, height: bitmap.height }
  } finally {
    bitmap.close()
  }
}

/**
 * 64×64 皮肤手臂区在 slim 模型下有 1px 透明间隔，
 * 取四条竖向间隔取样判断，比逐像素比对整张图更稳。
 */
export async function detectSlimModel(file: File): Promise<boolean> {
  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = bitmap
    if (width !== height || width % 64 !== 0) return false
    const scale = width / 64
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return false
    context.drawImage(bitmap, 0, 0)
    const { data } = context.getImageData(0, 0, width, height)
    let transparent = 0
    let total = 0
    for (const column of [43, 47, 51, 55]) {
      for (let row = 20; row < 32; row += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          for (let dy = 0; dy < scale; dy += 1) {
            const x = column * scale + dx
            const y = row * scale + dy
            const alpha = data[(y * width + x) * 4 + 3] ?? 255
            total += 1
            if (alpha === 0) transparent += 1
          }
        }
      }
    }
    return total > 0 && transparent / total > 0.5
  } finally {
    bitmap.close()
  }
}

export async function isPngFile(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  return signature.every((byte, index) => header[index] === byte)
}
