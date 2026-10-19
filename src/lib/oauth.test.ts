import { describe, expect, it } from 'vitest'
import { consentScopes, matchesCallback } from './oauth'

const CALLBACK = 'https://app.example.test/oauth/callback'
const CHALLENGE = 'a'.repeat(43)

function query(values: Record<string, string>): URLSearchParams {
  return new URLSearchParams(values)
}

describe('consentScopes', () => {
  it('accepts authorization code with S256 PKCE', () => {
    expect(
      consentScopes(
        query({
          response_type: 'code',
          redirect_uri: CALLBACK,
          scope: 'User.Read Player.Read',
          code_challenge: CHALLENGE,
          code_challenge_method: 'S256',
        }),
        CALLBACK,
      ),
    ).toEqual(['User.Read', 'Player.Read'])
  })

  it('rejects mismatched redirect, plain PKCE, short challenge and unknown scope', () => {
    const base = {
      response_type: 'code',
      redirect_uri: CALLBACK,
      scope: 'User.Read',
      code_challenge: CHALLENGE,
      code_challenge_method: 'S256',
    }
    expect(consentScopes(query({ ...base, redirect_uri: 'https://evil.test/cb' }), CALLBACK)).toBeNull()
    expect(consentScopes(query({ ...base, code_challenge_method: 'plain' }), CALLBACK)).toBeNull()
    expect(consentScopes(query({ ...base, code_challenge: 'short' }), CALLBACK)).toBeNull()
    expect(consentScopes(query({ ...base, scope: 'User.Write' }), CALLBACK)).toBeNull()
    expect(consentScopes(query({ ...base, response_type: 'token' }), CALLBACK)).toBeNull()
  })
})

describe('matchesCallback', () => {
  it('allows only the registered origin and path', () => {
    expect(matchesCallback(`${CALLBACK}?code=abc&state=s`, CALLBACK)).toBe(true)
    expect(matchesCallback(`${CALLBACK}/extra?code=abc`, CALLBACK)).toBe(false)
    expect(matchesCallback('https://evil.test/callback?code=abc', CALLBACK)).toBe(false)
    expect(matchesCallback('https://user:pass@app.example.test/oauth/callback', CALLBACK)).toBe(false)
    expect(matchesCallback(`${CALLBACK}#fragment`, CALLBACK)).toBe(false)
    expect(matchesCallback('not a url', CALLBACK)).toBe(false)
  })
})
