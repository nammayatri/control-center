import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy BAP API requests
      '/api/bap': {
        target: 'https://dashboard.moving.tech',
        changeOrigin: true,
        secure: true,
      },
      // Proxy BPP API requests
      '/api/bpp': {
        target: 'https://dashboard.moving.tech',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
