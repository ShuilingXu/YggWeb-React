import { describe, it, expect } from 'vitest'
import {
  validPassword,
  validPlayerName,
  validTextureName,
  validTextureDimensions,
  validateTextureFile,
} from './validation'
import { readTextureQuery, textureQueryString } from './url'
describe('输入、上传与筛选', () => {
  it('密码按UTF8字节，角色只允许ASCII名', () => {
    expect(validPassword('汉'.repeat(24))).toBe(true)
    expect(validPassword('汉'.repeat(25))).toBe(false)
    expect(validPlayerName('Player_01')).toBe(true)
    expect(validPlayerName('中文')).toBe(false)
  })
  it('材质及衣柜名最多50字符', () => {
    expect(validTextureName('皮'.repeat(50))).toBe(true)
    expect(validTextureName('皮'.repeat(51))).toBe(false)
    expect(validTextureName(' ')).toBe(false)
  })
  it('皮肤与披风尺寸不能混淆', () => {
    expect(validTextureDimensions(0, 64, 32)).toBe(true)
    expect(validTextureDimensions(1, 64, 32)).toBe(false)
    expect(validTextureDimensions(1, 64, 64)).toBe(true)
    expect(validTextureDimensions(2, 22, 17)).toBe(true)
    expect(validTextureDimensions(2, 64, 64)).toBe(false)
  })
  it('PNG实际文件头、MIME与大小均检查', async () => {
    const bytes = new Uint8Array(24)
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10])
    bytes.set([73, 72, 68, 82], 12)
    const view = new DataView(bytes.buffer)
    view.setUint32(16, 64)
    view.setUint32(20, 32)
    const file = new File([bytes], 'skin.png', { type: 'image/png' })
    expect(await validateTextureFile(file, 0)).toBe(null)
    expect(await validateTextureFile(file, 1)).toBe('dimensions')
    expect(await validateTextureFile(file, 0, 10)).toBe('size')
    expect(
      await validateTextureFile(new File(['fake'], 'fake.png', { type: 'image/png' }), 0),
    ).toBe('png')
    expect(
      await validateTextureFile(new File([bytes], 'file.txt', { type: 'text/plain' }), 0),
    ).toBe('mime')
  })
  it('筛选保留type0、中文与分页', () => {
    const query = readTextureQuery(new URLSearchParams('q=蓝色&type=0&offset=24&limit=24'))
    expect(query.type).toBe(0)
    expect(new URLSearchParams(textureQueryString(query)).get('q')).toBe('蓝色')
    expect(readTextureQuery(new URLSearchParams('offset=-1&limit=999'))).toMatchObject({
      offset: 0,
      limit: 24,
    })
  })
})
