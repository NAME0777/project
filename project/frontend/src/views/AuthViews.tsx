/**
 * ============================================================
 * VIEWS — เข้าสู่ระบบ / สมัครสมาชิก
 * ============================================================
 * role มาจากบัญชีจริงใน backend เสมอ — ฟอร์มนี้ไม่มีตัวเลือก role ให้กดเอง
 * (สมัครผ่านหน้านี้ได้แค่สิทธิ์นักศึกษา ผู้ดูแลระบบสร้างผ่าน Django admin เท่านั้น)
 */
import { useEffect, useRef, useState } from "react";
import { AuthCard, Button, Field } from "../ui";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string>) => void;
        };
      };
    };
  }
}

interface LoginViewProps {
  onLogin: (email: string, password: string) => void;
  onGoogleLogin: (credential: string) => void;
  error: string | null;
  pending: boolean;
}
export function LoginView({ onLogin, onGoogleLogin, error, pending }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const googleButton = useRef<HTMLDivElement>(null);
  const googleLoginRef = useRef(onGoogleLogin);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    googleLoginRef.current = onGoogleLogin;
  }, [onGoogleLogin]);

  useEffect(() => {
    if (!googleClientId || !googleButton.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !googleButton.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => googleLoginRef.current(credential),
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: "320",
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
    return () => script.remove();
  }, [googleClientId]);

  const submit = () => {
    if (!email.endsWith("@kmitl.ac.th")) return setFormError("ใช้ได้เฉพาะอีเมลของสถาบัน ลงท้ายด้วย @kmitl.ac.th");
    if (!password) return setFormError("กรอกรหัสผ่าน");
    setFormError(null);
    onLogin(email, password);
  };

  const shownError = formError ?? error;

  return (
    <AuthCard
      title="คลังโน้ตเรียนประจำสาขา"
      subtitle="โน้ตของรุ่นพี่ที่รุ่นน้องช่วยกันแก้ให้ดีขึ้นทุกเทอม"
      footer={<span>เข้าสู่ระบบด้วยบัญชี Google ของสถาบัน</span>}
    >
      <div className="space-y-4">
        <div>
        <Field label="อีเมลมหาวิทยาลัย" type="email" autoComplete="username" placeholder="example@kmitl.ac.th" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="รหัสผ่าน" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <div className="mt-6">
          <Button full onClick={submit} disabled={pending}>{pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</Button>
        </div>
        </div>
        <div className="border-t border-paper-rule pt-4">
        {googleClientId ? (
          <div ref={googleButton} className="flex min-h-10 justify-center" />
        ) : (
          <p className="text-sm text-redpen">ยังไม่ได้ตั้งค่า Google Sign-In</p>
        )}
        {shownError && <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">{shownError}</p>}
        </div>
      </div>
    </AuthCard>
  );
}

// ---- RegisterView ----------------------------------------------------------

export interface RegisterForm {
  full_name: string;
  student_id: string;
  email: string;
  password: string;
}

interface RegisterViewProps {
  onRegistered: (form: RegisterForm) => Promise<void>;
  onGoLogin: () => void;
}
export function RegisterView({ onRegistered, onGoLogin }: RegisterViewProps) {
  const [form, setForm] = useState<RegisterForm>({ full_name: "", student_id: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    if (!form.full_name.trim()) return setError("กรอกชื่อ-นามสกุลก่อน");
    if (!/^\d{8}$/.test(form.student_id)) return setError("รหัสนักศึกษาเป็นตัวเลข 8 หลัก");
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
        <Field label="ชื่อ-นามสกุล" placeholder="ธีรภัทร์ อามาตย์" value={form.full_name} onChange={set("full_name")} />
        <Field label="รหัสนักศึกษา" inputMode="numeric" placeholder="66200122" value={form.student_id} onChange={set("student_id")} />
        <Field label="อีเมลมหาวิทยาลัย" type="email" placeholder="66200122@kmitl.ac.th" value={form.email} onChange={set("email")} />
        <Field label="รหัสผ่าน" type="password" autoComplete="new-password" hint="อย่างน้อย 6 ตัวอักษร" value={form.password} onChange={set("password")} />
        {error && <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">{error}</p>}
        <Button full disabled={submitting} onClick={submit}>{submitting ? "กำลังสมัคร…" : "สร้างบัญชี"}</Button>
      </div>
    </AuthCard>
  );
}