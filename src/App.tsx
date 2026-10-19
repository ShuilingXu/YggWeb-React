import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { RequireAdmin, RequireAuth } from './components/AuthGuard'
import { useAuth } from './components/AuthProvider'
import { EmptyState, LoadingState } from './components/UI'
import { t } from './i18n/zh-CN'
import { href, useRoute, type Route } from './lib/router'
import { AccountPage } from './pages/AccountPage'
import { AdminPage } from './pages/AdminPage'
import { ForgotPage, LoginPage, RegisterPage } from './pages/AuthPage'
import { ClosetPage } from './pages/ClosetPage'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { OAuthConsentPage } from './pages/OAuthConsentPage'
import { OidcCallbackPage } from './pages/OidcCallbackPage'
import { PlayersPage } from './pages/PlayersPage'
import { PointsPage } from './pages/PointsPage'
import { TexturePage } from './pages/TexturePage'
import { UploadPage } from './pages/UploadPage'

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'library':
      return <LibraryPage />
    case 'texture':
      return <TexturePage uuid={route.uuid} />
    case 'upload':
      return (
        <RequireAuth>
          <UploadPage />
        </RequireAuth>
      )
    case 'closet':
      return (
        <RequireAuth>
          <ClosetPage />
        </RequireAuth>
      )
    case 'players':
      return (
        <RequireAuth>
          <PlayersPage />
        </RequireAuth>
      )
    case 'points':
      return (
        <RequireAuth>
          <PointsPage />
        </RequireAuth>
      )
    case 'oauthAuthorize':
      return (
        <RequireAuth>
          <OAuthConsentPage />
        </RequireAuth>
      )
    case 'oidcCallback':
      return <OidcCallbackPage />
    case 'account':
      return (
        <RequireAuth>
          <AccountPage />
        </RequireAuth>
      )
    case 'admin':
      return (
        <RequireAdmin>
          <AdminPage tab={route.tab} />
        </RequireAdmin>
      )
    case 'login':
      return <LoginPage />
    case 'register':
      return <RegisterPage />
    case 'forgot':
      return <ForgotPage />
    default:
      return (
        <div className="container">
          <div className="page page--narrow">
            <EmptyState title={t('error.404')} text={t('library.emptyHint')}>
              <a className="mc-btn mc-btn--primary" href={href('/')}>
                {t('common.back')}
              </a>
            </EmptyState>
          </div>
        </div>
      )
  }
}

export function App() {
  const route = useRoute()
  const auth = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return (
    <AppShell route={route}>
      {auth.restoring ? (
        <div className="container">
          <div className="page">
            <LoadingState />
          </div>
        </div>
      ) : (
        <RouteView route={route} />
      )}
    </AppShell>
  )
}
