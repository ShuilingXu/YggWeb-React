import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, setAccessToken } from './client'
import { getTextureImage } from './textures'

const texture = {
  id: 'texture-id',
  name: 'Steve',
  type: 0,
  hash: 'a'.repeat(64),
  sizeBytes: 100,
  width: 64,
  height: 64,
  public: 1,
  state: 0,
  createdAt: '2026-10-17T00:00:00Z',
}
const pngResponse = () =>
  new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } })
afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

describe('原图读取权限', () => {
  it('匿名访问公开原图使用实际 metadata.hash 分发路径，不发送鉴权头', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(texture))
      .mockResolvedValueOnce(pngResponse())
    vi.stubGlobal('fetch', fetcher)
    const blob = await getTextureImage('texture-id', 'file')
    expect(fetcher.mock.calls[0]?.[0]).toBe('/api/textures/texture-id')
    expect(fetcher.mock.calls[1]?.[0]).toBe(`/textures/${texture.hash}`)
    expect(
      ((fetcher.mock.calls[1]?.[1] as RequestInit).headers as Headers).has('Authorization'),
    ).toBe(false)
    expect(blob.type).toBe('image/png')
  })
  it('私有原图使用上传者 Web 鉴权路径，不调用 hash 分发', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ ...texture, public: 0 }))
      .mockResolvedValueOnce(pngResponse())
    vi.stubGlobal('fetch', fetcher)
    setAccessToken('test-web-token')
    await getTextureImage('texture-id', 'file')
    expect(fetcher.mock.calls[1]?.[0]).toBe('/api/textures/texture-id/file')
    expect(
      ((fetcher.mock.calls[1]?.[1] as RequestInit).headers as Headers).get('Authorization'),
    ).toBe('Bearer test-web-token')
  })
  it('公开原图即使已登录也不向 hash 分发附带鉴权', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(texture))
      .mockResolvedValueOnce(pngResponse())
    vi.stubGlobal('fetch', fetcher)
    setAccessToken('test-web-token')
    await getTextureImage('texture-id', 'file')
    expect(
      ((fetcher.mock.calls[1]?.[1] as RequestInit).headers as Headers).has('Authorization'),
    ).toBe(false)
  })
  it('metadata 的 hash 不是 SHA256 时停止读取原图', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ ...texture, hash: '../outside' }))
    vi.stubGlobal('fetch', fetcher)
    await expect(getTextureImage('texture-id', 'file')).rejects.toMatchObject({ kind: 'response' })
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
