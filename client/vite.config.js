import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"], // يضمن استخدام نسخة واحدة من React
  },
  server: {
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
    headers: {
      "Cache-Control": "no-store",
    },
    host: true,
    watch: {
      usePolling: true, // يحل مشاكل الملفات في بعض أنظمة Windows
    },
  },
});
