import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  requestEmpty,
  requestJSON,
  requestPage,
  setAccessToken,
  clearAccessToken,
  subscribeAuthExpired,
} from './client'
import { isArrayOf, isPlayer } from './validate'
afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})
describe('请求与身份边界', () => {
  it.each([
    ['InsufficientPoints', 409, 'insufficientPoints'],
    ['AlreadySigned', 409, 'alreadySigned'],
    ['PluginDenied', 403, 'pluginDenied'],
  ])('业务错误 %s 显示专用提示，且不泄漏后端原文', async (code, status, kind) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: code, errorMessage: 'sensitive' }, { status: Number(status) }),
        ),
    )
    await expect(requestEmpty('/api/account/sign')).rejects.toMatchObject({ kind })
  })
  it('401 清空内存凭证并通知页面', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetcher)
    setAccessToken('test')
    const listener = vi.fn()
    const unsubscribe = subscribeAuthExpired(listener)
    try {
      await expect(requestEmpty('/api/players')).rejects.toMatchObject({ kind: 'unauthorized' })
      expect(listener).toHaveBeenCalledOnce()
      await requestEmpty('/api/players')
      expect(
        ((fetcher.mock.calls[1]?.[1] as RequestInit).headers as Headers).has('Authorization'),
      ).toBe(false)
    } finally {
      unsubscribe()
    }
  })
  it('403 无效身份只探测一次账号，清空登录', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
    vi.stubGlobal('fetch', fetcher)
    setAccessToken('test')
    const listener = vi.fn()
    const unsubscribe = subscribeAuthExpired(listener)
    try {
      await expect(requestEmpty('/api/players')).rejects.toMatchObject({ kind: 'unauthorized' })
      expect(fetcher).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenCalledOnce()
    } finally {
      unsubscribe()
    }
  })
  it('合法身份越权403保留登录', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(
        Response.json({
          id: 'id',
          email: 'a@example.com',
          state: 0,
          permission: 0,
          verified: 0,
          createdAt: '2026-10-17T00:00:00Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetcher)
    setAccessToken('test')
    await expect(requestEmpty('/api/admin/users')).rejects.toMatchObject({ kind: 'forbidden' })
    await requestEmpty('/api/players')
    expect(
      ((fetcher.mock.calls[2]?.[1] as RequestInit).headers as Headers).get('Authorization'),
    ).toBe('Bearer test')
  })
  it('缺少必需字段的成功响应不得渲染', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([{ id: 'id' }])))
    await expect(requestJSON('/api/players', isArrayOf(isPlayer))).rejects.toMatchObject({
      kind: 'response',
    })
  })
  it('解析数组分页响应头和下一页', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json([{ id: 'id', name: 'Steve' }], {
          headers: {
            'X-Total-Count': '51',
            'X-Limit': '50',
            Link: '</api/textures?offset=50>; rel="next"',
          },
        }),
      ),
    )
    expect(await requestPage('/api/textures', isArrayOf(isPlayer))).toMatchObject({
      total: 51,
      limit: 50,
      next: '/api/textures?offset=50',
    })
  })
  it('429保留重试时间且不输出后端敏感原文', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { errorMessage: 'sensitive' },
            { status: 429, headers: { 'Retry-After': '60' } },
          ),
        ),
    )
    await expect(requestEmpty('/api/auth/login')).rejects.toMatchObject({
      kind: 'rateLimit',
      retryAfter: 60,
    })
  })
})
