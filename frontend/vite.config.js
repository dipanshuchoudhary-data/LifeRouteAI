import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (String(req.url || '').includes('/stream')) {
              res.setHeader('Cache-Control', 'no-cache')
              res.setHeader('X-Accel-Buffering', 'no')
            }
          })
        },
      },
      '/assistant': { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/navigate': { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/hospitals': { target: 'http://127.0.0.1:8001', changeOrigin: true },
    },
  },
})
