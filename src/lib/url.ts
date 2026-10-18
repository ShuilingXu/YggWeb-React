import type { TextureQuery } from '../api/types'
export function textureQueryString(query: TextureQuery) {
  const params = new URLSearchParams()
  for (const key of ['q', 'type', 'uploader', 'sort', 'offset', 'limit'] as const) {
    const value = query[key]
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params.size ? `?${params}` : ''
}
export function readTextureQuery(params: URLSearchParams): TextureQuery {
  const type = params.get('type')
  const sort = params.get('sort')
  const offset = Number(params.get('offset') ?? 0)
  const limit = Number(params.get('limit') ?? 24)
  return {
    q: params.get('q') ?? '',
    uploader: params.get('uploader') ?? '',
    type: type === '0' ? 0 : type === '1' ? 1 : type === '2' ? 2 : undefined,
    sort: sort === 'oldest' || sort === 'name' ? sort : 'newest',
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
    limit: Number.isInteger(limit) && limit >= 1 && limit <= 100 ? limit : 24,
  }
}
