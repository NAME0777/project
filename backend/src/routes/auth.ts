/**
 * ---- /api/auth — เข้าสู่ระบบ / สมัครสมาชิก ----------------------------
 * ตอนนี้ยังไม่มีฐานข้อมูลผู้ใช้จริง (ไม่เช็ครหัสผ่านกับ DB, ไม่ออก JWT)
 * ต่อระบบจริง: เพิ่มตาราง users, เข้ารหัสรหัสผ่านด้วย bcrypt, และออก JWT ตอน login สำเร็จ
 */
import { Router } from "express";
import type { Role } from "../types.js";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { email, role } = req.body as { email?: string; role?: Role };

  if (!email || !email.endsWith("@kmitl.ac.th")) {
    return res.status(400).json({ error: "ใช้ได้เฉพาะอีเมลของสถาบัน ลงท้ายด้วย @kmitl.ac.th" });
  }
  if (role !== "student" && role !== "admin") {
    return res.status(400).json({ error: "role ต้องเป็น student หรือ admin" });
  }

  res.json({ user: { name: role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา", email, role } });
});

authRouter.post("/register", (req, res) => {
  const { name, studentId, email, password } = req.body as Record<string, string | undefined>;

  if (!name?.trim()) return res.status(400).json({ error: "กรอกชื่อ-นามสกุลก่อน" });
  if (!studentId || !/^\d{8}$/.test(studentId)) return res.status(400).json({ error: "รหัสนักศึกษาเป็นตัวเลข 8 หลัก" });
  if (!email?.endsWith("@kmitl.ac.th")) return res.status(400).json({ error: "อีเมลต้องลงท้ายด้วย @kmitl.ac.th" });
  if (!password || password.length < 6) return res.status(400).json({ error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" });

  // TODO: บันทึกผู้ใช้ลงฐานข้อมูลจริงตรงนี้
  res.status(201).json({ ok: true });
});
