import type { ReactNode } from 'react'
import { t } from '../i18n/zh-CN'
import { href } from '../lib/router'
import { useAuth } from './AuthProvider'
import { ErrorState, LoadingState, Notice } from './ui'

function GuardNotice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="container">
      <div className="page page--narrow">
        <Notice tone="warn">{title}</Notice>
        <div className="row">
          <a className="mc-btn mc-btn--primary" href={href('/auth/login')}>
            {t('nav.login')}
          </a>
          <a className="mc-btn" href={href('/auth/register')}>
            {t('nav.register')}
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}

/** 需要登录的页面统一在这里拦截，页面本身不再各写一份提示。 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (auth.restoring) {
    return (
      <div className="container">
        <div className="page">
          <LoadingState />
        </div>
      </div>
    )
  }
  if (!auth.loggedIn) return <GuardNotice title={t('auth.needLogin')} />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (!auth.loggedIn) return <GuardNotice title={t('auth.needLogin')} />
  if (!auth.isAdmin) {
    return (
      <div className="container">
        <div className="page page--narrow">
          <ErrorState message={t('error.403')} />
          <div className="row" style={{ justifyContent: 'center' }}>
            <a className="mc-btn" href={href('/')}>
              {t('common.back')}
            </a>
          </div>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
