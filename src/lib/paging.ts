export type Paging = { total: number; nextOffset: number | null }

type HeaderReader = { get(name: string): string | null }

/** 后端列表接口用响应头传分页信息：X-Total-Count、X-Limit、Link(rel="next")。 */
export function parsePaging(headers: HeaderReader, fallbackCount: number): Paging {
  const total = Number.parseInt(headers.get('X-Total-Count') ?? '', 10)
  const link = headers.get('Link') ?? ''
  const hasNext = /rel="next"/.test(link)
  const nextOffset = hasNext ? Number.parseInt(link.match(/offset=(\d+)/)?.[1] ?? '', 10) : Number.NaN
  return {
    total: Number.isFinite(total) ? total : fallbackCount,
    nextOffset: Number.isFinite(nextOffset) ? nextOffset : null,
  }
}
