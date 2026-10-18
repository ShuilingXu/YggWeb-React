import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AuthProvider } from './components/AuthProvider'
import { ToastProvider } from './components/ui'
import './styles/tokens.css'
import './styles/components.css'
import './styles/layout.css'

const root = document.getElementById('root')
if (!root) throw new Error('缺少 #root 挂载点')

createRoot(root).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
