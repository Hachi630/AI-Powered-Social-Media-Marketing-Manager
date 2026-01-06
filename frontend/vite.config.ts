/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.VITE_BACKEND_PORT || '5000'

  // Log proxy configuration on startup
  console.log(`\n🚀 Vite Dev Server starting...`)
  console.log(`📡 Proxy target: http://localhost:${backendPort}`)
  console.log(`⚠️  Make sure backend server is running on port ${backendPort}\n`)

  return {
    plugins: [react()],
    // Server configuration (only used in development mode)
    // In production, VITE_API_URL environment variable should be set
    // and the frontend will make direct API calls to the backend URL
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
          timeout: 30000,
          ws: true,
          rewrite: (path) => path, // Keep the path as is
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, _res) => {
              console.error(`\n❌ [Proxy Error] Cannot connect to backend server at http://localhost:${backendPort}`)
              console.error(`   Request: ${req.method} ${req.url}`)
              console.error(`   Error: ${err.message}`)
              console.error(`   Error code: ${err.code}`)
              console.error(`\n💡 Solution: Make sure backend server is running:`)
              console.error(`   cd backend && npm run dev\n`)
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:${backendPort}${req.url}`);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`[Proxy Response] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            });
            proxy.on('proxyReqWs', (proxyReq, req, _socket) => {
              console.log(`[Proxy WS] ${req.url} -> http://localhost:${backendPort}${req.url}`);
            });
          },
        },
        '/linkedin': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
          timeout: 10000,
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, _res) => {
              if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
                console.error(`[LinkedIn Proxy] Backend server not available at http://localhost:${backendPort}`)
              } else {
                console.error('LinkedIn proxy error:', err);
              }
            });
          },
        },
        '/uploads': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
          timeout: 30000, // Longer timeout for file uploads
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, _res) => {
              if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
                console.error(`[Uploads Proxy] Backend server not available at http://localhost:${backendPort}`)
              } else {
                console.error('Uploads proxy error:', err);
              }
            });
          },
        },
      },
    },
    // Test configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    },
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
    },
  }
})

