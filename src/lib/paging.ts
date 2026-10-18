import type { ListMeta } from '../api/types'

export const PAGE_SIZE = 50

/** 从 `Link: <...offset=50>; rel="next"` 里取下一页 offset。 */
export function parseNextOffset(link: string | null): number | null {
  if (!link) return null
  for (const part of link.split(',')) {
    if (!/rel="?next"?/.test(part)) continue
    const match = /offset=(\d+)/.exec(part)
    if (match?.[1]) {
      const value = Number(match[1])
      if (Number.isSafeInteger(value)) return value
    }
  }
  return null
}

/**
 * 列表分页元信息：后端返回数组，总数与下一页在响应头里。
 * Link 缺失时用「满页 + 未到总数」推断，保持与后端判断一致的保守行为。
 */
export function listMeta(
  headers: Headers,
  count: number,
  offset: number,
  limit: number,
): ListMeta {
  const rawTotal = headers.get('X-Total-Count')
  const total = rawTotal !== null && Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : count
  const rawLimit = headers.get('X-Limit')
  const pageLimit = rawLimit !== null && Number(rawLimit) > 0 ? Number(rawLimit) : limit
  const fromLink = parseNextOffset(headers.get('Link'))
  const next = fromLink ?? (count === pageLimit && offset + pageLimit < total ? offset + pageLimit : null)
  return { total, limit: pageLimit, next }
}

export function pageCount(total: number, limit: number): number {
  if (limit <= 0) return 1
  return Math.max(1, Math.ceil(total / limit))
}

export function clampOffset(offset: number, total: number, limit: number): number {
  const max = Math.max(0, (pageCount(total, limit) - 1) * limit)
  if (!Number.isFinite(offset) || offset < 0) return 0
  return Math.min(Math.floor(offset), max)
}

/** 列表查询串：空值不入参，后端按缺省处理。 */
export function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}
