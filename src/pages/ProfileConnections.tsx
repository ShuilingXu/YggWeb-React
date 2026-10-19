import { useState } from 'react'
import { ApiError, errorMessage } from '../api/client'
import { oauthApi, oidcApi } from '../api/resources'
import type { ExternalIdentity, OAuthClient } from '../api/types'
import { useAuth } from '../lib/auth'
import { useSite } from '../components/SiteProvider'
import { useAsync } from '../lib/useAsync'
import { beginOidc } from '../lib/oidc'
import { formatDateTime } from '../lib/format'
import { navigate } from '../lib/router'
import { t } from '../i18n'
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Skeleton,
  TextInput,
  useToast,
} from '../components/ui'

export function AuthorizedAppsPanel() {
  const site = useSite()
  const toast = useToast()
  const apps = useAsync((signal) => oauthApi.authorizedApps(signal), [])
  const [target, setTarget] = useState<OAuthClient | null>(null)
  const [busy, setBusy] = useState(false)

  const visible = site.site?.oauthEnabled === 1 || Boolean(apps.data?.length) || Boolean(apps.error)
  if (!visible) return null

  const revoke = async () => {
    if (!target) return
    setBusy(true)
    try {
      await oauthApi.revoke(target.id)
      toast.push(t('profile.revoked'), 'success')
      setTarget(null)
      apps.reload()
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">{t('profile.oauthApps')}</h2>
      <p className="muted">{t('profile.oauthAppsHint')}</p>
      {apps.loading ? <Skeleton height={100} /> : null}
      {apps.error ? <ErrorState message={errorMessage(apps.error)} onRetry={apps.reload} /> : null}
      {!apps.loading && !apps.error && apps.data ? (
        apps.data.length === 0 ? (
          <EmptyState title={t('profile.oauthAppsEmpty')} body={t('profile.oauthAppsEmptyHint')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.site.clientName')}</th>
                  <th>{t('admin.site.redirect')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {apps.data.map((app) => (
                  <tr key={app.id}>
                    <td>{app.name}</td>
                    <td className="mono" style={{ wordBreak: 'break-all' }}>{app.redirectUri}</td>
                    <td>
                      <Button size="sm" variant="danger" onClick={() => setTarget(app)}>
                        {t('profile.revokeApp')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
      <ConfirmDialog
        open={target !== null}
        title={t('profile.revokeApp')}
        body={target ? t('profile.revokeConfirm', { name: target.name }) : ''}
        confirmLabel={t('profile.revokeApp')}
        danger
        loading={busy}
        onCancel={() => setTarget(null)}
        onConfirm={() => void revoke()}
      />
      <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>{t('profile.revokeHint')}</p>
    </section>
  )
}

export function ExternalIdentitiesPanel() {
  const { endSession } = useAuth()
  const site = useSite()
  const toast = useToast()
  const identities = useAsync((signal) => oidcApi.identities(signal), [])
  const [target, setTarget] = useState<ExternalIdentity | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [linkBusy, setLinkBusy] = useState(false)
  const [error, setError] = useState('')

  const link = async () => {
    setError('')
    setLinkBusy(true)
    try {
      await beginOidc(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
      setLinkBusy(false)
    }
  }

  const unlink = async () => {
    if (!target) return
    setError('')
    setBusy(true)
    try {
      await oidcApi.unlink(target.id, password)
      toast.push(t('profile.unbound'), 'success')
      endSession()
      navigate('/login')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <div className="row-between">
        <h2 className="section-title">{t('profile.externalAccounts')}</h2>
        <Badge tone={identities.data?.length ? 'success' : 'default'}>{identities.data?.length ?? 0}</Badge>
      </div>
      <p className="muted">{t('profile.externalHint')}</p>
      {identities.loading ? <Skeleton height={100} /> : null}
      {identities.error ? <ErrorState message={errorMessage(identities.error)} onRetry={identities.reload} /> : null}
      {!identities.loading && !identities.error && identities.data ? (
        identities.data.length === 0 ? (
          <EmptyState title={t('profile.externalEmpty')} body={t('profile.externalEmptyHint')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('profile.externalIssuer')}</th>
                  <th>{t('profile.externalBoundAt')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {identities.data.map((identity) => (
                  <tr key={identity.id}>
                    <td className="mono" style={{ wordBreak: 'break-all' }}>{identity.issuer}</td>
                    <td className="nowrap">{formatDateTime(identity.createdAt)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setPassword('')
                          setError('')
                          setTarget(identity)
                        }}
                      >
                        {t('profile.unbindExternal')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {site.site?.oidcEnabled === 1 ? (
        <div className="row" style={{ marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Button loading={linkBusy} onClick={() => void link()}>
            {t('profile.bindExternal', { name: site.site.oidcName || t('auth.oidcFallback') })}
          </Button>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {t('profile.unbindPasswordHint')}
          </span>
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{t('profile.externalDisabled')}</p>
      )}
      {error && !target ? <p className="field__error" role="alert">{error}</p> : null}

      <Dialog
        open={target !== null}
        title={t('profile.unbindExternal')}
        onClose={() => !busy && setTarget(null)}
        footer={
          <>
            <Button onClick={() => setTarget(null)} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={busy} disabled={!password} onClick={() => void unlink()}>
              {t('profile.unbindExternal')}
            </Button>
          </>
        }
      >
        <p>{target ? t('profile.unbindConfirm', { issuer: target.issuer }) : ''}</p>
        <p className="muted">{t('profile.unbindSessionHint')}</p>
        <Field label={t('profile.currentPassword')} htmlFor="unbind-password">
          <TextInput
            id="unbind-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error ? <p className="field__error" role="alert">{error}</p> : null}
      </Dialog>
    </section>
  )
}
