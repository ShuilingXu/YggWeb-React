import { requestEmpty, requestPage } from './client'
import { isArrayOf, isTexture } from './validate'
import type { TextureQuery } from './types'
import { textureQueryString } from '../lib/url'
export function listCloset(query: TextureQuery = {}, signal?: AbortSignal) {
  return requestPage(`/api/closet${textureQueryString(query)}`, isArrayOf(isTexture), { signal })
}
export function saveClosetItem(id: string, name: string, signal?: AbortSignal) {
  return requestEmpty(`/api/closet/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { name },
    signal,
  })
}
export function removeClosetItem(id: string, signal?: AbortSignal) {
  return requestEmpty(`/api/closet/${encodeURIComponent(id)}`, { method: 'DELETE', signal })
}
