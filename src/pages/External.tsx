import { useEffect, useState } from 'react'
import { api } from '../api/resources'
import { ApiError } from '../api/client'
import { useAuth } from '../lib/auth'
import { useAction } from '../lib/useAction'
import { useAsync } from '../lib/useAsync'
import { navigate } from '../lib/router'
import { Button, Dialog, ErrorState, Field, Skeleton } from '../components/UI'
import { t } from '../i18n/zh-CN'

export async function beginExternal(link: boolean, signal: AbortSignal) {
  const flow = await api.startExternal(link, signal)
  try { sessionStorage.setItem('ygg.oidc.state', flow.state)
    sessionStorage.setItem('ygg.oidc.link', String(link)) } catch { throw new Error(t('externalStorageError')) }
  window.location.assign(flow.url)
}

export function ExternalCallback({ params }: { params: URLSearchParams }) {
  const auth = useAuth()
  const [request] = useState(() => ({ state: params.get('state'), code: params.get('code'), error: params.get('error') }))
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    // 延后到有效挂载后再消费一次性 state，避免 StrictMode 的试挂载发起两次兑换。
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, '', `${location.pathname}#/oidc/callback`)
      let expected = '', link = false
      try { expected = sessionStorage.getItem('ygg.oidc.state') || ''
        link = sessionStorage.getItem('ygg.oidc.link') === 'true'
        sessionStorage.removeItem('ygg.oidc.state')
        sessionStorage.removeItem('ygg.oidc.link') } catch { setError(t('externalStorageError'))
        return }
      if (!request.code || !request.state || request.error || request.state !== expected) { setError(t('externalInvalid'))
        return }
      void api.completeExternal(request.state, request.code, controller.signal).then(async result => {
        await auth.login(result.accessToken, controller.signal)
        if (!controller.signal.aborted) navigate(link ? '/account' : '/dashboard')
      }).catch(failure => {
        if (!controller.signal.aborted) setError(failure instanceof ApiError && failure.status === 409 ? t('externalConflict') : failure instanceof Error ? failure.message : t('externalInvalid'))
      })
    }, 0)
    return () => { window.clearTimeout(timer)
      controller.abort() }
  }, [])
  return error ? <><ErrorState message={error} /><a href="#/login">{t('login')}</a></> : <section className="panel" role="status">{t('externalCompleting')}</section>
}

export function ExternalAccounts() {
  const auth = useAuth()
  const site = useAsync(api.site, [])
  const identities = useAsync(api.externalIdentities, [])
  const action = useAction()
  const [remove, setRemove] = useState('')
  return <section className="panel stack"><h2>{t('externalBinding')}</h2><p>{t('externalPasswordHint')}</p><a href="#/forgot">{t('setupPassword')}</a>{identities.loading ? <Skeleton /> : identities.error ? <ErrorState message={identities.error} retry={identities.reload} /> : !identities.value?.length ? <p>{t('noExternalAccounts')}</p> : identities.value.map(identity => <div key={identity.id}><p className="mono">{identity.issuer}</p><Button onClick={() => setRemove(identity.id)}>{t('externalUnbind')}</Button></div>)}{site.value?.oidcEnabled === 1 && <Button busy={action.busy} onClick={() => action.run(signal => beginExternal(true, signal))}>{t('linkExternal')}</Button>}{action.error && !remove && <p className="field-error" role="alert">{action.error}</p>}{remove && <Dialog title={t('externalUnbind')} onClose={() => !action.busy && setRemove('')}><form className="stack" onSubmit={e => { e.preventDefault()
    const password = String(new FormData(e.currentTarget).get('password'))
    void action.run(signal => api.removeExternal(remove, password, signal), t('sessionRevoked'), () => { auth.clear()
      navigate('/login') }) }}><p>{t('externalUnbindHint')}</p><Field label={t('currentPassword')}><input type="password" name="password" autoComplete="current-password" required /></Field>{action.error && <p className="field-error" role="alert">{action.error}</p>}<Button type="submit" busy={action.busy}>{t('confirm')}</Button></form></Dialog>}</section>
}
