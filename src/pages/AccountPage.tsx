import { useState, type FormEvent } from 'react'
import * as api from '../api/account'
import { errorMessage } from '../api/client'
import { AuthorizedAccounts } from './AuthorizationPage'
import type { Account, SiteSettings } from '../api/types'
import { validPassword, allowsEmailDomain } from '../lib/validation'
import { formatDate } from '../lib/format'
import { Button, Field, Notice, Dialog } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './AccountPage.module.css'
export function AccountPage({
  account,
  onLogout,
  site,
}: {
  account: Account
  onLogout: () => void
  site: SiteSettings | null
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [deleting, setDeleting] = useState(false),
    [passwordError, setPasswordError] = useState('')
  async function perform(action: () => Promise<unknown>, success: string, exit = false) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(success)
      if (exit) onLogout()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }
  function submit(event: FormEvent<HTMLFormElement>, kind: 'password' | 'email' | 'delete') {
    event.preventDefault()
    const data = new FormData(event.currentTarget),
      password = String(data.get('password') ?? ''),
      next = String(data.get('newPassword') ?? '')
    if (kind === 'password' && (!validPassword(next) || next !== data.get('confirm'))) {
      setPasswordError(t(!validPassword(next) ? 'auth.passwordHelp' : 'auth.passwordMismatch'))
      event.currentTarget.querySelector<HTMLInputElement>('[name=newPassword]')?.focus()
      return
    }
    if (kind === 'password')
      void perform(() => api.changePassword(password, next), t('account.relogin'), true)
    if (kind === 'email' && site && !allowsEmailDomain(String(data.get('email') ?? ''), site)) {
      setError(t('ops.domainRejected'))
      return
    }
    if (kind === 'email')
      void perform(
        () => api.changeEmail(password, String(data.get('email') ?? '')),
        t('account.relogin'),
        true,
      )
    if (kind === 'delete')
      void perform(() => api.deleteAccount(password), t('account.relogin'), true)
  }
  return (
    <div className="stack">
      <div className="page-heading">
        <h1>{t('account.title')}</h1>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <div className={styles.columns}>
        <div className="stack">
          <section className={`panel ${styles.card}`}>
            <header className={`${styles.header} ${styles.primary}`}>
              <h2>{t('account.title')}</h2>
            </header>
            <div className={`${styles.body} ${styles.profile}`}>
              <div className={styles.avatar} aria-hidden="true">
                {account.email.slice(0, 1).toUpperCase()}
              </div>
              <h3>{account.email}</h3>
              <dl className={styles.details}>
                <dt>{t('account.id')}</dt>
                <dd>
                  <code>{account.id}</code>
                </dd>
                <dt>{t('account.created')}</dt>
                <dd>{formatDate(account.createdAt)}</dd>
              </dl>
            </div>
          </section>
          <section className={`panel ${styles.card}`}>
            <header className={`${styles.header} ${styles.primary}`}>
              <h2>{t('account.verification')}</h2>
            </header>
            <div className={styles.body}>
              {t(account.verified ? 'account.verified' : 'account.unverified')}
            </div>
            {!account.verified && (
              <footer className={styles.footer}>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void perform(() => api.sendVerification(), t('account.verificationSent'))
                  }
                >
                  {t('account.sendVerification')}
                </Button>
              </footer>
            )}
          </section>
          <section className={`panel ${styles.card}`}>
            <header className={`${styles.header} ${styles.danger}`}>
              <h2>{t('account.danger')}</h2>
            </header>
            <div className={`${styles.body} stack`}>
              <p>{t('account.deleteHelp')}</p>
              {account.permission === 2 ? (
                <p>{t('account.ownerProtected')}</p>
              ) : (
                <div>
                  <Button variant="danger" onClick={() => setDeleting(true)}>
                    {t('account.danger')}
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="stack">
          <form className={`panel ${styles.card}`} onSubmit={(event) => submit(event, 'password')}>
            <header className={`${styles.header} ${styles.warning}`}>
              <h2>{t('account.changePassword')}</h2>
            </header>
            <div className={`${styles.body} stack`}>
              <Field label={t('account.currentPassword')}>
                <input name="password" type="password" autoComplete="current-password" required />
              </Field>
              <Field
                label={t('account.newPassword')}
                help={t('auth.passwordHelp')}
                error={passwordError}
              >
                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  maxLength={72}
                  required
                  onChange={() => setPasswordError('')}
                />
              </Field>
              <Field label={t('auth.confirmPassword')}>
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  maxLength={72}
                />
              </Field>
            </div>
            <footer className={styles.footer}>
              <Button disabled={busy}>
                {t(busy ? 'common.working' : 'account.changePassword')}
              </Button>
            </footer>
          </form>
          <form className={`panel ${styles.card}`} onSubmit={(event) => submit(event, 'email')}>
            <header className={`${styles.header} ${styles.warning}`}>
              <h2>{t('account.changeEmail')}</h2>
            </header>
            <div className={`${styles.body} stack`}>
              <Field
                label={t('account.newEmail')}
                help={
                  site?.emailMode
                    ? t('ops.domains', {
                        mode: t(site.emailMode === 1 ? 'ops.allow' : 'ops.deny'),
                        domains: site.emailDomains,
                      })
                    : undefined
                }
              >
                <input
                  name="email"
                  type="email"
                  defaultValue={account.email}
                  autoComplete="email"
                  maxLength={255}
                  required
                />
              </Field>
              <Field label={t('account.currentPassword')}>
                <input name="password" type="password" autoComplete="current-password" required />
              </Field>
            </div>
            <footer className={styles.footer}>
              <Button disabled={busy}>{t(busy ? 'common.working' : 'account.changeEmail')}</Button>
            </footer>
          </form>
          <Notice>{t('account.sessionWarning')}</Notice>
        </div>
      </div>
      <AuthorizedAccounts site={site} onLogout={onLogout} />
      <Dialog
        open={deleting}
        onClose={() => {
          if (!busy) setDeleting(false)
        }}
        title={t('account.danger')}
      >
        <form className="stack" onSubmit={(event) => submit(event, 'delete')}>
          <p>{t('account.deleteHelp')}</p>
          {error && <Notice tone="error">{error}</Notice>}
          <Field label={t('account.currentPassword')}>
            <input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <div className="actions">
            <Button variant="danger" disabled={busy}>
              {t('account.deleteConfirm')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setDeleting(false)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
