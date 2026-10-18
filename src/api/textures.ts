import { requestJSON, requestEmpty, requestPage, requestBlob } from './client'
import { isArrayOf, isTexture } from './validate'
import type { TextureQuery, TextureInput, TextureUpload } from './types'
import { textureQueryString } from '../lib/url'
const path = (id: string) => `/api/textures/${encodeURIComponent(id)}`
export function listTextures(query: TextureQuery = {}, signal?: AbortSignal) {
  return requestPage(`/api/textures${textureQueryString(query)}`, isArrayOf(isTexture), {
    signal,
    authenticated: false,
  })
}
export function listMyTextures(query: TextureQuery = {}, signal?: AbortSignal) {
  return requestPage(`/api/textures/mine${textureQueryString(query)}`, isArrayOf(isTexture), {
    signal,
  })
}
export function getTexture(id: string, signal?: AbortSignal) {
  return requestJSON(path(id), isTexture, { signal })
}
export function uploadTexture(input: TextureUpload, signal?: AbortSignal) {
  const body = new FormData()
  body.set('name', input.name)
  body.set('type', String(input.type))
  body.set('public', String(input.public))
  body.set('file', input.file)
  return requestJSON('/api/textures', isTexture, { method: 'POST', body, signal, timeoutMs: 60000 })
}
export function updateTexture(id: string, body: TextureInput, signal?: AbortSignal) {
  return requestEmpty(path(id), { method: 'PUT', body, signal })
}
export function deleteTexture(id: string, signal?: AbortSignal) {
  return requestEmpty(path(id), { method: 'DELETE', signal })
}
export function reportTexture(id: string, reason: string, signal?: AbortSignal) {
  return requestEmpty(`${path(id)}/reports`, { method: 'POST', body: { reason }, signal })
}
export async function getTextureImage(
  id: string,
  kind: 'avatar' | 'preview' | 'file',
  size = 128,
  signal?: AbortSignal,
) {
  if (kind === 'file') {
    const texture = await getTexture(id, signal)
    if (texture.public === 1)
      return requestBlob(`/textures/${encodeURIComponent(texture.hash)}`, {
        signal,
        authenticated: false,
      })
    return requestBlob(`${path(id)}/file`, { signal })
  }
  return requestBlob(`${path(id)}/${kind}?size=${size}`, { signal })
}
export function textureImageUrl(id: string, kind: 'avatar' | 'preview', size = 128) {
  return `${path(id)}/${kind}?size=${size}`
}
