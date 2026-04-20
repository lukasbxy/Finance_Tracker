import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Finance_Tracker/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          'charts': ['recharts'],
          'supabase': ['@supabase/supabase-js'],
          'utils': ['date-fns', 'lucide-react']
        }
      }
    }
  }
})
