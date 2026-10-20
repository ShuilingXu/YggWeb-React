import { describe, it, expect } from 'vitest'
import { isAudit, isExternalStart, isSiteSettings, isWallet, isPluginInfo } from './validate'
import { allowsEmailDomain } from '../lib/validation'

describe('运营接口契约', () => {
  it('注册和改邮箱共用精确域名策略，不把子域名当成白名单命中', () => {
    const rule = { emailMode: 1, emailDomains: 'example.org example.net' }
    expect(allowsEmailDomain('user@EXAMPLE.ORG', rule)).toBe(true)
    expect(allowsEmailDomain('user@sub.example.org', rule)).toBe(false)
    expect(allowsEmailDomain('user@example.org', { ...rule, emailMode: 2 })).toBe(false)
    expect(allowsEmailDomain('user@other.org', { ...rule, emailMode: 2 })).toBe(true)
  })
  it('站点配置缺少必要字段不能作为完整配置保存', () => {
    expect(isSiteSettings({ name: 'site', registration: 1 })).toBe(false)
  })
  it('积分流水拒绝未知来源与缺失签到时间字段', () => {
    expect(
      isWallet({
        balance: 10,
        nextSignAt: null,
        entries: [{ id: 1, delta: 10, kind: 1, createdAt: '2026-10-18T00:00:00Z' }],
      }),
    ).toBe(true)
    expect(
      isWallet({
        balance: 10,
        nextSignAt: null,
        entries: [{ id: 1, delta: 10, kind: 99, createdAt: '2026-10-18T00:00:00Z' }],
      }),
    ).toBe(false)
    expect(isWallet({ balance: 10, entries: [] })).toBe(false)
  })
  it('支持已上线的新审计动作，拒绝未定义动作', () => {
    const base = {
      id: 1,
      actor: '',
      target: '',
      requestId: 'id',
      result: 0,
      targetState: -1,
      targetPermission: -1,
      createdAt: '2026-10-18T00:00:00Z',
    }
    for (const action of [4, 5, 6, 7, 8, 9]) expect(isAudit({ ...base, action })).toBe(true)
    expect(isAudit({ ...base, action: 10 })).toBe(false)
  })
  it('外部登录仅允许 HTTPS 和本机 HTTP 授权地址', () => {
    expect(isExternalStart({ url: 'https://login.example.org/authorize', state: 'abc' })).toBe(true)
    expect(isExternalStart({ url: 'http://127.0.0.1:55409/authorize', state: 'abc' })).toBe(true)
    for (const url of [
      'javascript:alert(1)',
      'http://remote.example.org/authorize',
      'https://user:password@example.org/authorize',
    ])
      expect(isExternalStart({ url, state: 'abc' })).toBe(false)
  })
  it('插件声明的查询不能穿越到任意 API', () => {
    const plugin = {
      id: 'activity',
      version: '1',
      apiVersion: 1,
      description: '',
      enabled: 1,
      actions: [],
      before: false,
      after: true,
      endpoints: ['/counts'],
    }
    expect(isPluginInfo(plugin)).toBe(true)
    expect(isPluginInfo({ ...plugin, endpoints: ['/../account'] })).toBe(false)
  })
})
