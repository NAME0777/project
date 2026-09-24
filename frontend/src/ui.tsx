/**
 * ============================================================
 * UI — ชิ้นส่วนที่ใช้ซ้ำหลายหน้า (ไม่มี state ของแอป รับทุกอย่างผ่าน props)
 * ============================================================
 * Button, Field/TextAreaField  → ฟอร์มพื้นฐาน
 * NavBar, PageShell            → โครงหน้าหลัง login
 * AuthCard, BackLink           → โครงหน้า login/register และลิงก์ย้อนกลับ
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import type { User, ViewName } from "./types";

// ---- Button -------------------------------------------------------------

type Variant = "primary" | "quiet" | "ghost" | "confirm";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const buttonVariants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  quiet: "bg-white text-ink border border-paper-rule hover:border-ink-mute",
  ghost: "text-pen hover:bg-pen-soft px-2",
  confirm: "bg-ok text-white hover:brightness-110",
};

export function Button({ variant = "primary", full, className = "", ...rest }: ButtonProps) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${full ? "w-full" : ""} ${className}`} {...rest} />;
}

// ---- Field / TextAreaField ----------------------------------------------

const fieldControl =
  "w-full rounded border border-paper-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-mute/70 focus:border-pen";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}
export function Field({ label, hint, className = "", ...rest }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-soft">{label}</label>
      <input id={id} className={`${fieldControl} ${className}`} {...rest} />
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}
export function TextAreaField({ label, hint, className = "", ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-soft">{label}</label>
      <textarea id={id} className={`${fieldControl} leading-relaxed ${className}`} {...rest} />
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

// ---- NavBar ---------------------------------------------------------------

interface NavBarProps {
  user: User;
  current: ViewName;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
}
interface NavItem { view: ViewName; label: string; adminOnly?: boolean }
const navItems: NavItem[] = [
  { view: "subjects", label: "รายวิชา" },
  { view: "ocr", label: "แปลงภาพเป็นข้อความ" },
  { view: "dashboard", label: "ภาพรวมระบบ", adminOnly: true },
];

export function NavBar({ user, current, onNavigate, onLogout }: NavBarProps) {
  const visible = navItems.filter((item) => !item.adminOnly || user.role === "admin");
  return (
    <header className="border-b border-paper-rule bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <button onClick={() => onNavigate("subjects")} className="text-base font-semibold tracking-tight text-ink">
          คลังโน้ต<span className="text-ink-mute">.สาขา</span>
        </button>
        <ul className="flex items-center gap-1 text-sm">
          {visible.map((item) => {
            const active = current === item.view;
            return (
              <li key={item.view}>
                <button
                  onClick={() => onNavigate(item.view)}
                  aria-current={active ? "page" : undefined}
                  className={"rounded px-2.5 py-1.5 transition-colors " + (active ? "bg-marker font-medium text-ink" : "text-ink-soft hover:text-ink")}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-ink-mute">{user.name}{user.role === "admin" && " · ผู้ดูแล"}</span>
          <button onClick={onLogout} className="text-pen hover:underline">ออกจากระบบ</button>
        </div>
      </nav>
    </header>
  );
}

// ---- PageShell: โครงหน้าหลัง login (แถบเมนู + หัวข้อหน้า) -------------------

interface PageShellProps {
  user: User;
  current: ViewName;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  width?: "narrow" | "wide";
  children: ReactNode;
}
export function PageShell({ user, current, onNavigate, onLogout, title, description, breadcrumb, actions, width = "narrow", children }: PageShellProps) {
  const max = width === "wide" ? "max-w-5xl" : "max-w-3xl";
  return (
    <div className="min-h-screen bg-paper">
      <NavBar user={user} current={current} onNavigate={onNavigate} onLogout={onLogout} />
      <main className={`mx-auto ${max} px-5 py-8 sm:py-10`}>
        {breadcrumb && <div className="mb-5">{breadcrumb}</div>}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
              <span className="marker-underline">{title}</span>
            </h1>
            {description && <p className="mt-2 max-w-[60ch] text-ink-soft">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}

// ---- BackLink ---------------------------------------------------------

export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="text-sm text-pen hover:underline">← {label}</button>;
}

// ---- AuthCard: โครงหน้า login / register ใช้ร่วมกัน -----------------------

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7">
          <p className="text-sm text-ink-mute">คณะวิทยาการคอมพิวเตอร์</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink"><span className="marker-underline">{title}</span></h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
        </div>
        <div className="rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">{children}</div>
        <div className="mt-4 text-center text-sm text-ink-soft">{footer}</div>
      </div>
    </div>
  );
}
