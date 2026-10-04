import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// รัน local เฉย ๆ: target คือ localhost:8000 (ค่า default)
// รันผ่าน Docker Compose: ตั้ง BACKEND_URL=http://backend:8000 (ดู docker-compose.yml)
// เพราะในเครือข่ายของ Docker container ต้องเรียกผ่าน "ชื่อ service" ไม่ใช่ localhost
const backendTarget = process.env.BACKEND_URL ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ฟังทุก interface จะได้ map port จาก Docker เข้าถึงได้
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
});
