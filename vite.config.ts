import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'YGG_')
  const backend = process.env.YGG_BACKEND_URL || env.YGG_BACKEND_URL || 'http://127.0.0.1:18080'
  return {
    base: '/web/',
    plugins: [react()],
    define: { 'import.meta.env.VITE_PUBLIC_API_ORIGIN': JSON.stringify(process.env.VITE_PUBLIC_API_ORIGIN || env.YGG_PUBLIC_API_ORIGIN || (command === 'serve' ? new URL(backend).origin : '')) },
    server: { proxy: Object.fromEntries(['/api', '/textures', '/healthz', '/readyz', '/authserver', '/sessionserver', '/account-recovery'].map(path => [path, backend])) },
  }
})
