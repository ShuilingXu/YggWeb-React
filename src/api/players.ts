import { requestJSON, requestEmpty } from './client'
import { isArrayOf, isPlayer } from './validate'
export function listPlayers(signal?: AbortSignal) {
  return requestJSON('/api/players', isArrayOf(isPlayer), { signal })
}
export function createPlayer(name: string, signal?: AbortSignal) {
  return requestEmpty('/api/players', { method: 'POST', body: { name }, signal })
}
export function renamePlayer(id: string, name: string, signal?: AbortSignal) {
  return requestEmpty(`/api/players/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { name },
    signal,
  })
}
export function deletePlayer(id: string, signal?: AbortSignal) {
  return requestEmpty(`/api/players/${encodeURIComponent(id)}`, { method: 'DELETE', signal })
}
export function setPlayerTextures(
  id: string,
  body: { skin?: string; cape?: string },
  signal?: AbortSignal,
) {
  return requestEmpty(`/api/players/${encodeURIComponent(id)}/textures`, {
    method: 'PUT',
    body,
    signal,
  })
}
