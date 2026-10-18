import { useState, type FormEvent } from 'react'
import { Link } from '../lib/router'
import { ApiError } from '../api/client'
import { authApi } from '../api/resources'
import { t } from '../i18n'
import { Button, Field, TextInput } from '../components/ui'

export function ForgotPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.invalidEmail'))
      return
    }
    setBusy(true)
    try {
      await authApi.forgotPassword(email.trim().toLowerCase())
      setMessage(t('auth.forgotSent'))
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.status === 503 ? t('auth.mailUnavailable') : caught.message)
      } else {
        setError(t('common.errorGeneric'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-layout">
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>{t('auth.forgotTitle')}</h1>
        <p className="muted" style={{ marginTop: 'var(--space-3)', maxWidth: '44ch' }}>
          {t('auth.forgotSubtitle')}
        </p>
      </div>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>{t('auth.forgotTitle')}</h1>
        <p className="auth-card__sub">{t('auth.forgotSubtitle')}</p>
        <Field label={t('auth.email')} htmlFor="forgot-email" error={error}>
          <TextInput
            id="forgot-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            invalid={Boolean(error)}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        {message ? (
          <p className="notice" role="status">
            {message}
          </p>
        ) : null}
        <Button type="submit" variant="primary" block loading={busy}>
          {t('auth.submitForgot')}
        </Button>
        <div className="auth-card__links">
          <Link to="/login">{t('auth.toLogin')}</Link>
        </div>
      </form>
    </div>
  )
}
