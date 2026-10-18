import { requestJSON, requestEmpty, setAccessToken, clearAccessToken } from './client'
import { isLogin } from './validate'
export async function login(body: { username: string; password: string }, signal?: AbortSignal) {
  const result = await requestJSON('/api/auth/login', isLogin, {
    method: 'POST',
    body,
    signal,
    authenticated: false,
  })
  setAccessToken(result.accessToken)
  return result
}
export function register(
  body: { email: string; password: string; playerName: string },
  signal?: AbortSignal,
) {
  return requestEmpty('/api/auth/register', { method: 'POST', body, signal, authenticated: false })
}
export async function logout(signal?: AbortSignal) {
  await requestEmpty('/api/auth/logout', { method: 'POST', signal })
  clearAccessToken()
}
export function forgotPassword(email: string, signal?: AbortSignal) {
  return requestEmpty('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    signal,
    authenticated: false,
  })
}
export function verifyEmail(token: string, signal?: AbortSignal) {
  return requestEmpty('/api/auth/verify-email', {
    method: 'POST',
    body: { token },
    signal,
    authenticated: false,
  })
}
export function resetPassword(token: string, newPassword: string, signal?: AbortSignal) {
  return requestEmpty('/api/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
    signal,
    authenticated: false,
  })
}
