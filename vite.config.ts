import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load VITE_ variables directly from environment
  const env = loadEnv(mode, '.', 'VITE_')

  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map((h) => h.trim())
    : ['localhost']

  return {
    plugins: [react(), tailwindcss()],
    preview: {
      allowedHosts,
      port: Number(env.VITE_PORT) || 8080,
      host: true
    }
  }
})