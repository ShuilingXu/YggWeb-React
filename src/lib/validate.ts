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
