import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { Link, navigate, useRoute, useQueryParam } from '../lib/router'
import { ApiError } from '../api/client'
import { beginOidc } from '../lib/oidc'
import { useSite } from '../components/SiteProvider'
import { t } from '../i18n'
import { Button, Field, TextInput, useToast } from '../components/ui'

export function LoginPage() {
  const { login } = useAuth()
  const site = useSite()
  const toast = useToast()
  const route = useRoute()
  const redirect = useQueryParam(route, 'next') || '/'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [oidcBusy, setOidcBusy] = useState(false)
  const [oidcError, setOidcError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!identifier.trim()) {
      setError(t('auth.invalidIdentifier'))
      return
    }
    setBusy(true)
    try {
      await login(identifier.trim(), password)
      toast.push(t('auth.loginTitle'), 'success')
      navigate(redirect)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  const startOidc = async () => {
    setOidcError('')
    setOidcBusy(true)
    try {
      await beginOidc(false)
    } catch (caught) {
      setOidcError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
      setOidcBusy(false)
    }
  }

  return (
    <div className="auth-layout">
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>{site.site?.name || t('app.name')}</h1>
        <p className="muted" style={{ marginTop: 'var(--space-3)', maxWidth: '44ch' }}>
          {t('app.tagline')}。{t('home.description')}
        </p>
      </div>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>{t('auth.loginTitle')}</h1>
        <p className="auth-card__sub">{t('auth.loginSubtitle')}</p>
        <Field label={t('auth.identifier')} htmlFor="login-identifier" error={error && !identifier ? error : undefined}>
          <TextInput
            id="login-identifier"
            name="username"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </Field>
        <Field label={t('auth.password')} htmlFor="login-password">
          <TextInput
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primary" block loading={busy}>
          {t('auth.submitLogin')}
        </Button>
        <div className="auth-card__links">
          <Link to="/register">{t('auth.toRegister')}</Link>
          <Link to="/forgot">{t('auth.forgotLink')}</Link>
        </div>
        {site.site?.oidcEnabled === 1 ? (
          <div className="stack" style={{ marginTop: 'var(--space-4)' }}>
            <Button block loading={oidcBusy} onClick={() => void startOidc()}>
              {t('auth.oidcLogin', {
                name: site.site.oidcName || t('auth.oidcFallback'),
              })}
            </Button>
            {oidcError ? (
              <p className="field__error" role="alert">
                {oidcError}
              </p>
            ) : null}
            <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
              {t('auth.oidcHint')}
            </p>
          </div>
        ) : null}
      </form>
    </div>
  )
}
