import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { t } from '../i18n/zh-CN'
import { href, navigate, type Route } from '../lib/router'
import { useTheme } from '../lib/theme'
import { useAuth } from './AuthProvider'
import {
  IconAccount,
  IconAdmin,
  IconCloset,
  IconClose,
  IconHome,
  IconLibrary,
  IconMenu,
  IconMoon,
  IconPlayer,
  IconSun,
  IconUpload,
} from './icons'
import { Button, CopyButton, Spinner, buttonClass, useToast } from './ui'

type NavItem = {
  path: string
  label: string
  icon: ReactNode
  active: (route: Route) => boolean
}

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const auth = useAuth()
  const { theme, toggle } = useTheme()
  const { notify } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [route])

  const items = useMemo<NavItem[]>(() => {
    const list: NavItem[] = [
      {
        path: '/',
        label: t('nav.home'),
        icon: <IconHome />,
        active: (current) => current.name === 'home',
      },
      {
        path: '/skinlib',
        label: t('nav.library'),
        icon: <IconLibrary />,
        active: (current) => current.name === 'library' || current.name === 'texture',
      },
      {
        path: '/upload',
        label: t('nav.upload'),
        icon: <IconUpload />,
        active: (current) => current.name === 'upload',
      },
    ]
    if (auth.loggedIn) {
      list.push(
        {
          path: '/closet',
          label: t('nav.closet'),
          icon: <IconCloset />,
          active: (current) => current.name === 'closet',
        },
        {
          path: '/players',
          label: t('nav.players'),
          icon: <IconPlayer />,
          active: (current) => current.name === 'players',
        },
        {
          path: '/account',
          label: t('nav.account'),
          icon: <IconAccount />,
          active: (current) => current.name === 'account',
        },
      )
    }
    if (auth.isAdmin) {
      list.push({
        path: '/admin',
        label: t('nav.admin'),
        icon: <IconAdmin />,
        active: (current) => current.name === 'admin',
      })
    }
    return list
  }, [auth.loggedIn, auth.isAdmin])

  async function handleLogout() {
    await auth.logout()
    notify('ok', t('auth.loggedOut'))
    navigate('/')
  }

  const authActions = auth.loggedIn ? (
    <>
      <a className="topbar__user hide-sm" href={href('/account')} title={auth.account?.email}>
        {auth.account?.email}
      </a>
      <Button size="sm" variant="ghost" onClick={handleLogout}>
        {t('nav.logout')}
      </Button>
    </>
  ) : (
    <>
      <a className={buttonClass('ghost', 'sm')} href={href('/auth/login')}>
        {t('nav.login')}
      </a>
      <a className={buttonClass('primary', 'sm')} href={href('/auth/register')}>
        {t('nav.register')}
      </a>
    </>
  )

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <a className="brand" href={href('/')}>
            <span className="brand__logo" aria-hidden="true" />
            <span className="brand__name">{t('site.name')}</span>
            <span className="brand__tag hide-sm">{t('site.tag')}</span>
          </a>
          <nav className="nav hide-sm" aria-label={t('nav.home')}>
            {items.map((item) => (
              <a
                key={item.path}
                className="nav__link"
                href={href(item.path)}
                aria-current={item.active(route) ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="topbar__actions">
            <span className="row hide-sm">{auth.restoring ? <Spinner /> : authActions}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={toggle}
              aria-label={t('nav.theme')}
              title={theme === 'dark' ? t('nav.theme') : t('nav.theme')}
            >
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            <button
              type="button"
              className="icon-btn nav-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
              aria-expanded={menuOpen}
              aria-controls="nav-drawer"
            >
              {menuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
            </button>
          </div>
        </div>
        <div className="nav-drawer" id="nav-drawer" data-open={menuOpen}>
          {items.map((item) => (
            <a
              key={item.path}
              className="nav__link"
              href={href(item.path)}
              aria-current={item.active(route) ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
          <div className="divider" />
          {auth.loggedIn ? <span className="topbar__user">{auth.account?.email}</span> : null}
          <div className="row">{authActions}</div>
        </div>
      </header>

      <main className="shell__main">{children}</main>

      <footer className="footer">
        <div className="container footer__inner">
          <span className="row">
            <span>{t('footer.api')}</span>
            <code>{window.location.origin}</code>
            <CopyButton value={window.location.origin} label={t('home.api.copy')} />
          </span>
          <span>{t('footer.source')}</span>
        </div>
      </footer>
    </div>
  )
}
