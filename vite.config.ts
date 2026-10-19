import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'YGG_')
  const backend = env.YGG_BACKEND_URL || 'http://127.0.0.1:18080'
  return {
    base: '/web/',
    plugins: [react()],
    server: {
      proxy: {
        '/healthz': backend,
        '/readyz': backend,
        '/authserver': backend,
        '/sessionserver': backend,
        '/api': backend,
        '/textures': backend,
        '/minecraft': backend,
        // 后端会把 /oauth/authorize 与 /oidc/callback 重定向到 /web/#/...；
        // 开发时把原路径也代理过去，才能从同一 origin 发起完整流程。
        '/oauth': backend,
        '/oidc': backend,
      },
    },
  }
})
