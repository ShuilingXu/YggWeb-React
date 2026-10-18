import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/resources'
import { getToken, setToken } from '../api/client'
import type { Account } from '../api/types'
import { navigate } from './router'
import { t } from '../i18n/zh-CN'

const AuthContext = createContext<{ account: Account | null
  restoring: boolean
  error: string
  restore: () => void
  login: (token: string, signal?: AbortSignal) => Promise<void>
  clear: () => void }>(null!)
export const useAuth = () => useContext(AuthContext)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [restoring, setRestoring] = useState(!!getToken())
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const clear = () => { setToken('')
    setAccount(null) }
  useEffect(() => {
    const controller = new AbortController()
    if (getToken()) {
      setRestoring(true)
        setError('')
      api.account(controller.signal).then(setAccount).catch(error => { if (!controller.signal.aborted && getToken()) setError(error.message) }).finally(() => { if (!controller.signal.aborted) setRestoring(false) })
    }
    const expired = () => { clear()
      navigate('/login') }
    window.addEventListener('ygg:expired', expired)
    return () => { controller.abort()
      window.removeEventListener('ygg:expired', expired) }
  }, [revision])
  return <AuthContext value={{ account, restoring, error, restore: () => setRevision(value => value + 1), clear, login: async (token, signal) => { setToken(token)
    try { setAccount(await api.account(signal)) } catch (error) { clear()
    throw error } } }}>{restoring ? <div className="empty-state" role="status">{t('restoring')}</div> : children}</AuthContext>
}
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (auth.restoring) return <div className="empty-state" role="status">{t('restoring')}</div>
  if (!auth.account) return <div className="empty-state"><h2>{t('loginRequired')}</h2><p>{t('loginRequiredText')}</p><a className="button button-primary" href={`#/login?next=${encodeURIComponent(location.hash.slice(1))}`}>{t('login')}</a></div>
  return children
}
