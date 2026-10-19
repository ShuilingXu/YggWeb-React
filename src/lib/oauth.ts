export function consentScopes(params: URLSearchParams, redirectUri: string): string[] | null {
  const scopes = (params.get('scope') ?? '').trim().split(/\s+/).filter(Boolean)
  return params.get('response_type') === 'code' &&
    params.get('redirect_uri') === redirectUri &&
    params.get('code_challenge_method') === 'S256' &&
    /^[A-Za-z0-9_-]{43}$/.test(params.get('code_challenge') ?? '') &&
    scopes.length > 0 &&
    scopes.every((scope) => scope === 'User.Read' || scope === 'Player.Read')
    ? scopes
    : null
}
export function matchesCallback(redirect: string, registered: string): boolean {
  try {
    const target = new URL(redirect),
      expected = new URL(registered)
    return (
      ['https:', 'http:'].includes(target.protocol) &&
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
