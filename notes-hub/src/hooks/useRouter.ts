import { useCallback, useState } from "react";
import type { Route, ViewName } from "../types";

/**
 * ตัวจัดการหน้าแบบง่าย เก็บประวัติไว้ให้กดย้อนกลับได้
 * ถ้าโปรเจกต์โตขึ้นค่อยเปลี่ยนไปใช้ react-router โดยแก้แค่ไฟล์นี้
 */
export function useRouter(initial: Route = { name: "login" }) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const route = stack[stack.length - 1];

  const go = useCallback((name: ViewName, params: Omit<Route, "name"> = {}) => {
    setStack((prev) => [...prev, { name, ...params }]);
  }, []);

  /** ใช้ตอนไม่อยากให้หน้าเดิมค้างในประวัติ เช่น ล็อกอิน/ออกจากระบบ */
  const reset = useCallback((name: ViewName, params: Omit<Route, "name"> = {}) => {
    setStack([{ name, ...params }]);
  }, []);

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  return { route, go, reset, back, canGoBack: stack.length > 1 };
}
