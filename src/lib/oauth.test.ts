import { describe, it, expect } from 'vitest'
import { consentScopes, matchesCallback } from './oauth'

describe('授权导航边界', () => {
  const uri = 'https://app.example.org/callback'
  const params = () =>
    new URLSearchParams({
      response_type: 'code',
      redirect_uri: uri,
      scope: 'User.Read Player.Read',
      code_challenge_method: 'S256',
      code_challenge: 'a'.repeat(43),
    })
  it('正确 PKCE 请求允许展示实际申请的只读权限', () => {
    expect(consentScopes(params(), uri)).toEqual(['User.Read', 'Player.Read'])
  })
  it.each([
    ['scope', 'User.Write'],
    ['redirect_uri', 'https://evil.example.org/callback'],
    ['code_challenge_method', 'plain'],
    ['code_challenge', 'short'],
  ])('拒绝不安全授权参数 %s', (key, value) => {
    const p = params()
    p.set(key, value)
    expect(consentScopes(p, uri)).toBeNull()
  })
  it('回调只允许已登记的源和路径，拒绝脚本与跨站响应', () => {
    expect(matchesCallback(uri + '?code=abc&state=xyz', uri)).toBe(true)
    for (const unsafe of [
      'javascript:alert(1)',
      'https://evil.example.org/callback',
      'https://app.example.org/other',
      uri + '#script',
    ])
      expect(matchesCallback(unsafe, uri)).toBe(false)
  })
})
