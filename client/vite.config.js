import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'], // يضمن استخدام نسخة واحدة من React
  },
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    host: true,
    watch: {
      usePolling: true, // يحل مشاكل الملفات في بعض أنظمة Windows
    },
  },
})