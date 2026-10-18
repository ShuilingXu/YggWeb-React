import { requestJSON, requestEmpty, clearAccessToken } from './client'
import { isAccount } from './validate'
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
