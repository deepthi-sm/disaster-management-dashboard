import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the production bundle into ../frontend so the existing Express
// server (app.use(express.static('../frontend'))) serves it unchanged.
// In dev, proxy /api and /socket.io to the Node backend on :3001.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../frontend',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
})
