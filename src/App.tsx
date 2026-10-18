import { AppShell } from './components/AppShell'
import { match, useRoute } from './lib/router'
import { AdminPage } from './pages/AdminPage'
import { ClosetPage } from './pages/ClosetPage'
import { ForgotPage } from './pages/ForgotPage'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlayersPage } from './pages/PlayersPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { TexturePage } from './pages/TexturePage'
import { UploadPage } from './pages/UploadPage'

export function App() {
  const route = useRoute()

  const texture = match('/texture/:id', route.path)
  const adminUsers = match('/admin/users', route.path)
  const adminReports = match('/admin/reports', route.path)
  const adminAudit = match('/admin/audit', route.path)

  let page: React.ReactNode
  if (route.path === '/') page = <HomePage />
  else if (route.path === '/library') page = <LibraryPage />
  else if (texture) page = <TexturePage id={texture['id'] ?? ''} />
  else if (route.path === '/upload') page = <UploadPage />
  else if (route.path === '/closet') page = <ClosetPage />
  else if (route.path === '/players') page = <PlayersPage />
  else if (route.path === '/profile') page = <ProfilePage />
  else if (route.path === '/admin') page = <AdminPage initialTab="users" />
  else if (adminUsers) page = <AdminPage initialTab="users" />
  else if (adminReports) page = <AdminPage initialTab="reports" />
  else if (adminAudit) page = <AdminPage initialTab="audit" />
  else if (route.path === '/login') page = <LoginPage />
  else if (route.path === '/register') page = <RegisterPage />
  else if (route.path === '/forgot') page = <ForgotPage />
  else page = <NotFoundPage />

  return <AppShell path={route.path}>{page}</AppShell>
}
