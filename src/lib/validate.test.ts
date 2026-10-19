import { describe, expect, it } from 'vitest'
import {
  emailDomainAllowed,
  isValidEmail,
  isValidOidcIssuer,
  isValidPassword,
  isValidPlayerName,
  isValidRedirectUri,
  passwordByteLength,
  textureDimensionProblem,
} from './validate'

describe('textureDimensionProblem', () => {
  it('steve 接受 1:1 与 2:1 的 64×32 整数倍', () => {
    expect(textureDimensionProblem(0, 64, 64)).toBeNull()
    expect(textureDimensionProblem(0, 64, 32)).toBeNull()
    expect(textureDimensionProblem(0, 128, 128)).toBeNull()
    expect(textureDimensionProblem(0, 128, 64)).toBeNull()
  })

  it('steve 拒绝非整数倍与超出范围', () => {
    expect(textureDimensionProblem(0, 63, 63)).toBe('dimensions')
    expect(textureDimensionProblem(0, 48, 48)).toBe('dimensions')
    expect(textureDimensionProblem(0, 128, 96)).toBe('dimensions')
    expect(textureDimensionProblem(0, 0, 0)).toBe('dimensions')
    expect(textureDimensionProblem(0, 8256, 8256)).toBe('dimensions')
  })

  it('alex 只接受正方形', () => {
    expect(textureDimensionProblem(1, 64, 64)).toBeNull()
    expect(textureDimensionProblem(1, 128, 64)).toBe('alex')
  })

  it('披风接受 2:1 与 22×17 透明补边比例', () => {
    expect(textureDimensionProblem(2, 64, 32)).toBeNull()
    expect(textureDimensionProblem(2, 128, 64)).toBeNull()
    expect(textureDimensionProblem(2, 22, 17)).toBeNull()
    expect(textureDimensionProblem(2, 44, 34)).toBeNull()
    expect(textureDimensionProblem(2, 64, 64)).toBe('cape')
    expect(textureDimensionProblem(2, 22, 18)).toBe('cape')
  })
})

describe('账号字段校验', () => {
  it('角色名 3–16 位字母数字下划线', () => {
    expect(isValidPlayerName('Steve_01')).toBe(true)
    expect(isValidPlayerName('ab')).toBe(false)
    expect(isValidPlayerName('名字')).toBe(false)
    expect(isValidPlayerName('a'.repeat(17))).toBe(false)
  })

  it('邮箱只做基本形状校验', () => {
    expect(isValidEmail('owner@example.com')).toBe(true)
    expect(isValidEmail('owner@')).toBe(false)
    expect(isValidEmail('owner example.com')).toBe(false)
  })

  it('密码按字节计 8–72 位', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('12345678')).toBe(true)
    expect(isValidPassword('a'.repeat(72))).toBe(true)
    expect(isValidPassword('a'.repeat(73))).toBe(false)
    // 一个中文字符占 3 字节，4 个中文即 12 字节
    expect(passwordByteLength('密码密码')).toBe(12)
  })

  it('邮箱域名白名单/黑名单精确匹配且不区分大小写', () => {
    expect(emailDomainAllowed('a@example.com', 0, '')).toBe(true)
    expect(emailDomainAllowed('a@Example.com', 1, 'example.com other.com')).toBe(true)
    expect(emailDomainAllowed('a@sub.example.com', 1, 'example.com')).toBe(false)
    expect(emailDomainAllowed('a@example.com', 2, 'example.com')).toBe(false)
    expect(emailDomainAllowed('a@other.com', 2, 'example.com')).toBe(true)
  })

  it('OAuth 回调与 OIDC issuer 只允许 HTTPS 或 loopback HTTP', () => {
    expect(isValidRedirectUri('https://app.example.com/cb')).toBe(true)
    expect(isValidRedirectUri('http://127.0.0.1:8080/cb')).toBe(true)
    expect(isValidRedirectUri('http://localhost/cb')).toBe(true)
    expect(isValidRedirectUri('http://example.com/cb')).toBe(false)
    expect(isValidRedirectUri('https://app.example.com/cb#x')).toBe(false)

    expect(isValidOidcIssuer('https://id.example.com')).toBe(true)
    expect(isValidOidcIssuer('http://127.0.0.1:9000')).toBe(true)
    expect(isValidOidcIssuer('http://id.example.com')).toBe(false)
    expect(isValidOidcIssuer('https://id.example.com/?x=1')).toBe(false)
  })
})
