import { describe, expect, it } from 'vitest'
import {
  isValidEmail,
  isValidPassword,
  isValidPlayerName,
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

  it('密码按字节计 8–32 位', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('12345678')).toBe(true)
    expect(isValidPassword('a'.repeat(33))).toBe(false)
    // 一个中文字符占 3 字节，4 个中文即 12 字节
    expect(passwordByteLength('密码密码')).toBe(12)
  })
})
