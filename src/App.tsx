import { useEffect } from 'react'
import { useRoute } from './lib/router'
import { AuthProvider, RequireAuth } from './lib/auth'
import { AppShell } from './components/AppShell'
import { EmptyState, ToastProvider } from './components/UI'
import { Library } from './pages/Library'
import { AuthPage } from './pages/Auth'
import { TextureDetail } from './pages/TextureDetail'
import { Upload } from './pages/Upload'
import { Players } from './pages/Players'
import { AccountPage } from './pages/Account'
import { ExternalCallback } from './pages/External'
import { SiteAdmin, PointsPage, OAuthConsent } from './pages/Site'
import { Admin } from './pages/Admin'
import { Landing, Dashboard, Guide } from './pages/Home'
import { t } from './i18n/zh-CN'

function Routes() {
  const { path, params } = useRoute()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [path])
  let content
  if (path === '/') content = <Landing />
  else if (path === '/library') content = <Library key={path} mode="library" params={params} />
  else if (path === '/closet' || path === '/uploads') content = <RequireAuth><Library key={path} mode={path.slice(1) as 'closet' | 'uploads'} params={params} /></RequireAuth>
  else if (['/login', '/register', '/forgot', '/recovery'].includes(path)) content = <AuthPage key={path} mode={path.slice(1) as 'login'} next={params.get('next') || '/dashboard'} />
  else if (/^\/texture\/[a-fA-F0-9]{32}$/.test(path)) content = <TextureDetail key={path} id={path.split('/')[2]} />
  else if (path === '/upload') content = <RequireAuth><Upload /></RequireAuth>
  else if (path === '/players') content = <RequireAuth><Players /></RequireAuth>
  else if (path === '/oidc/callback') content = <ExternalCallback params={params} />
  else if (path === '/admin/site') content = <RequireAuth><SiteAdmin /></RequireAuth>
  else if (path === '/points') content = <RequireAuth><PointsPage /></RequireAuth>
  else if (path === '/oauth/authorize') content = <RequireAuth><OAuthConsent params={params} /></RequireAuth>
  else if (path === '/account') content = <RequireAuth><AccountPage /></RequireAuth>
  else if (path === '/dashboard') content = <RequireAuth><Dashboard /></RequireAuth>
  else if (path === '/guide') content = <Guide />
  else if (['/admin/users', '/admin/reports', '/admin/audit'].includes(path)) content = <RequireAuth><Admin key={path} mode={path.split('/')[2] as 'users'} params={params} /></RequireAuth>
  else content = <EmptyState title={t('unknownRoute')} text={t('unknownRouteText')}><a href="#/library" className="button button-primary">{t('goLibrary')}</a></EmptyState>
  return <AppShell path={path}>{content}</AppShell>
}
export function App() { return <ToastProvider><AuthProvider><Routes /></AuthProvider></ToastProvider> }
