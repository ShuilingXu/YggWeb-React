import { Component, useEffect, useState, type ReactNode } from 'react'
import { clearAccessToken, errorMessage, subscribeAuthExpired } from './api/client'
import { logout } from './api/auth'
import type { Account } from './api/types'
import { Button, EmptyState, Notice } from './components/UI'
import {
  MenuIcon,
  ThemeIcon,
  UserIcon,
  PlayersIcon,
  ClosetIcon,
  GalleryIcon,
  UploadIcon,
  SettingsIcon,
  ReportIcon,
  AuditIcon,
} from './components/Icons'
import { HomePage } from './pages/HomePage'
import { AuthPage } from './pages/AuthPage'
import { AccountPage } from './pages/AccountPage'
import { PlayersPage } from './pages/PlayersPage'
import { LibraryPage } from './pages/LibraryPage'
import { TexturePage } from './pages/TexturePage'
import { UploadPage } from './pages/UploadPage'
import { AdminPage } from './pages/AdminPage'
import { UserHomePage } from './pages/UserHomePage'
import { t } from './i18n/zh-CN'
import styles from './App.module.css'
class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    return this.state.error ? (
      <div className="panel stack">
        <h1>{t('common.error')}</h1>
        <Button onClick={() => location.reload()}>{t('common.retry')}</Button>
      </div>
    ) : (
      this.props.children
    )
  }
}
const navigate = (path: string) => {
  location.hash = path
}
const userLinks = [
  { href: '/user', key: 'nav.center', Icon: UserIcon },
  { href: '/user/closet', key: 'nav.closet', Icon: ClosetIcon },
  { href: '/user/player', key: 'nav.players', Icon: PlayersIcon },
  { href: '/user/profile', key: 'nav.account', Icon: SettingsIcon },
  { href: '/user/textures', key: 'nav.mine', Icon: GalleryIcon },
]
const adminLinks = [
  { href: '/admin/users', key: 'nav.users', Icon: PlayersIcon },
  { href: '/admin/reports', key: 'nav.reports', Icon: ReportIcon },
  { href: '/admin/audit', key: 'nav.audit', Icon: AuditIcon },
]
function Site() {
  const [hash, setHash] = useState(location.hash.slice(1) || '/')
  const [account, setAccount] = useState<Account | null>(null)
  const [menu, setMenu] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const change = () => {
      setHash(location.hash.slice(1) || '/')
      setMenu(false)
      setMessage('')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(
    () =>
      subscribeAuthExpired(() => {
        setAccount(null)
        navigate('/auth/login')
      }),
    [],
  )
  const [path = '/', search = ''] = hash.split('?')
  const sidebar = path.startsWith('/user') || path.startsWith('/admin')
  const home = path === '/'
  const needsLogin = !account && (sidebar || path === '/skinlib/upload')
  const auth = path.startsWith('/auth') || needsLogin
  const admin = path.startsWith('/admin')
  useEffect(() => {
    document.title = t('brand.name')
  }, [])
  async function exit() {
    try {
      await logout()
      clearAccessToken()
      setAccount(null)
      navigate('/auth/login')
    } catch (e) {
      setMessage(errorMessage(e))
    }
  }
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('ygg-bs-theme', next)
    } catch {
      /* 偏好存储不可用不影响切换。 */
    }
  }
  let page: ReactNode
  if (needsLogin)
    page = (
      <AuthPage key="required" mode="login" onNavigate={navigate} onAuthenticated={setAccount} />
    )
  else if (home) page = <HomePage signedIn={!!account} />
  else if (path === '/skinlib') page = <LibraryPage search={search} account={account} />
  else if (path === '/skinlib/upload')
    page = <UploadPage onUploaded={(id) => navigate('/skinlib/show/' + id)} />
  else if (path.startsWith('/skinlib/show/'))
    page = <TexturePage key={path} id={path.slice(14)} account={account} />
  else if (path === '/user') page = account && <UserHomePage account={account} />
  else if (path === '/user/closet' || path === '/user/textures')
    page = (
      <LibraryPage
        key={path}
        mode={path.endsWith('closet') ? 'closet' : 'mine'}
        search={search}
        account={account}
      />
    )
  else if (path === '/user/player') page = <PlayersPage />
  else if (path === '/user/profile' && account)
    page = (
      <AccountPage
        account={account}
        onLogout={() => {
          clearAccessToken()
          setAccount(null)
          navigate('/auth/login')
        }}
      />
    )
  else if (admin && account)
    page = (
      <AdminPage
        key={path}
        account={account}
        section={
          path.endsWith('/reports') ? 'reports' : path.endsWith('/audit') ? 'audit' : 'users'
        }
      />
    )
  else if (path.startsWith('/auth/'))
    page = (
      <AuthPage
        key={path}
        mode={path.endsWith('register') ? 'register' : path.endsWith('forgot') ? 'forgot' : 'login'}
        onNavigate={navigate}
        onAuthenticated={(a) => {
          setAccount(a)
          navigate('/user')
        }}
      />
    )
  else
    page = (
      <EmptyState
        title={t('notFound.title')}
        description={t('notFound.body')}
        action={<a href="#/skinlib">{t('nav.library')}</a>}
      />
    )
  if (auth)
    return (
      <div className={styles.authPage}>
        {message && <Notice tone="error">{message}</Notice>}
        {page}
      </div>
    )
  return (
    <div
      className={`${styles.app} ${sidebar ? styles.sidebarLayout : ''} ${home ? styles.homeLayout : ''} ${menu ? styles.menuOpen : ''}`}
    >
      <a
        className={styles.skip}
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        {t('common.skip')}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {sidebar ? (
            <button
              className={styles.navIcon}
              aria-label={t('nav.menu')}
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
            >
              <MenuIcon />
            </button>
          ) : (
            <a className={styles.brand} href="#/">
              {t('brand.name')}
            </a>
          )}
          {!sidebar && (
            <nav className={styles.publicNav}>
              <a href="#/skinlib">{t('nav.library')}</a>
              {account && <a href="#/user/closet">{t('nav.closet')}</a>}
            </nav>
          )}
          <div className={styles.rightNav}>
            {account && !sidebar && (
              <a href="#/skinlib/upload" className={styles.uploadLink}>
                <UploadIcon />
                <span>{t('nav.upload')}</span>
              </a>
            )}
            <button className={styles.navIcon} onClick={toggleTheme} aria-label={t('nav.theme')}>
              <ThemeIcon />
            </button>
            {account ? (
              <details className={styles.userMenu}>
                <summary>
                  <UserIcon />
                  <span>{account.email.split('@')[0]}</span>
                </summary>
                <div>
                  <a href="#/user">{t('nav.center')}</a>
                  <a href="#/user/profile">{t('nav.account')}</a>
                  {account.permission > 0 && <a href="#/admin/users">{t('nav.admin')}</a>}
                  <button onClick={exit}>{t('nav.logout')}</button>
                </div>
              </details>
            ) : (
              <a className={styles.anonymous} href="#/auth/login">
                <UserIcon />
                {t('nav.anonymous')}
              </a>
            )}
            {!sidebar && (
              <button
                className={`${styles.navIcon} ${styles.publicMenuButton}`}
                onClick={() => setMenu(!menu)}
                aria-label={t('nav.menu')}
              >
                <MenuIcon />
              </button>
            )}
          </div>
        </div>
        {menu && !sidebar && (
          <nav className={styles.mobileLinks}>
            <a href="#/skinlib">{t('nav.library')}</a>
            <a href="#/user">{t('nav.center')}</a>
            <a href="#/auth/login">{t('nav.login')}</a>
          </nav>
        )}
      </header>
      {sidebar && (
        <>
          <aside className={styles.sidebar}>
            <a className={styles.sideBrand} href="#/">
              {t('brand.name')}
            </a>
            <div className={styles.sideIdentity}>
              <span className={styles.avatar}>
                <UserIcon />
              </span>
              <span>{account?.email.split('@')[0]}</span>
            </div>
            <nav className={styles.sideNav}>
              <div className={styles.sideCaption}>{t(admin ? 'nav.admin' : 'nav.center')}</div>
              {(admin ? adminLinks : userLinks).map(({ href, key, Icon }) => (
                <a key={href} href={'#' + href} className={path === href ? styles.selected : ''}>
                  <Icon />
                  <span>{t(key)}</span>
                </a>
              ))}
              <div className={styles.sideCaption}>{t('nav.explore')}</div>
              <a href="#/skinlib">
                <GalleryIcon />
                <span>{t('nav.library')}</span>
              </a>
              <a href="#/skinlib/upload">
                <UploadIcon />
                <span>{t('nav.upload')}</span>
              </a>
              {admin ? (
                <a href="#/user">
                  <UserIcon />
                  <span>{t('nav.center')}</span>
                </a>
              ) : (
                account &&
                account.permission > 0 && (
                  <a href="#/admin/users">
                    <SettingsIcon />
                    <span>{t('nav.admin')}</span>
                  </a>
                )
              )}
            </nav>
          </aside>
          {menu && (
            <button
              className={styles.sidebarOverlay}
              aria-label={t('common.close')}
              onClick={() => setMenu(false)}
            />
          )}
        </>
      )}
      <main id="main" tabIndex={-1} className={styles.main}>
        {message && <Notice tone="error">{message}</Notice>}
        {page}
      </main>
      <footer className={styles.footer}>
        <strong>
          Copyright © {new Date().getFullYear()} <a href="#/">{t('brand.name')}</a>.
        </strong>
        <span>{t('footer.rights')}</span>
      </footer>
    </div>
  )
}
export function App() {
  return (
    <ErrorBoundary>
      <Site />
    </ErrorBoundary>
  )
}
