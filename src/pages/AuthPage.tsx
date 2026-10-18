import { useEffect, useState } from 'react'
import { requestPasswordReset, register } from '../api/resources'
import { useAuth } from '../components/AuthProvider'
import { Button, Field, Notice, useToast } from '../components/ui'
import { t } from '../i18n/zh-CN'
import { href, navigate } from '../lib/router'
import { useSubmit } from '../lib/useAsync'
import { isValidEmail, isValidPassword, isValidPlayerName } from '../lib/validate'

function AuthPanel({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="container">
      <div className="auth">
        <div className="panel auth__panel">
          <div className="panel__head">
            <span className="panel__title">{title}</span>
            <span className="brand__logo" aria-hidden="true" />
          </div>
          <div className="panel__body stack">
            {description ? <p className="small dim">{description}</p> : null}
            {children}
            {footer ? <div className="auth__switch">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const auth = useAuth()
  const { notify } = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const submit = useSubmit()

  useEffect(() => {
    if (auth.loggedIn) navigate('/', { replace: true })
  }, [auth.loggedIn])

  return (
    <AuthPanel
      title={t('auth.login')}
      footer={
        <>
          <a href={href('/auth/register')}>{t('auth.toRegister')}</a>
          <a href={href('/auth/forgot')}>{t('auth.forgot')}</a>
        </>
      }
    >
      <form
        className="auth__form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!identifier.trim() || !password) return
          void submit.run(async () => {
            await auth.login(identifier.trim(), password)
            notify('ok', t('auth.loginSuccess'))
            navigate('/', { replace: true })
          })
        }}
      >
        <Field label={t('auth.identifier')} htmlFor="login-identifier" required>
          <input
            id="login-identifier"
            className="input"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </Field>
        <Field label={t('auth.password')} htmlFor="login-password" required>
          <input
            id="login-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {submit.error ? <Notice tone="danger">{submit.error}</Notice> : null}
        <Button type="submit" variant="primary" block disabled={submit.busy}>
          {submit.busy ? t('common.submitting') : t('auth.submitLogin')}
        </Button>
      </form>
    </AuthPanel>
  )
}

export function RegisterPage() {
  const { notify } = useToast()
  const [email, setEmail] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ email?: string; playerName?: string; password?: string }>({})
  const submit = useSubmit()

  function validate(): boolean {
    const next: typeof errors = {}
    if (!isValidEmail(email.trim())) next.email = t('auth.emailInvalid')
    if (!isValidPlayerName(playerName.trim())) next.playerName = t('players.nameRequired')
    if (!isValidPassword(password)) next.password = t('account.passwordLength')
    else if (password !== confirm) next.password = t('account.passwordMismatch')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  return (
    <AuthPanel
      title={t('auth.register')}
      description={t('auth.registerHint')}
      footer={
        <>
          <a href={href('/auth/login')}>{t('auth.toLogin')}</a>
          <a href={href('/auth/forgot')}>{t('auth.forgot')}</a>
        </>
      }
    >
      <form
        className="auth__form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!validate()) return
          void submit.run(async () => {
            await register(email.trim(), password, playerName.trim())
            notify('ok', t('auth.registerSuccess'))
            navigate('/auth/login')
          })
        }}
      >
        <Field label={t('auth.email')} htmlFor="register-email" error={errors.email} required>
          <input
            id="register-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field
          label={t('auth.playerName')}
          htmlFor="register-player"
          hint={t('players.nameHint')}
          error={errors.playerName}
          required
        >
          <input
            id="register-player"
            className="input"
            maxLength={16}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </Field>
        <Field label={t('auth.password')} htmlFor="register-password" error={errors.password} required>
          <input
            id="register-password"
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label={t('auth.passwordConfirm')} htmlFor="register-confirm" required>
          <input
            id="register-confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
        {submit.error ? <Notice tone="danger">{submit.error}</Notice> : null}
        <Button type="submit" variant="primary" block disabled={submit.busy}>
          {submit.busy ? t('common.submitting') : t('auth.submitRegister')}
        </Button>
      </form>
    </AuthPanel>
  )
}

export function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = useSubmit()

  return (
    <AuthPanel
      title={t('auth.forgotTitle')}
      description={t('auth.forgotDesc')}
      footer={<a href={href('/auth/login')}>{t('auth.toLogin')}</a>}
    >
      {sent ? (
        <Notice>{t('auth.forgotSent')}</Notice>
      ) : (
        <form
          className="auth__form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!isValidEmail(email.trim())) {
              setError(t('auth.emailInvalid'))
              return
            }
            setError(null)
            void submit.run(async () => {
              await requestPasswordReset(email.trim())
              setSent(true)
            })
          }}
        >
          <Field label={t('auth.email')} htmlFor="forgot-email" error={error} required>
            <input
              id="forgot-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          {submit.error ? <Notice tone="danger">{submit.error}</Notice> : null}
          <Button type="submit" variant="primary" block disabled={submit.busy}>
            {submit.busy ? t('common.submitting') : t('auth.forgotSubmit')}
          </Button>
        </form>
      )}
      <p className="small dim">{t('auth.resetHint')}</p>
    </AuthPanel>
  )
}
