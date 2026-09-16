import { useState } from "react";
import AuthCard from "../components/AuthCard";
import Button from "../components/Button";
import { Field } from "../components/Field";
import type { Role } from "../types";

interface LoginViewProps {
  onLogin: (email: string, role: Role) => void;
  onGoRegister: () => void;
}

export default function LoginView({ onLogin, onGoRegister }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!email.endsWith("@kmitl.ac.th")) {
      setError("ใช้ได้เฉพาะอีเมลของสถาบัน ลงท้ายด้วย @kmitl.ac.th");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setError(null);
    onLogin(email, role);
  };

  return (
    <AuthCard
      title="คลังโน้ตเรียนประจำสาขา"
      subtitle="โน้ตของรุ่นพี่ที่รุ่นน้องช่วยกันแก้ให้ดีขึ้นทุกเทอม"
      footer={
        <>
          ยังไม่มีบัญชี{" "}
          <button onClick={onGoRegister} className="text-pen hover:underline">
            สมัครด้วยอีเมลสถาบัน
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="อีเมลมหาวิทยาลัย"
          type="email"
          autoComplete="username"
          placeholder="66200122@kmitl.ac.th"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="รหัสผ่าน"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <fieldset>
          <legend className="mb-1.5 text-sm text-ink-soft">เข้าใช้งานในฐานะ</legend>
          <div className="flex gap-2">
            {(["student", "admin"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={role === value}
                onClick={() => setRole(value)}
                className={
                  "flex-1 rounded border px-3 py-1.5 text-sm transition-colors " +
                  (role === value
                    ? "border-ink bg-ink text-paper"
                    : "border-paper-rule text-ink-soft hover:border-ink-mute")
                }
              >
                {value === "student" ? "นักศึกษา" : "ผู้ดูแลระบบ"}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">
            {error}
          </p>
        )}

        <Button full onClick={submit}>
          เข้าสู่ระบบ
        </Button>
      </div>
    </AuthCard>
  );
}
