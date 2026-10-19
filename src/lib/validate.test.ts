import { describe, expect, it } from 'vitest'
import {
  checkDimensions,
  emailDomainAllowed,
  isPngSignature,
  isValidEmail,
  isValidOidcIssuer,
  isValidPassword,
  isValidPlayerName,
  isValidRedirectUri,
} from './validate'

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

  it('requires 8-72 UTF-8 bytes for passwords', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('12345678')).toBe(true)
    expect(isValidPassword('a'.repeat(72))).toBe(true)
    expect(isValidPassword('a'.repeat(73))).toBe(false)
  })

  it('matches exact email domains for allow/deny lists', () => {
    expect(emailDomainAllowed('a@example.com', 0, '')).toBe(true)
    expect(emailDomainAllowed('a@Example.com', 1, 'example.com other.test')).toBe(true)
    expect(emailDomainAllowed('a@sub.example.com', 1, 'example.com')).toBe(false)
    expect(emailDomainAllowed('a@example.com', 2, 'example.com')).toBe(false)
    expect(emailDomainAllowed('a@other.test', 2, 'example.com')).toBe(true)
  })

  it('accepts only HTTP(S) redirects and OIDC issuers', () => {
    expect(isValidRedirectUri('https://app.example.test/callback')).toBe(true)
    expect(isValidRedirectUri('http://127.0.0.1:8080/callback')).toBe(true)
    expect(isValidRedirectUri('http://example.test/callback')).toBe(false)
    expect(isValidRedirectUri('https://app.example.test/callback#fragment')).toBe(false)

    expect(isValidOidcIssuer('https://id.example.test')).toBe(true)
    expect(isValidOidcIssuer('http://127.0.0.1:9000')).toBe(true)
    expect(isValidOidcIssuer('http://id.example.test')).toBe(false)
    expect(isValidOidcIssuer('https://id.example.test/?query=1')).toBe(false)
  })
})
