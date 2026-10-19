import { useState } from 'react'
import { ApiError, errorMessage } from '../api/client'
import { oauthApi } from '../api/resources'
import type { OAuthConsentInput } from '../api/types'
import { useAuth } from '../lib/auth'
import { useSite } from '../components/SiteProvider'
import { useAsync } from '../lib/useAsync'
import { consentScopes, matchesCallback } from '../lib/oauth'
import { Link, useRoute } from '../lib/router'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { Badge, Button, ErrorState, Skeleton, useToast } from '../components/ui'

function scopeLabel(scope: string): string {
  return scope === 'Player.Read' ? t('oauth.scopePlayer') : t('oauth.scopeUser')
}

export function OAuthConsentPage() {
  const { status } = useAuth()
  const site = useSite()
  const route = useRoute()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const authed = status === 'authenticated'
  const clientId = route.search.get('client_id') ?? ''
  const client = useAsync(
    async (signal) => (authed && clientId ? oauthApi.client(clientId, signal) : null),
    [authed, clientId],
  )

  if (!authed) {
    const next = `/oauth/authorize?${route.search.toString()}`
    return (
      <>
        <PageHeader title={t('oauth.title')} />
        <div className="notice">
          {t('upload.needLogin')}{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`}>{t('nav.login')}</Link>
        </div>
      </>
    )
  }

  if (site.site && site.site.oauthEnabled === 0) {
    return (
      <>
        <PageHeader title={t('oauth.title')} />
        <ErrorState message={t('oauth.disabled')} />
      </>
    )
  }

  if (!clientId) {
    return (
      <>
        <PageHeader title={t('oauth.title')} />
        <ErrorState message={t('oauth.invalid')} />
      </>
    )
  }

  if (client.loading) {
    return (
      <>
        <PageHeader title={t('oauth.title')} />
        <Skeleton height={280} />
      </>
    )
  }

  if (client.error || !client.data) {
    return (
      <>
        <PageHeader title={t('oauth.title')} />
        <ErrorState
          message={client.error ? errorMessage(client.error) : t('oauth.invalid')}
          onRetry={client.reload}
        />
      </>
    )
  }

  const data = client.data
  const scopes = consentScopes(route.search, data.redirectUri)

  const decide = async (approve: boolean) => {
    if (!scopes) return
    const body: OAuthConsentInput = {
      client_id: clientId,
      redirect_uri: route.search.get('redirect_uri') ?? '',
      response_type: 'code',
      scope: scopes.join(' '),
      state: route.search.get('state') ?? '',
      code_challenge: route.search.get('code_challenge') ?? '',
      code_challenge_method: 'S256',
      approve,
    }
    setError('')
    setBusy(true)
    try {
      const result = await oauthApi.authorize(body)
      if (!matchesCallback(result.redirect, data.redirectUri)) {
        throw new ApiError(0, t('oauth.redirectMismatch'))
      }
      if (approve) toast.push(t('oauth.approved', { name: data.name }), 'success')
      window.location.assign(result.redirect)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title={t('oauth.title')} />
      <section className="card" style={{ maxWidth: 680 }}>
        <div className="row-between">
          <h2 className="section-title">{data.name}</h2>
          <Badge tone="accent">{t('oauth.badge')}</Badge>
        </div>
        <p className="muted">{t('oauth.wants')}</p>
        <dl className="def-list" style={{ marginTop: 'var(--space-4)' }}>
          <div>
            <dt>{t('oauth.redirect')}</dt>
            <dd className="mono" style={{ wordBreak: 'break-all' }}>{data.redirectUri}</dd>
          </div>
          <div>
            <dt>{t('oauth.scopes')}</dt>
            <dd className="row" style={{ flexWrap: 'wrap' }}>
              {scopes
                ? scopes.map((scope) => (
                    <Badge key={scope} tone="accent">
                      {scopeLabel(scope)}
                    </Badge>
                  ))
                : null}
            </dd>
          </div>
        </dl>
        {scopes ? (
          <div className="stack" style={{ marginTop: 'var(--space-4)' }}>
            <div className="notice">{t('oauth.scopeHint')}</div>
            <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>{t('oauth.revokeHint')}</p>
            {error ? <p className="field__error" role="alert">{error}</p> : null}
            <div className="form-actions">
              <Button disabled={busy} onClick={() => void decide(false)}>
                {t('oauth.deny')}
              </Button>
              <Button variant="primary" loading={busy} onClick={() => void decide(true)}>
                {t('oauth.approve')}
              </Button>
            </div>
          </div>
        ) : (
          <ErrorState message={t('oauth.invalid')} />
        )}
      </section>
    </>
  )
}
