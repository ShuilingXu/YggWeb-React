export function paging(headers: Headers, length: number, fallback = 50) {
  const raw = headers.get('X-Total-Count')
  const total = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null
  const limit = Number(headers.get('X-Limit')) || fallback
  return { total, limit, next: /rel="?next"?/.test(headers.get('Link') || '') || (total === null && length === limit) }
}
