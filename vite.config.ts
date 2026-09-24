import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // ตอน dev: คำขอ /api/* จะถูกส่งต่อไปที่ backend โดยอัตโนมัติ ไม่ต้องตั้ง CORS
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
