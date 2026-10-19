const OAUTH_SCOPES = ['User.Read', 'Player.Read']
const PKCE_CHALLENGE = /^[A-Za-z0-9_-]{43}$/

/** 同意页只接受后端支持的授权码 + S256 PKCE 请求；参数不可信时返回 null。 */
export function consentScopes(params: URLSearchParams, redirectUri: string): string[] | null {
  const scopes = (params.get('scope') ?? '').trim().split(/\s+/).filter(Boolean)
  if (
    params.get('response_type') !== 'code' ||
    params.get('redirect_uri') !== redirectUri ||
    params.get('code_challenge_method') !== 'S256' ||
    !PKCE_CHALLENGE.test(params.get('code_challenge') ?? '') ||
    scopes.length === 0 ||
    scopes.some((scope) => !OAUTH_SCOPES.includes(scope))
  ) {
    return null
  }
  return [...new Set(scopes)]
}

/** 后端返回的 redirect 必须是已登记回调的同源同路径地址。 */
export function matchesCallback(redirect: string, registered: string): boolean {
  try {
    const target = new URL(redirect)
    const expected = new URL(registered)
    return (
      (target.protocol === 'https:' || target.protocol === 'http:') &&
      !target.username &&
      !target.password &&
      !target.hash &&
      target.origin === expected.origin &&
      target.pathname === expected.pathname
    )
  } catch {
    return false
  }
}
