import { useCallback, useState } from "react";
import type { Role, User } from "../types";

/** สถานะผู้ใช้ปัจจุบัน — ตอนต่อ backend ให้แก้แค่ใน login() */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, role: Role) => {
    setUser({
      name: role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา",
      email,
      role,
    });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return { user, login, logout };
}
