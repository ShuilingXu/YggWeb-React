import { useState, type FormEvent } from 'react'
import { api } from '../api/resources'
import { send } from '../api/client'
import { useAuth } from '../lib/auth'
import { useAction } from '../lib/useAction'
import { navigate } from '../lib/router'
import { passwordError, playerError } from '../lib/validate'
import { Button, Field, Tabs } from '../components/UI'
import { Icon } from '../components/Icons'
import { t } from '../i18n/zh-CN'

export function AuthPage({ mode, next = '/dashboard' }: { mode: 'login' | 'register' | 'forgot' | 'recovery'
  next?: string }) {
  const auth = useAuth()
  const action = useAction()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [recovery, setRecovery] = useState('verify-email')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const value = (key: string) => String(data.get(key) || '')
    const error: Record<string, string> = {}
    if (mode === 'register') { error.password = passwordError(value('password'))
      error.playerName = playerError(value('playerName'))
      if (value('confirmPassword') !== value('password')) error.confirmPassword = t('passwordMismatch') }
    if (mode === 'recovery' && recovery === 'reset-password') error.newPassword = passwordError(value('newPassword'))
    setErrors(error)
    if (Object.values(error).some(Boolean)) return
    void action.run(async signal => {
      if (mode === 'login') { const result = await api.login(value('username'), value('password'), signal)
        await auth.login(result.accessToken, signal)
        navigate(next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : '/dashboard') }
      else if (mode === 'register') { await api.register(value('email'), value('password'), value('playerName'), signal)
        navigate('/login') }
      else if (mode === 'forgot') await send('/api/auth/forgot-password', 'POST', { email: value('email') }, signal)
      else { await send(`/api/auth/${recovery}`, 'POST', { token: value('token'), ...(recovery === 'reset-password' ? { newPassword: value('newPassword') } : {}) }, signal)
        form.reset()
        if (recovery === 'reset-password') { auth.clear()
        navigate('/login') } }
    }, mode === 'register' ? t('registered') : mode === 'forgot' ? t('mailAccepted') : mode === 'recovery' ? t('success') : undefined)
  }
  return <div className="auth-layout"><section className="auth-story"><p className="eyebrow">{t('englishAdventure')}</p><div className="auth-cube"><span /></div><h1>{t('tagline')}</h1><p>{t('heroText')}</p><div className="auth-story-foot"><Icon name="shirt" />{t('about')}</div></section><section className="auth-panel"><p className="eyebrow">{t('englishAuth')}</p><h1>{t(mode === 'login' ? 'loginTitle' : mode === 'register' ? 'registerTitle' : mode === 'forgot' ? 'forgotTitle' : 'recovery')}</h1><p>{t(mode === 'login' ? 'loginSubtitle' : mode === 'register' ? 'registerSubtitle' : mode === 'forgot' ? 'forgotText' : 'recoveryHint')}</p>{mode === 'recovery' && <Tabs value={recovery} onChange={setRecovery} items={[{ value: 'verify-email', label: t('verifyEmail') }, { value: 'reset-password', label: t('resetPassword') }]} />}
      <form onSubmit={submit} className="stack">
        {mode === 'login' && <Field label={t('username')}><input name="username" autoComplete="username" required /></Field>}
        {(mode === 'register' || mode === 'forgot') && <Field label={t('email')}><input name="email" type="email" autoComplete="email" required /></Field>}
        {mode === 'register' && <Field label={t('playerName')} error={errors.playerName}><input name="playerName" minLength={3} maxLength={16} autoComplete="nickname" required /></Field>}
        {(mode === 'login' || mode === 'register') && <Field label={t('password')} error={errors.password}><input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></Field>}
        {mode === 'register' && <Field label={t('confirmPassword')} error={errors.confirmPassword}><input name="confirmPassword" type="password" autoComplete="new-password" required /></Field>}
        {mode === 'recovery' && <><Field label={t('recoveryToken')}><input name="token" autoComplete="off" required /></Field>{recovery === 'reset-password' && <Field label={t('newPassword')} error={errors.newPassword}><input name="newPassword" type="password" autoComplete="new-password" required /></Field>}</>}
        {action.error && <p className="field-error" role="alert">{action.error}</p>}
        <Button variant="primary" type="submit" busy={action.busy}>{t(mode === 'login' ? 'login' : mode === 'register' ? 'register' : mode === 'forgot' ? 'sendMail' : 'submit')}<Icon name="arrow" size={18} /></Button>
      </form><div className="auth-links">{mode === 'login' ? <><a href="#/forgot">{t('forgot')}</a><span>{t('needAccount')} <a href="#/register">{t('register')}</a></span></> : <a href="#/login">{t('haveAccount')} {t('login')}</a>}<a href="#/recovery">{t('recovery')}</a></div></section></div>
}
