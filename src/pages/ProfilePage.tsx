import { useState } from 'react'
import { ApiError } from '../api/client'
import { accountApi, authApi } from '../api/resources'
import { Permission } from '../api/enums'
import { useAuth } from '../lib/auth'
import { Link, navigate } from '../lib/router'
import { formatDateTime } from '../lib/format'
import { emailDomainAllowed, isValidPassword } from '../lib/validate'
import { useSite } from '../components/SiteProvider'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { Badge, Button, ConfirmDialog, Field, TextInput, useToast } from '../components/ui'
import { AuthorizedAppsPanel, ExternalIdentitiesPanel } from './ProfileConnections'

export function ProfilePage() {
  const { status, account, logout } = useAuth()
  const site = useSite()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [emailError, setEmailError] = useState('')
  const [emailForm, setEmailForm] = useState({ password: '', email: '' })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [verifyBusy, setVerifyBusy] = useState(false)

  if (status !== 'authenticated' || !account) {
    return (
      <>
        <PageHeader title={t('profile.title')} />
        <div className="notice">
          {t('upload.needLogin')} <Link to={`/login?next=${encodeURIComponent('/profile')}`}>{t('nav.login')}</Link>
        </div>
      </>
    )
  }

  const permissionLabel =
    account.permission === Permission.Owner
      ? t('common.permissionOwner')
      : account.permission === Permission.Admin
        ? t('common.permissionAdmin')
        : t('common.permissionUser')

  const handlePassword = async () => {
    setPasswordError('')
    if (!isValidPassword(passwordForm.next)) {
      setPasswordError(t('profile.invalidNewPassword'))
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      await accountApi.changePassword(passwordForm.current, passwordForm.next)
      toast.push(t('profile.passwordChanged'), 'success')
      await logout()
      navigate('/login')
    } catch (caught) {
      setPasswordError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  const handleEmail = async () => {
    setEmailError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email.trim())) {
      setEmailError(t('auth.invalidEmail'))
      return
    }
    if (site.site && !emailDomainAllowed(emailForm.email.trim(), site.site.emailMode, site.site.emailDomains)) {
      setEmailError(t('auth.emailDomainDenied'))
      return
    }
    setBusy(true)
    try {
      await accountApi.changeEmail(emailForm.password, emailForm.email.trim().toLowerCase())
      toast.push(t('profile.emailChanged'), 'success')
      await logout()
      navigate('/login')
    } catch (caught) {
      setEmailError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        actions={
          <Link to="/points" className="btn btn--sm">
            {t('profile.points')}
          </Link>
        }
      />

      <div className="stack">
        <section className="card">
          <h2 className="section-title">{t('profile.account')}</h2>
          <dl className="def-list">
            <div>
              <dt>{t('profile.accountId')}</dt>
              <dd className="mono">{account.id}</dd>
            </div>
            <div>
              <dt>{t('profile.email')}</dt>
              <dd>{account.email}</dd>
            </div>
            <div>
              <dt>{t('profile.verified')}</dt>
              <dd>
                <Badge tone={account.verified === 1 ? 'success' : 'warning'}>
                  {account.verified === 1 ? t('profile.verifiedYes') : t('profile.verifiedNo')}
                </Badge>
              </dd>
            </div>
            <div>
              <dt>{t('profile.permission')}</dt>
              <dd>
                <Badge tone={account.permission >= 1 ? 'accent' : 'default'}>{permissionLabel}</Badge>
              </dd>
            </div>
            <div>
              <dt>{t('profile.createdAt')}</dt>
              <dd>{formatDateTime(account.createdAt)}</dd>
            </div>
          </dl>
          {account.verified === 1 ? null : (
            <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--space-4)' }}>
              <Button
                size="sm"
                loading={verifyBusy}
                onClick={async () => {
                  setVerifyBusy(true)
                  try {
                    await authApi.resendVerification()
                    toast.push(t('profile.verificationSent'), 'success')
                  } catch (caught) {
                    const message =
                      caught instanceof ApiError && caught.status === 503
                        ? t('auth.mailUnavailable')
                        : caught instanceof ApiError
                          ? caught.message
                          : t('common.errorGeneric')
                    toast.push(message, 'error')
                  } finally {
                    setVerifyBusy(false)
                  }
                }}
              >
                {t('profile.sendVerification')}
              </Button>
            </div>
          )}
        </section>

        <section className="card form-grid">
          <h2 className="section-title">{t('profile.changePassword')}</h2>
          <Field label={t('profile.currentPassword')} htmlFor="profile-current">
            <TextInput
              id="profile-current"
              type="password"
              autoComplete="current-password"
              value={passwordForm.current}
              onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })}
            />
          </Field>
          <Field label={t('profile.newPassword')} htmlFor="profile-next" hint={t('auth.passwordHint')}>
            <TextInput
              id="profile-next"
              type="password"
              autoComplete="new-password"
              value={passwordForm.next}
              onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })}
            />
          </Field>
          <Field label={t('profile.confirmPassword')} htmlFor="profile-confirm" error={passwordError}>
            <TextInput
              id="profile-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirm}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })}
            />
          </Field>
          <div className="form-actions">
            <Button variant="primary" loading={busy} onClick={() => void handlePassword()}>
              {t('common.save')}
            </Button>
          </div>
        </section>

        <section className="card form-grid">
          <h2 className="section-title">{t('profile.changeEmail')}</h2>
          <Field label={t('profile.currentPassword')} htmlFor="profile-email-password">
            <TextInput
              id="profile-email-password"
              type="password"
              autoComplete="current-password"
              value={emailForm.password}
              onChange={(event) => setEmailForm({ ...emailForm, password: event.target.value })}
            />
          </Field>
          <Field label={t('profile.newEmail')} htmlFor="profile-email" error={emailError}>
            <TextInput
              id="profile-email"
              type="email"
              inputMode="email"
              value={emailForm.email}
              onChange={(event) => setEmailForm({ ...emailForm, email: event.target.value })}
            />
          </Field>
          {site.site && site.site.emailMode !== 0 ? (
            <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
              {t('auth.emailPolicy', {
                mode:
                  site.site.emailMode === 1 ? t('admin.site.modeAllow') : t('admin.site.modeDeny'),
                domains: site.site.emailDomains,
              })}
            </p>
          ) : null}
          <div className="form-actions">
            <Button variant="primary" loading={busy} onClick={() => void handleEmail()}>
              {t('common.save')}
            </Button>
          </div>
        </section>

        <AuthorizedAppsPanel />
        <ExternalIdentitiesPanel />

        <section className="card card--danger form-grid">
          <h2 className="section-title">{t('profile.dangerZone')}</h2>
          <p>{t('profile.deleteAccountBody')}</p>
          <div className="form-actions">
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              {t('profile.deleteAccount')}
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={t('profile.deleteAccount')}
        body={t('profile.deleteAccountBody')}
        confirmLabel={t('profile.deleteAccount')}
        danger
        loading={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!deletePassword) {
            toast.push(t('profile.passwordRequired'), 'error')
            return
          }
          setBusy(true)
          try {
            await accountApi.deleteAccount(deletePassword)
            toast.push(t('profile.deleted'), 'success')
            await logout()
            navigate('/')
          } catch (caught) {
            toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
          } finally {
            setBusy(false)
            setDeleteOpen(false)
            setDeletePassword('')
          }
        }}
      >
        <Field label={t('profile.deleteAccountConfirm')} htmlFor="delete-password">
          <TextInput
            id="delete-password"
            type="password"
            autoComplete="current-password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </>
  )
}
