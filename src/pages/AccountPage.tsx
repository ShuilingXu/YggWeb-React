import { useState } from 'react'
import {
  ACCOUNT_STATE,
  accountStateLabel,
  accountStateTone,
  PERMISSION,
  permissionLabel,
  permissionTone,
} from '../api/enums'
import {
  changeEmail,
  changePassword,
  deleteAccount,
  requestEmailVerification,
} from '../api/resources'
import { useAuth } from '../components/AuthProvider'
import { useSite } from '../components/SiteProvider'
import {
  Badge,
  Button,
  Dialog,
  Field,
  Notice,
  useToast,
} from '../components/UI'
import { t } from '../i18n/zh-CN'
import { formatDateTime } from '../lib/format'
import { href, navigate } from '../lib/router'
import { useSubmit } from '../lib/useAsync'
import { emailDomainAllowed, isValidEmail, isValidPassword } from '../lib/validate'
import { AuthorizedAppsPanel, ExternalIdentitiesPanel } from './AccountConnections'

export function AccountPage() {
  const auth = useAuth()
  const account = auth.account
  if (!account) return null

  const isOwner = account.permission >= PERMISSION.OWNER

  return (
    <div className="container">
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{t('account.title')}</h1>
            <p className="page__sub">{t('account.sub')}</p>
          </div>
          <div className="page__actions">
            <a className="mc-btn" href={href('/points')}>
              {t('nav.points')}
            </a>
            <a className="mc-btn" href={href('/players')}>
              {t('nav.players')}
            </a>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <span className="panel__title">{t('account.profile')}</span>
          </div>
          <div className="panel__body stack">
            <dl className="kv">
              <dt>{t('account.email')}</dt>
              <dd>{account.email}</dd>
              <dt>{t('account.state')}</dt>
              <dd>
                <Badge tone={accountStateTone(account.state)}>
                  {accountStateLabel(account.state)}
                </Badge>
              </dd>
              <dt>{t('account.permission')}</dt>
              <dd>
                <Badge tone={permissionTone(account.permission)}>
                  {permissionLabel(account.permission)}
                </Badge>
              </dd>
              <dt>{t('account.verified')}</dt>
              <dd className="row">
                <Badge tone={account.verified === 1 ? 'ok' : 'muted'}>
                  {account.verified === 1 ? t('account.verifiedYes') : t('account.verifiedNo')}
                </Badge>
                {account.verified === 0 ? <VerifyEmailButton /> : null}
              </dd>
              <dt>{t('account.created')}</dt>
              <dd>{formatDateTime(account.createdAt)}</dd>
              <dt>{t('account.uuid')}</dt>
              <dd className="mono">{account.id}</dd>
            </dl>
          </div>
        </div>

        <ChangePasswordPanel />
        <ChangeEmailPanel />
        <AuthorizedAppsPanel />
        <ExternalIdentitiesPanel />

        <div className="panel danger-zone">
          <div className="panel__head">
            <span className="panel__title">{t('account.danger')}</span>
          </div>
          <div className="panel__body stack">
            <p className="muted">{t('account.dangerDesc')}</p>
            {isOwner ? <Notice tone="warn">{t('account.ownerNoDelete')}</Notice> : null}
            <div className="row">
              <DeleteAccountButton disabled={isOwner} />
            </div>
          </div>
        </div>

        {account.state === ACCOUNT_STATE.BANNED ? (
          <Notice tone="danger">{t('enum.accountState.1')}</Notice>
        ) : null}
      </div>
    </div>
  )
}

function VerifyEmailButton() {
  const { notify } = useToast()
  const submit = useSubmit()
  return (
    <>
      <Button
        size="sm"
        disabled={submit.busy}
        onClick={() =>
          void submit.run(async () => {
            await requestEmailVerification()
            notify('ok', t('account.verificationSent'))
          })
        }
      >
        {submit.busy ? t('common.submitting') : t('account.sendVerification')}
      </Button>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </>
  )
}

function ChangePasswordPanel() {
  const auth = useAuth()
  const { notify } = useToast()
  const [password, setPassword] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = useSubmit()

  function submitForm(): void {
    if (!isValidPassword(next)) {
      setError(t('account.passwordLength'))
      return
    }
    if (next !== confirm) {
      setError(t('account.passwordMismatch'))
      return
    }
    setError(null)
    void submit.run(async () => {
      await changePassword(password, next)
      notify('ok', t('account.passwordChanged'))
      auth.endSession()
      navigate('/auth/login')
    })
  }

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault()
        submitForm()
      }}
    >
      <div className="panel__head">
        <span className="panel__title">{t('account.password')}</span>
      </div>
      <div className="panel__body stack">
        <p className="small dim">{t('account.passwordHint')}</p>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="grow">
            <Field label={t('account.currentPassword')} htmlFor="pw-current" required>
              <input
                id="pw-current"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          </div>
          <div className="grow">
            <Field label={t('account.newPassword')} htmlFor="pw-new" required>
              <input
                id="pw-new"
                className="input"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
            </Field>
          </div>
          <div className="grow">
            <Field label={t('account.confirmPassword')} htmlFor="pw-confirm" error={error}>
              <input
                id="pw-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </Field>
          </div>
        </div>
        {submit.error ? <Notice tone="danger">{submit.error}</Notice> : null}
        <div className="row row--end">
          <Button type="submit" variant="primary" disabled={submit.busy || !password}>
            {submit.busy ? t('common.submitting') : t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}

function ChangeEmailPanel() {
  const auth = useAuth()
  const site = useSite()
  const { notify } = useToast()
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = useSubmit()

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValidEmail(email.trim())) {
          setError(t('auth.emailInvalid'))
          return
        }
        const policy = site.site
        if (policy && !emailDomainAllowed(email.trim(), policy.emailMode, policy.emailDomains)) {
          setError(t('auth.emailDomainDenied'))
          return
        }
        setError(null)
        void submit.run(async () => {
          await changeEmail(password, email.trim())
          notify('ok', t('account.emailChanged'))
          auth.endSession()
          navigate('/auth/login')
        })
      }}
    >
      <div className="panel__head">
        <span className="panel__title">{t('account.emailSection')}</span>
      </div>
      <div className="panel__body stack">
        <p className="small dim">{t('account.emailHint')}</p>
        {site.site && site.site.emailMode !== 0 ? (
          <p className="small dim">
            {t('auth.emailPolicy', {
              mode: t(site.site.emailMode === 1 ? 'enum.emailMode.1' : 'enum.emailMode.2'),
              domains: site.site.emailDomains,
            })}
          </p>
        ) : null}
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="grow">
            <Field label={t('account.currentPassword')} htmlFor="email-password" required>
              <input
                id="email-password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          </div>
          <div className="grow">
            <Field label={t('account.newEmail')} htmlFor="email-new" error={error} required>
              <input
                id="email-new"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
          </div>
        </div>
        {submit.error ? <Notice tone="danger">{submit.error}</Notice> : null}
        <div className="row row--end">
          <Button type="submit" variant="primary" disabled={submit.busy || !password}>
            {submit.busy ? t('common.submitting') : t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}

function DeleteAccountButton({ disabled }: { disabled: boolean }) {
  const auth = useAuth()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const submit = useSubmit()

  return (
    <>
      <Button variant="danger" disabled={disabled} onClick={() => setOpen(true)}>
        {t('account.deleteAccount')}
      </Button>
      <Dialog
        open={open}
        title={t('account.deleteConfirmTitle')}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              disabled={submit.busy || !password}
              onClick={() =>
                void submit.run(async () => {
                  await deleteAccount(password)
                  auth.endSession()
                  notify('ok', t('account.deleted'))
                  navigate('/')
                })
              }
            >
              {submit.busy ? t('common.submitting') : t('account.deleteAccount')}
            </Button>
          </>
        }
      >
        <p>{t('account.deleteConfirmDesc')}</p>
        <Field label={t('account.currentPassword')} htmlFor="delete-password" required>
          <input
            id="delete-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {submit.error ? <span className="field__error">{submit.error}</span> : null}
      </Dialog>
    </>
  )
}
