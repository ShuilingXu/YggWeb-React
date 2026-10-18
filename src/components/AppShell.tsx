import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { api } from '../api/resources'
import { useAction } from '../lib/useAction'
import { useAsync } from '../lib/useAsync'
import { request } from '../api/client'
import { Icon, type IconName } from './Icons'
import { Button, ErrorState } from './UI'
import { t, type MessageKey } from '../i18n/zh-CN'
import { navigate } from '../lib/router'

const links: { path: string
  label: MessageKey
  icon: IconName
  group: MessageKey }[] = [
  { path: '/', label: 'home', icon: 'home', group: 'explore' },
  { path: '/library', label: 'library', icon: 'grid', group: 'explore' },
  { path: '/guide', label: 'guide', icon: 'book', group: 'explore' },
  { path: '/dashboard', label: 'dashboard', icon: 'home', group: 'personal' },
  { path: '/closet', label: 'closet', icon: 'box', group: 'personal' },
  { path: '/players', label: 'players', icon: 'user', group: 'personal' },
  { path: '/uploads', label: 'uploads', icon: 'upload', group: 'personal' },
  { path: '/account', label: 'account', icon: 'settings', group: 'personal' },
  { path: '/admin/users', label: 'users', icon: 'users', group: 'management' },
  { path: '/admin/reports', label: 'reports', icon: 'flag', group: 'management' },
  { path: '/admin/audit', label: 'audit', icon: 'list', group: 'management' },
]
export function AppShell({ path, children }: { path: string
  children: ReactNode }) {
  const auth = useAuth()
  const isHome = path === '/'
  const isPublic = isHome || ['/login', '/register', '/forgot', '/recovery'].includes(path)
  const action = useAction()
  const [menu, setMenu] = useState(false)
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light')
  useEffect(() => setMenu(false), [path])
  const health = useAsync(signal => isPublic ? Promise.resolve(null) : request('/readyz', { signal }), [isPublic])
  const changeTheme = () => { const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('ygg.theme', next) } catch { /* 主题仍在本标签页生效。 */ } }
  return <div className={`app-shell ${isPublic ? 'landing-shell' : ''}`}><header className="topbar"><a className="brand" href="#/"><span className="brand-block"><span /></span><span>{t('wordmark')}<span className="brand-light">{t('wordmarkSkin')}</span><small>{t('englishCommunity')}</small></span></a>{isPublic && <nav className="public-nav" aria-label={t('explore')}><a className={isHome ? 'active' : ''} aria-current={isHome ? 'page' : undefined} href="#/">{t('home')}</a><a href="#/library">{t('library')}</a><a href="#/guide">{t('guide')}</a></nav>}<div className="top-actions">{!isPublic && <span className="edition">{t('edition')}</span>}<Button variant="ghost" aria-label={t('theme')} onClick={changeTheme}><Icon name="moon" /></Button>{auth.account ? isHome ? <a className="button button-primary" href="#/dashboard">{t('dashboard')}<Icon name="arrow" size={16} /></a> : <><span className="top-user">{auth.account.email.split('@')[0]}</span><Button variant="ghost" busy={action.busy} aria-label={t('logout')} onClick={() => action.run(signal => api.logout(signal), undefined, () => { auth.clear()
    navigate('/login') })}><Icon name="logout" /></Button></> : <a className="button button-primary" href="#/login">{t('login')}<Icon name="arrow" size={16} /></a>}{!isPublic && <Button className="mobile-menu" variant="ghost" aria-label={menu ? t('closeMenu') : t('menu')} onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'} /></Button>}</div></header>
    {!isPublic && menu && <button className="sidebar-scrim" aria-label={t('closeMenu')} onClick={() => setMenu(false)} />}
    {!isPublic && <aside className={`sidebar ${menu ? 'open' : ''}`}><div className="sidebar-welcome"><div className="pixel-avatar"><span /><span /><span /></div><strong>{auth.account?.email.split('@')[0] || t('visitor')}</strong><small>{t('welcome')}</small></div><nav>{(['explore', 'personal', 'management'] as const).map(group => group === 'management' && (!auth.account || auth.account.permission < 1) ? null : <div className="nav-group" key={group}><p>{t(group)}</p>{links.filter(link => link.group === group).map(link => <a key={link.path} href={`#${link.path}`} className={path === link.path ? 'active' : ''} onClick={() => setMenu(false)}><Icon name={link.icon} /><span>{t(link.label)}</span>{link.path === '/library' && <span className="nav-dot" />}</a>)}</div>)}</nav><div className="sidebar-bottom"><span className={`status-dot ${health.error ? 'offline' : ''}`} />{t(health.loading ? 'checking' : health.error ? 'unavailable' : 'online')}<span className="sidebar-version">v0.1</span></div></aside>}
    <div className="main-wrap"><main id="main-content">{action.error && <ErrorState message={action.error} />}{auth.error && <ErrorState message={auth.error} retry={auth.restore} />}{children}</main><footer><span>© {new Date().getFullYear()} {t('brand')}</span><span>{t('footer')}</span><a href="https://github.com/bs-community/blessing-skin-server" target="_blank" rel="noreferrer">{t('about')}</a></footer></div></div>
}
