import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 产物由 YggServer-Go 在 /web/ 下托管，base 必须保持 '/web/'。
const backend = process.env.YGG_BACKEND_URL ?? 'http://127.0.0.1:18080'

export default defineConfig({
  base: '/web/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/textures': backend,
      '/healthz': backend,
      '/readyz': backend,
      '/authserver': backend,
      '/sessionserver': backend,
    },
  },
})
