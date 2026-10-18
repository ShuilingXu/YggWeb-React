import { describe, expect, it } from 'vitest'
import { clampOffset, listMeta, pageCount, parseNextOffset, queryString } from './paging'

describe('parseNextOffset', () => {
  it('从 Link 头取下一页 offset', () => {
    expect(parseNextOffset('</api/textures?offset=50>; rel="next"')).toBe(50)
    expect(parseNextOffset('</api/closet?q=a&offset=100&limit=50>; rel="next"')).toBe(100)
  })

  it('没有 next 关系时返回 null', () => {
    expect(parseNextOffset(null)).toBeNull()
    expect(parseNextOffset('</api/textures?offset=0>; rel="prev"')).toBeNull()
    expect(parseNextOffset('')).toBeNull()
  })
})

describe('listMeta', () => {
  it('优先使用响应头里的总数与每页大小', () => {
    const headers = new Headers({
      'X-Total-Count': '53',
      'X-Limit': '50',
      Link: '</api/textures?offset=50>; rel="next"',
    })
    expect(listMeta(headers, 50, 0, 50)).toEqual({ total: 53, limit: 50, next: 50 })
  })

  it('没有 Link 时按满页推算下一页', () => {
    const headers = new Headers({ 'X-Total-Count': '120' })
    expect(listMeta(headers, 50, 0, 50).next).toBe(50)
    expect(listMeta(headers, 20, 100, 50).next).toBeNull()
  })

  it('缺少总数头时退回当前条数', () => {
    const headers = new Headers()
    expect(listMeta(headers, 3, 0, 50)).toEqual({ total: 3, limit: 50, next: null })
  })
})

describe('pageCount / clampOffset', () => {
  it('计算页数并夹取越界 offset', () => {
    expect(pageCount(0, 50)).toBe(1)
    expect(pageCount(50, 50)).toBe(1)
    expect(pageCount(51, 50)).toBe(2)
    expect(clampOffset(500, 53, 50)).toBe(50)
    expect(clampOffset(-1, 53, 50)).toBe(0)
  })
})

describe('queryString', () => {
  it('跳过空值并编码中文', () => {
    expect(queryString({ offset: 0, q: '石砖', type: undefined, sort: '' })).toBe(
      '?offset=0&q=%E7%9F%B3%E7%A0%96',
    )
  })
})
