import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
=======
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
     headers: {
    'Cache-Control': 'no-store',
  },
    host: true,
    watch: {
      usePolling: true, // يحل مشاكل الملفات في بعض أنظمة Windows
    },
  },
})
>>>>>>> origin/ElSayed
