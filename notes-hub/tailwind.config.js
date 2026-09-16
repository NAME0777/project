/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // ชุดสีของโปรเจกต์ — อ้างอิงจาก "สมุดจด": หมึกน้ำเงินเข้ม กระดาษ ปากกาแดง ปากกาเน้นข้อความ
      colors: {
        ink: { DEFAULT: "#17233B", soft: "#3D4A63", mute: "#78849B" },
        paper: { DEFAULT: "#F7F6F1", panel: "#FFFFFF", rule: "#E2E2DA" },
        marker: { DEFAULT: "#F2D857", deep: "#C9A81C" },
        pen: { DEFAULT: "#1F5FBF", soft: "#E8EFFA" },
        redpen: { DEFAULT: "#B5362B", soft: "#F8EAE8" },
        ok: { DEFAULT: "#2F7A54", soft: "#E6F1EA" },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        sheet: "0 1px 0 0 #E2E2DA, 0 12px 28px -24px rgba(23,35,59,.5)",
      },
      borderRadius: { sheet: "10px" },
    },
  },
  plugins: [],
};
