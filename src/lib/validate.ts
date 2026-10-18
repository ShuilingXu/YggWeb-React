import { t } from '../i18n/zh-CN.ts'
export const playerError = (value: string) => /^[A-Za-z0-9_]{3,16}$/.test(value) ? '' : t('playerRule')
export const passwordError = (value: string) => { const length = new TextEncoder().encode(value).length
  return length >= 8 && length <= 72 ? '' : t('passwordRule') }
export function dimensionError(width: number, height: number, type: number) {
  if (width > 8192 || height > 8192 || width * height > 16000000) return t('invalidPixels')
  const square = width >= 64 && width % 64 === 0 && height === width
  const classic = width >= 64 && width % 64 === 0 && height * 2 === width
  const cape = width >= 22 && width % 22 === 0 && height / 17 === width / 22
  return (type === 0 ? square || classic : type === 1 ? square : classic || cape) ? '' : t('invalidSize')
}
