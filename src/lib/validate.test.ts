import { describe, expect, it } from 'vitest'
import { checkDimensions, isPngSignature, isValidEmail, isValidPlayerName } from './validate'

describe('checkDimensions', () => {
  it('accepts 64x64 and 128x64 steve skins', () => {
    expect(checkDimensions(64, 64, 0)).toBeNull()
    expect(checkDimensions(128, 64, 0)).toBeNull()
  })

  it('rejects steve skins that are neither square nor 2:1', () => {
    expect(checkDimensions(100, 100, 0)).toBe('dimsNotMultiple')
    expect(checkDimensions(192, 128, 0)).toBe('badSteve')
  })

  it('accepts only square alex skins', () => {
    expect(checkDimensions(64, 64, 1)).toBeNull()
    expect(checkDimensions(128, 64, 1)).toBe('badAlex')
  })

  it('accepts 2:1 capes and legacy 22x17 capes', () => {
    expect(checkDimensions(64, 32, 2)).toBeNull()
    expect(checkDimensions(22, 17, 2)).toBeNull()
    expect(checkDimensions(44, 34, 2)).toBeNull()
  })

  it('rejects wrong cape ratios', () => {
    expect(checkDimensions(64, 64, 2)).toBe('badCape')
  })

  it('rejects oversized images regardless of ratio', () => {
    expect(checkDimensions(64 * 256, 32 * 256, 2)).toBe('tooWide')
    expect(checkDimensions(8192 + 64, 64, 0)).toBe('tooWide')
  })
})

describe('isPngSignature', () => {
  it('detects the 8-byte PNG header', () => {
    expect(isPngSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true)
    expect(isPngSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]))).toBe(false)
    expect(isPngSignature(new Uint8Array([0x47, 0x49, 0x46]))).toBe(false)
  })
})

describe('name and email validation', () => {
  it('accepts 3-16 ascii words', () => {
    expect(isValidPlayerName('WebQa')).toBe(true)
    expect(isValidPlayerName('ab')).toBe(false)
    expect(isValidPlayerName('玩家名字')).toBe(false)
    expect(isValidPlayerName('a'.repeat(17))).toBe(false)
  })

  it('accepts ordinary mailbox shapes only', () => {
    expect(isValidEmail('webqa@example.test')).toBe(true)
    expect(isValidEmail('no-at-sign')).toBe(false)
  })
})
