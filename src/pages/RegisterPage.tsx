import { useState, type FormEvent } from 'react'
import { Link, navigate } from '../lib/router'
import { ApiError } from '../api/client'
import { authApi } from '../api/resources'
import { t } from '../i18n'
import { Button, Field, TextInput, useToast } from '../components/ui'

const playerPattern = /^[A-Za-z0-9_]{3,16}$/

export function RegisterPage() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t('auth.invalidEmail')
    if (password.length < 8) next.password = t('auth.passwordTooShort')
    if (password !== confirm) next.confirm = t('auth.passwordMismatch')
    if (!playerPattern.test(playerName.trim())) next.playerName = t('auth.invalidPlayerName')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      await authApi.register(email.trim().toLowerCase(), password, playerName.trim())
      toast.push(t('auth.registered'), 'success')
      navigate('/login')
    } catch (caught) {
      if (caught instanceof ApiError) {
        const message =
          caught.status === 409
            ? t('common.errorConflict')
            : caught.status === 429
              ? t('common.errorTooMany')
              : caught.message
        setErrors({ form: message })
      } else {
        setErrors({ form: t('common.errorGeneric') })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-layout">
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>{t('auth.registerTitle')}</h1>
        <p className="muted" style={{ marginTop: 'var(--space-3)', maxWidth: '44ch' }}>
          {t('auth.registerSubtitle')}
        </p>
      </div>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>{t('auth.registerTitle')}</h1>
        <p className="auth-card__sub">{t('auth.registerSubtitle')}</p>
        <Field label={t('auth.email')} htmlFor="register-email" error={errors.email}>
          <TextInput
            id="register-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label={t('auth.password')} htmlFor="register-password" hint={t('auth.passwordHint')} error={errors.password}>
          <TextInput
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Field label={t('auth.passwordConfirm')} htmlFor="register-confirm" error={errors.confirm}>
          <TextInput
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            invalid={Boolean(errors.confirm)}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </Field>
        <Field label={t('auth.playerName')} htmlFor="register-player" hint={t('auth.playerNameHint')} error={errors.playerName}>
          <TextInput
            id="register-player"
            value={playerName}
            invalid={Boolean(errors.playerName)}
            onChange={(event) => setPlayerName(event.target.value)}
            required
          />
        </Field>
        {errors.form ? (
          <p className="field__error" role="alert">
            {errors.form}
          </p>
        ) : null}
        <Button type="submit" variant="primary" block loading={busy}>
          {t('auth.submitRegister')}
        </Button>
        <div className="auth-card__links">
          <Link to="/login">{t('auth.toLogin')}</Link>
        </div>
      </form>
    </div>
  )
}
