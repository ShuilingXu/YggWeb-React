import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { Link, navigate } from '../lib/router'
import { useTheme } from '../lib/theme'
import { t } from '../i18n'
import { useToast } from './ui'
import { MoonIcon, SunIcon } from './icons'

type NavItem = { to: string; label: string; exact?: boolean; optional?: boolean }

export function AppShell({ path, children }: { path: string; children: ReactNode }) {
  const { status, account, logout, isAdmin } = useAuth()
  const { theme, toggle } = useTheme()
  const toast = useToast()

  useEffect(() => {
    const titleMap: [string, string][] = [
      ['/library', t('library.title')],
      ['/upload', t('upload.title')],
      ['/closet', t('closet.title')],
      ['/players', t('players.title')],
      ['/profile', t('profile.title')],
      ['/admin', t('admin.title')],
      ['/login', t('auth.loginTitle')],
      ['/register', t('auth.registerTitle')],
      ['/forgot', t('auth.forgotTitle')],
    ]
    const match = titleMap.find(([prefix]) => path.startsWith(prefix))
    document.title = match ? `${match[1]} · ${t('app.name')}` : t('app.name')
  }, [path])

  const nav: NavItem[] = [
    { to: '/', label: t('nav.home'), exact: true },
    { to: '/library', label: t('nav.library') },
  ]
  if (status === 'authenticated') {
    nav.push({ to: '/closet', label: t('nav.closet') }, { to: '/players', label: t('nav.players') })
  } else {
    nav.push({ to: '/upload', label: t('upload.title'), optional: true })
  }
  if (isAdmin) nav.push({ to: '/admin', label: t('nav.admin') })

  const isActive = (item: NavItem) => (item.exact ? path === item.to : path === item.to || path.startsWith(`${item.to}/`))

  const handleLogout = async () => {
    await logout()
    toast.push(t('nav.logout'), 'info')
    navigate('/')
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        {t('app.skipToContent')}
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="brand" aria-label={t('app.name')}>
            <span className="brand__mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            Ygg
          </Link>
          <nav className="site-nav" aria-label={t('nav.home')}>
            {nav.map((item) => (
              <a
                key={item.to}
                href={`#${item.to}`}
                aria-current={isActive(item) ? 'page' : undefined}
                className={item.optional ? 'site-nav__optional' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="site-header__actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggle}
              aria-label={t('nav.theme')}
              aria-pressed={theme === 'dark'}
              title={theme === 'dark' ? t('theme.dark') : t('theme.light')}
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </button>
            {status === 'authenticated' ? (
              <>
                <Link to="/profile" className="btn btn--ghost btn--sm" title={account.email}>
                  {account.email.split('@')[0] ?? account.email}
                </Link>
                <button type="button" className="btn btn--sm" onClick={handleLogout}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn--primary btn--sm">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="page" id="main" tabIndex={-1}>
        <div className="container">{children}</div>
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <span>
            {t('app.name')} · {t('app.tagline')}
          </span>
          <span className="mono">YggServer-Go · Yggdrasil</span>
        </div>
      </footer>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  )
}
