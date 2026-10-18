import { requestEmpty, requestJSON } from './client'
import { isAccount, isReport, isAudit, isArrayOf } from './validate'
export function listUsers(offset = 0, signal?: AbortSignal) {
  return requestJSON(`/api/admin/users?offset=${offset}`, isArrayOf(isAccount), { signal })
}
export function listReports(offset = 0, signal?: AbortSignal) {
  return requestJSON(`/api/admin/reports?offset=${offset}`, isArrayOf(isReport), { signal })
}
export function listAudit(offset = 0, signal?: AbortSignal) {
  return requestJSON(`/api/admin/audit?offset=${offset}`, isArrayOf(isAudit), { signal })
}
export function updateUser(
  id: string,
  body: { state: 0 | 1; permission: 0 | 1 },
  signal?: AbortSignal,
) {
  return requestEmpty(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PUT', body, signal })
}
export function resolveReport(
  id: string,
  body: { resolution: 1; state: 1; note: string } | { resolution: 2; note: string },
  signal?: AbortSignal,
) {
  return requestEmpty(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
    signal,
  })
}
export function setTextureState(id: string, state: 0 | 1, signal?: AbortSignal) {
  return requestEmpty(`/api/admin/textures/${encodeURIComponent(id)}/state`, {
    method: 'PUT',
    body: { state },
    signal,
  })
}
