import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import { App } from './App'
import { AuthProvider } from './lib/auth'
import { SiteProvider } from './components/SiteProvider'
import { ToastProvider } from './components/ui'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

createRoot(container).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SiteProvider>
          <App />
        </SiteProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
