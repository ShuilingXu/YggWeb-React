import { requestJSON, requestEmpty, clearAccessToken } from './client'
import { isAccount, isOAuthClient, isExternalIdentity, isArrayOf } from './validate'
export function getAccount(signal?: AbortSignal) {
  return requestJSON('/api/account', isAccount, { signal })
}
export async function changePassword(password: string, newPassword: string, signal?: AbortSignal) {
  await requestEmpty('/api/account/password', {
    method: 'PUT',
    body: { password, newPassword },
    signal,
  })
  clearAccessToken()
}
export async function changeEmail(password: string, email: string, signal?: AbortSignal) {
  await requestEmpty('/api/account/email', { method: 'PUT', body: { password, email }, signal })
  clearAccessToken()
}
export async function deleteAccount(password: string, signal?: AbortSignal) {
  await requestEmpty('/api/account', { method: 'DELETE', body: { password }, signal })
  clearAccessToken()
}
export function sendVerification(signal?: AbortSignal) {
  return requestEmpty('/api/account/verification', { method: 'POST', signal })
}

export const listGrants = (signal?: AbortSignal) =>
  requestJSON('/api/account/oauth', isArrayOf(isOAuthClient), { signal })
export const revokeGrant = (id: string, signal?: AbortSignal) =>
  requestEmpty('/api/account/oauth/' + encodeURIComponent(id), { method: 'DELETE', signal })
export const listExternal = (signal?: AbortSignal) =>
  requestJSON('/api/account/oidc', isArrayOf(isExternalIdentity), { signal })
export async function removeExternal(id: string, password: string, signal?: AbortSignal) {
  await requestEmpty('/api/account/oidc/' + encodeURIComponent(id), {
    method: 'DELETE',
    body: { password },
    signal,
  })
  clearAccessToken()
}
