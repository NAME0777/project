/**
 * ============================================================
 * VIEWS — เข้าสู่ระบบ / สมัครสมาชิก (ก่อน login เท่านั้น)
 * ============================================================
 * การตรวจฟอร์มเบื้องต้น (รูปแบบอีเมล, ความยาวรหัสผ่าน) ทำที่นี่เพื่อความไว
 * ส่วนความถูกต้องจริง (มีบัญชีนี้ในระบบไหม ฯลฯ) backend เป็นคนตัดสินสุดท้าย
 * และ error จาก backend จะถูกส่งกลับมาแสดงผ่าน prop `error`
 */
import { useState } from "react";
import { AuthCard, Button, Field } from "../ui";
import type { Role } from "../types";

// ---- LoginView -----------------------------------------------------------

interface LoginViewProps {
  onLogin: (email: string, role: Role) => void;
  onGoRegister: () => void;
  error: string | null;
}
export function LoginView({ onLogin, onGoRegister, error }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [formError, setFormError] = useState<string | null>(null);

  const submit = () => {
    if (!email.endsWith("@kmitl.ac.th")) return setFormError("ใช้ได้เฉพาะอีเมลของสถาบัน ลงท้ายด้วย @kmitl.ac.th");
    if (password.length < 6) return setFormError("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    setFormError(null);
    onLogin(email, role);
  };

  const shownError = formError ?? error;

  return (
    <AuthCard
      title="คลังโน้ตเรียนประจำสาขา"
      subtitle="โน้ตของรุ่นพี่ที่รุ่นน้องช่วยกันแก้ให้ดีขึ้นทุกเทอม"
      footer={<>ยังไม่มีบัญชี <button onClick={onGoRegister} className="text-pen hover:underline">สมัครด้วยอีเมลสถาบัน</button></>}
    >
      <div className="space-y-4">
        <Field label="อีเมลมหาวิทยาลัย" type="email" autoComplete="username" placeholder="66200122@kmitl.ac.th" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="รหัสผ่าน" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <fieldset>
          <legend className="mb-1.5 text-sm text-ink-soft">เข้าใช้งานในฐานะ</legend>
          <div className="flex gap-2">
            {(["student", "admin"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={role === value}
                onClick={() => setRole(value)}
                className={"flex-1 rounded border px-3 py-1.5 text-sm transition-colors " + (role === value ? "border-ink bg-ink text-paper" : "border-paper-rule text-ink-soft hover:border-ink-mute")}
              >
                {value === "student" ? "นักศึกษา" : "ผู้ดูแลระบบ"}
              </button>
            ))}
          </div>
        </fieldset>
        {shownError && <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">{shownError}</p>}
        <Button full onClick={submit}>เข้าสู่ระบบ</Button>
      </div>
    </AuthCard>
  );
}

// ---- RegisterView ----------------------------------------------------------

export interface RegisterForm {
  name: string;
  studentId: string;
  email: string;
  password: string;
}

interface RegisterViewProps {
  onRegistered: (form: RegisterForm) => Promise<void>;
  onGoLogin: () => void;
}
export function RegisterView({ onRegistered, onGoLogin }: RegisterViewProps) {
  const [form, setForm] = useState<RegisterForm>({ name: "", studentId: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return setError("กรอกชื่อ-นามสกุลก่อน");
    if (!/^\d{8}$/.test(form.studentId)) return setError("รหัสนักศึกษาเป็นตัวเลข 8 หลัก");
    if (!form.email.endsWith("@kmitl.ac.th")) return setError("อีเมลต้องลงท้ายด้วย @kmitl.ac.th");
    if (form.password.length < 6) return setError("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    setError(null);
    setSubmitting(true);
    try {
      await onRegistered(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="สมัครสมาชิก"
      subtitle="ยืนยันตัวตนด้วยอีเมลสถาบัน เพื่อให้รู้ว่าใครเป็นคนแก้โน้ตแต่ละครั้ง"
      footer={<>มีบัญชีแล้ว <button onClick={onGoLogin} className="text-pen hover:underline">เข้าสู่ระบบ</button></>}
    >
      <div className="space-y-4">
        <Field label="ชื่อ-นามสกุล" placeholder="ธีรภัทร์ อามาตย์" value={form.name} onChange={set("name")} />
        <Field label="รหัสนักศึกษา" inputMode="numeric" placeholder="66200122" value={form.studentId} onChange={set("studentId")} />
        <Field label="อีเมลมหาวิทยาลัย" type="email" placeholder="66200122@kmitl.ac.th" value={form.email} onChange={set("email")} />
        <Field label="รหัสผ่าน" type="password" autoComplete="new-password" hint="อย่างน้อย 6 ตัวอักษร" value={form.password} onChange={set("password")} />
        {error && <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">{error}</p>}
        <Button full disabled={submitting} onClick={submit}>{submitting ? "กำลังสมัคร…" : "สร้างบัญชี"}</Button>
      </div>
    </AuthCard>
  );
}
