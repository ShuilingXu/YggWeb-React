import { useState, type FormEvent } from 'react'
import * as auth from '../api/auth'
import { getAccount } from '../api/account'
import { errorMessage } from '../api/client'
import type { Account } from '../api/types'
import { validPassword } from '../lib/validation'
import { Button, Field, Notice } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './AuthPage.module.css'
const labels = { login: 'auth.login', register: 'auth.register', forgot: 'auth.forgot' } as const
export function AuthPage({
  mode,
  onAuthenticated,
  onNavigate,
}: {
  mode: 'login' | 'register' | 'forgot'
  onAuthenticated: (account: Account) => void
  onNavigate: (path: string) => void
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [field, setField] = useState<{ password?: string; confirm?: string }>({})
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget,
      data = new FormData(form),
      value = (name: string) => String(data.get(name) ?? '')
    setError('')
    setMessage('')
    setField({})
    if (mode === 'register' && !validPassword(value('password'))) {
      setField({ password: t('auth.passwordHelp') })
      form.querySelector<HTMLInputElement>('[name=password]')?.focus()
      return
    }
    if (mode === 'register' && value('password') !== value('confirm')) {
      setField({ confirm: t('auth.passwordMismatch') })
      form.querySelector<HTMLInputElement>('[name=confirm]')?.focus()
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await auth.login({ username: value('username'), password: value('password') })
        onAuthenticated(await getAccount())
      } else if (mode === 'register') {
        await auth.register({
          email: value('email'),
          password: value('password'),
          playerName: value('playerName'),
        })
        form.reset()
        setMessage(t('auth.registered'))
      } else {
        await auth.forgotPassword(value('email'))
        setMessage(t('auth.sent'))
      }
    } catch (cause) {
      setError(errorMessage(cause))
      form.querySelector('input')?.focus()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className={styles.box}>
      <a className={styles.logo} href="#/">
        {t('brand.name')}
      </a>
      <section className={`panel ${styles.card}`}>
        <p className={styles.intro}>{mode === 'login' ? t('auth.intro') : t(labels[mode])}</p>
        <form key={mode} className="stack" onSubmit={submit} onChange={() => setField({})}>
          {error && <Notice tone="error">{error}</Notice>}
          {message && <Notice tone="success">{message}</Notice>}
          {mode === 'login' ? (
            <Field label={t('auth.username')}>
              <input name="username" required autoComplete="username" maxLength={255} />
            </Field>
          ) : (
            <Field label={t('auth.email')}>
              <input name="email" type="email" required autoComplete="email" maxLength={255} />
            </Field>
          )}
          {mode === 'register' && (
            <Field label={t('auth.playerName')} help={t('auth.nameHelp')}>
              <input name="playerName" required pattern="[A-Za-z0-9_]{3,16}" maxLength={16} />
            </Field>
          )}
          {mode !== 'forgot' && (
            <Field
              label={t('auth.password')}
              error={field.password}
              help={mode === 'register' ? t('auth.passwordHelp') : undefined}
            >
              <input
                name="password"
                type="password"
                required
                maxLength={72}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Field>
          )}
          {mode === 'register' && (
            <Field label={t('auth.confirmPassword')} error={field.confirm}>
              <input
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                maxLength={72}
              />
            </Field>
          )}
          <Button disabled={busy}>{busy ? t('common.working') : t(labels[mode])}</Button>
        </form>
        <div className={styles.links}>
          {(['login', 'register', 'forgot'] as const)
            .filter((item) => item !== mode)
            .map((item) => (
              <button key={item} type="button" onClick={() => onNavigate('/auth/' + item)}>
                {t(labels[item])}
              </button>
            ))}
        </div>
        <small>{t('auth.sessionHelp')}</small>
      </section>
    </div>
  )
}
