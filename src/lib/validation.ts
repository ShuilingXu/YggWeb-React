import type { TextureType } from '../api/enums'
export function validPlayerName(value: string) {
  return /^[A-Za-z0-9_]{3,16}$/.test(value)
}
export function validPassword(value: string) {
  const size = new TextEncoder().encode(value).length
  return size >= 8 && size <= 72
}
export function validEmail(value: string) {
  return value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
export function allowsEmailDomain(
  value: string,
  rule: { emailMode: number; emailDomains: string },
) {
  const domain = value.trim().toLowerCase().split('@').at(-1) ?? ''
  const listed = rule.emailDomains.toLowerCase().split(/\s+/).includes(domain)
  return (
    rule.emailMode === 0 || (rule.emailMode === 1 && listed) || (rule.emailMode === 2 && !listed)
  )
}
export function validTextureName(value: string) {
  return value.trim().length > 0 && Array.from(value).length <= 50
}
export function validTextureDimensions(type: TextureType, w: number, h: number) {
  if (type === 2 && w > 0 && h > 0 && w % 22 === 0 && h % 17 === 0 && w / 22 === h / 17) {
    const scale = w / 22
    return scale * 64 <= 8192 && scale * 32 <= 8192 && scale * 64 * scale * 32 <= 16777216
  }
  if (w < 64 || h < 32 || w > 8192 || h > 8192 || w * h > 16777216 || w % 64 !== 0 || h % 32 !== 0)
    return false
  return type === 0 ? w === h || w === 2 * h : type === 1 ? w === h : w === 2 * h
}
export type UploadIssue = 'mime' | 'size' | 'png' | 'dimensions'
export async function validateTextureFile(
  file: File,
  type: TextureType,
  maxBytes = 1048576,
): Promise<UploadIssue | null> {
  if (file.type !== 'image/png') return 'mime'
  if (!file.size || file.size > maxBytes) return 'size'
  const bytes = new Uint8Array(await file.slice(0, 24).arrayBuffer())
  if (
    bytes.length < 24 ||
    ![137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b) ||
    String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR'
  )
    return 'png'
  const view = new DataView(bytes.buffer)
  return validTextureDimensions(type, view.getUint32(16), view.getUint32(20)) ? null : 'dimensions'
}
