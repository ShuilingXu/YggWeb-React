import { useState, type FormEvent } from 'react'
import { send } from '../api/client'
import { useAuth } from '../lib/auth'
import { useAction } from '../lib/useAction'
import { navigate } from '../lib/router'
import { passwordError } from '../lib/validate'
import { date } from '../lib/format'
import { permissionLabel } from '../api/enums'
import { Badge, Button, Dialog, Field } from '../components/UI'
import { t } from '../i18n/zh-CN'

export function AccountPage() {
  const auth = useAuth()
  const action = useAction()
  const [dialog, setDialog] = useState('')
  const [error, setError] = useState('')
  const account = auth.account!
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (dialog === 'password') {
      const error = passwordError(String(data.get('newPassword'))) || (data.get('newPassword') === data.get('confirmPassword') ? '' : t('passwordMismatch'))
      setError(error)
        if (error) return
    }
    void action.run(signal => send(`/api/account${dialog === 'delete' ? '' : '/' + dialog}`, dialog === 'delete' ? 'DELETE' : 'PUT', Object.fromEntries([...data.entries()].filter(([key]) => key !== 'confirmPassword')), signal), t('sessionRevoked'), () => { auth.clear()
      navigate('/login') })
  }
  return <><div className="page-heading"><div><p className="eyebrow">{t('englishSecurity')}</p><h1>{t('account')}</h1><p>{t('registeredAt', { date: date(account.createdAt) })}</p></div><Badge>{permissionLabel(account.permission)}</Badge></div><div className="account-layout"><section className="panel stack"><h2>{t('accountOverview')}</h2><dl><dt>{t('email')}</dt><dd>{account.email}</dd><dt>{t('verifyEmail')}</dt><dd><Badge tone={account.verified ? '' : 'gold'}>{t(account.verified ? 'verified' : 'unverified')}</Badge></dd><dt>{t('accountId')}</dt><dd className="mono">{account.id}</dd><dt>{t('createdAt')}</dt><dd>{date(account.createdAt)}</dd></dl>{!account.verified && <Button busy={action.busy} onClick={() => action.run(signal => send('/api/account/verification', 'POST', undefined, signal), t('mailAccepted'))}>{t('sendVerification')}</Button>}</section><section className="panel stack"><h2>{t('password')}</h2><p>{t('securityHint')}</p><Button onClick={() => { setError('')
    setDialog('password') }}>{t('changePassword')}</Button><Button onClick={() => { setError('')
    setDialog('email') }}>{t('changeEmail')}</Button></section>{account.permission !== 2 && <section className="panel danger-panel stack"><h2>{t('deleteAccount')}</h2><p>{t('deleteAccountHint')}</p><Button variant="danger" onClick={() => { setError('')
    setDialog('delete') }}>{t('deleteAccount')}</Button></section>}</div>{action.error && !dialog && <p role="alert" className="field-error">{action.error}</p>}
    {dialog && <Dialog title={t(dialog === 'password' ? 'changePassword' : dialog === 'email' ? 'changeEmail' : 'deleteAccount')} onClose={() => !action.busy && setDialog('')}><form className="stack" onSubmit={submit}>{dialog === 'delete' && <p>{t('deleteAccountHint')}</p>}<Field label={t('currentPassword')}><input type="password" name="password" autoComplete="current-password" required /></Field>{dialog === 'password' && <><Field label={t('newPassword')} error={error}><input type="password" name="newPassword" autoComplete="new-password" required /></Field><Field label={t('confirmPassword')}><input type="password" name="confirmPassword" autoComplete="new-password" required /></Field></>}{dialog === 'email' && <Field label={t('newEmail')}><input type="email" name="email" autoComplete="email" required /></Field>}{action.error && <p className="field-error" role="alert">{action.error}</p>}<div className="dialog-actions"><Button type="button" onClick={() => setDialog('')} disabled={action.busy}>{t('cancel')}</Button><Button type="submit" variant={dialog === 'delete' ? 'danger' : 'primary'} busy={action.busy}>{t('confirm')}</Button></div></form></Dialog>}</>
}
