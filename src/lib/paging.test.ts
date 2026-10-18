import { describe, expect, it } from 'vitest'
import { parsePaging } from './paging'

function headers(map: Record<string, string>) {
  return { get: (name: string) => map[name] ?? null }
}

describe('parsePaging', () => {
  it('reads total and disables next offset when there is no Link header', () => {
    expect(parsePaging(headers({ 'X-Total-Count': '6', 'X-Limit': '50' }), 6)).toEqual({
      total: 6,
      nextOffset: null,
    })
  })

  it('derives the next offset from a rel=next Link header', () => {
    const link = '</api/textures?offset=12&limit=12>; rel="next"'
    expect(parsePaging(headers({ 'X-Total-Count': '30', 'X-Limit': '12', Link: link }), 30)).toEqual({
      total: 30,
      nextOffset: 12,
    })
  })

  it('falls back to the item count when headers are missing', () => {
    expect(parsePaging(headers({}), 3)).toEqual({ total: 3, nextOffset: null })
  })
})
