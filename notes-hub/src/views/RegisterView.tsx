import { useState } from "react";
import AuthCard from "../components/AuthCard";
import Button from "../components/Button";
import { Field } from "../components/Field";

interface RegisterViewProps {
  onRegistered: () => void;
  onGoLogin: () => void;
}

export default function RegisterView({ onRegistered, onGoLogin }: RegisterViewProps) {
  const [form, setForm] = useState({ name: "", studentId: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) return setError("กรอกชื่อ-นามสกุลก่อน");
    if (!/^\d{8}$/.test(form.studentId)) return setError("รหัสนักศึกษาเป็นตัวเลข 8 หลัก");
    if (!form.email.endsWith("@kmitl.ac.th")) return setError("อีเมลต้องลงท้ายด้วย @kmitl.ac.th");
    if (form.password.length < 6) return setError("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    setError(null);
    onRegistered();
  };

  return (
    <AuthCard
      title="สมัครสมาชิก"
      subtitle="ยืนยันตัวตนด้วยอีเมลสถาบัน เพื่อให้รู้ว่าใครเป็นคนแก้โน้ตแต่ละครั้ง"
      footer={
        <>
          มีบัญชีแล้ว{" "}
          <button onClick={onGoLogin} className="text-pen hover:underline">
            เข้าสู่ระบบ
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="ชื่อ-นามสกุล" placeholder="ธีรภัทร์ อามาตย์" value={form.name} onChange={set("name")} />
        <Field
          label="รหัสนักศึกษา"
          inputMode="numeric"
          placeholder="66200122"
          value={form.studentId}
          onChange={set("studentId")}
        />
        <Field
          label="อีเมลมหาวิทยาลัย"
          type="email"
          placeholder="66200122@kmitl.ac.th"
          value={form.email}
          onChange={set("email")}
        />
        <Field
          label="รหัสผ่าน"
          type="password"
          autoComplete="new-password"
          hint="อย่างน้อย 6 ตัวอักษร"
          value={form.password}
          onChange={set("password")}
        />

        {error && (
          <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">
            {error}
          </p>
        )}

        <Button full onClick={submit}>
          สร้างบัญชี
        </Button>
      </div>
    </AuthCard>
  );
}
