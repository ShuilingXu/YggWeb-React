import { useCallback, useEffect, useState, type FormEvent } from 'react'
import * as api from '../api/site'
import * as identity from '../api/account'
import { startExternal, completeExternal } from '../api/auth'
import { ApiError, clearAccessToken, errorMessage } from '../api/client'
import type { Account, SiteSettings } from '../api/types'
import { consentScopes, matchesCallback } from '../lib/oauth'
import { useResource } from '../lib/useResource'
import { formatDate } from '../lib/format'
import { Button, Field, Notice, Dialog } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './Operations.module.css'

const flowKey = 'ygg.oidc.flow'
export async function beginExternal(link: boolean, returnTo = '/user') {
  try {
    sessionStorage.setItem(flowKey, '')
  } catch {
    throw new ApiError('storage')
  }
  const result = await startExternal(link)
  try {
    sessionStorage.setItem(flowKey, JSON.stringify({ state: result.state, returnTo }))
  } catch {
    throw new ApiError('storage')
  }
  location.assign(result.url)
}
function externalError(cause: unknown) {
  if (cause instanceof ApiError && (cause.kind === 'forbidden' || cause.kind === 'unauthorized'))
    return t('ops.externalInvalid')
  return cause instanceof ApiError
    ? cause.kind === 'conflict'
      ? t('ops.externalConflict')
      : errorMessage(cause)
    : errorMessage(cause)
}
export function ExternalLoginButton({ site, returnTo }: { site: SiteSettings; returnTo?: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  if (!site.oidcEnabled) return null
  return (
    <div className="stack">
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          setError('')
          void beginExternal(false, returnTo).catch((cause) => {
            setError(externalError(cause))
            setBusy(false)
          })
        }}
      >
        {t('ops.externalLogin', { name: site.oidcName })}
      </Button>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}

export function ExternalCallback({
  search,
  onAuthenticated,
}: {
  search: string
  onAuthenticated: (account: Account, destination: string) => void
}) {
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams(search)
    history.replaceState(null, '', location.pathname + '#/oidc/callback')
    // StrictMode 首次效果会立即清理，延后提交可避免消费一次性 state 两次。
    const timer = setTimeout(() => {
      void (async () => {
        let flow: unknown
        try {
          flow = JSON.parse(sessionStorage.getItem(flowKey) ?? 'null')
          sessionStorage.removeItem(flowKey)
        } catch {
          setError(errorMessage(new ApiError('storage')))
          return
        }
        if (
          !flow ||
          typeof flow !== 'object' ||
          !('state' in flow) ||
          typeof flow.state !== 'string' ||
          !flow.state ||
          flow.state !== params.get('state') ||
          !params.get('code') ||
          params.has('error')
        ) {
          setError(t('ops.externalInvalid'))
          return
        }
        try {
          await completeExternal(String(flow.state), params.get('code')!, controller.signal)
          const account = await identity.getAccount(controller.signal)
          const destination =
            'returnTo' in flow &&
            typeof flow.returnTo === 'string' &&
            (flow.returnTo === '/user/profile' || flow.returnTo.startsWith('/oauth/authorize?'))
              ? flow.returnTo
              : '/user'
          if (!controller.signal.aborted) onAuthenticated(account, destination)
        } catch (cause) {
          if (!controller.signal.aborted) {
            clearAccessToken()
            setError(externalError(cause))
          }
        }
      })()
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, onAuthenticated])
  return (
    <section className="panel stack">
      <h1>{t('ops.externalVerify')}</h1>
      {error ? <Notice tone="error">{error}</Notice> : <p>{t('ops.externalBusy')}</p>}
      <a href="#/auth/login">{t('nav.login')}</a>
    </section>
  )
}

export function OAuthConsent({ search }: { search: string }) {
  const params = new URLSearchParams(search)
  const clientId = params.get('client_id') ?? ''
  const load = useCallback((signal: AbortSignal) => api.getClient(clientId, signal), [clientId])
  const client = useResource(load)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const scopes = client.value ? consentScopes(params, client.value.redirectUri) : null
  async function decide(approve: boolean) {
    if (!client.value || !scopes) return
    setBusy(true)
    setError('')
    try {
      const result = await api.consent({ ...Object.fromEntries(params), approve })
      if (!matchesCallback(result.redirect, client.value.redirectUri))
        throw new ApiError('response')
      location.assign(result.redirect)
    } catch (cause) {
      setError(errorMessage(cause))
      setBusy(false)
    }
  }
  return (
    <section className={`panel stack ${styles.details}`}>
      <h1>{t('ops.authorize')}</h1>
      {client.loading && <p>{t('common.loading')}</p>}
      {client.error && (
        <Notice tone="error">
          {client.error}
          <Button onClick={client.reload}>{t('common.retry')}</Button>
        </Notice>
      )}
      {client.value && (
        <>
          <h2>{client.value.name}</h2>
          <p>{t('ops.consentHint')}</p>
          <p>
            {t('ops.redirect')}: {client.value.redirectUri}
          </p>
          {scopes ? (
            <>
              <ul>
                {scopes.map((scope, index) => (
                  <li key={index}>
                    {t(scope === 'User.Read' ? 'ops.userRead' : 'ops.playerRead')}
                  </li>
                ))}
              </ul>
              <div className="actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void decide(false)}
                >
                  {t('ops.refuse')}
                </Button>
                <Button type="button" disabled={busy} onClick={() => void decide(true)}>
                  {t('ops.approve')}
                </Button>
              </div>
            </>
          ) : (
            <Notice tone="error">{t('ops.oauthInvalid')}</Notice>
          )}
        </>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </section>
  )
}

export function AuthorizedAccounts({
  site,
  onLogout,
}: {
  site: SiteSettings | null
  onLogout: () => void
}) {
  const grants = useResource(identity.listGrants),
    external = useResource(identity.listExternal)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [removing, setRemoving] = useState<string | null>(null)
  async function run(action: () => Promise<unknown>, success: () => void) {
    setBusy(true)
    setError('')
    try {
      await action()
      success()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }
  function unbind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!removing) return
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    void run(() => identity.removeExternal(removing, password), onLogout)
  }
  return (
    <div className="stack">
      <section className="panel stack">
        <h2 className="panel-header">{t('ops.grants')}</h2>
        {grants.loading && <p>{t('common.loading')}</p>}
        {grants.error && (
          <Notice tone="error">
            {grants.error}
            <Button onClick={grants.reload}>{t('common.retry')}</Button>
          </Notice>
        )}
        {grants.value?.length === 0 && <p>{t('ops.noGrants')}</p>}
        {grants.value?.map((client) => (
          <div className={`${styles.item} stack`} key={client.id}>
            <h3>{client.name}</h3>
            <p>{client.redirectUri}</p>
            <div>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void run(() => identity.revokeGrant(client.id), grants.reload)}
              >
                {t('ops.revoke')}
              </Button>
            </div>
          </div>
        ))}
      </section>
      <section className={`panel stack ${styles.details}`}>
        <h2 className="panel-header">{t('ops.externalBinding')}</h2>
        <p>{t('ops.externalPassword')}</p>
        <a href="#/auth/forgot">{t('auth.forgot')}</a>
        {external.loading && <p>{t('common.loading')}</p>}
        {external.error && (
          <Notice tone="error">
            {external.error}
            <Button onClick={external.reload}>{t('common.retry')}</Button>
          </Notice>
        )}
        {external.value?.length === 0 && <p>{t('ops.noExternal')}</p>}
        {external.value?.map((item) => (
          <div className={`${styles.item} stack`} key={item.id}>
            <p>{item.issuer}</p>
            <p>{formatDate(item.createdAt)}</p>
            <div>
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => {
                  setError('')
                  setRemoving(item.id)
                }}
              >
                {t('ops.unbind')}
              </Button>
            </div>
          </div>
        ))}
        {site?.oidcEnabled === 1 && (
          <div>
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => beginExternal(true, '/user/profile'),
                  () => {},
                )
              }
            >
              {t('ops.bind')}
            </Button>
          </div>
        )}
      </section>
      {error && !removing && <Notice tone="error">{error}</Notice>}
      <Dialog
        open={removing !== null}
        title={t('ops.unbind')}
        onClose={() => {
          if (!busy) setRemoving(null)
        }}
      >
        <form className="stack" onSubmit={unbind}>
          <p>{t('ops.unbindHelp')}</p>
          {error && <Notice tone="error">{error}</Notice>}
          <Field label={t('account.currentPassword')}>
            <input
              name="password"
              type="password"
              maxLength={72}
              autoComplete="current-password"
              required
            />
          </Field>
          <div className="actions">
            <Button disabled={busy} variant="danger">
              {t('ops.unbind')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setRemoving(null)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
