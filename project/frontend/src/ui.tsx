/**
 * ============================================================
 * UI — ชิ้นส่วนที่ใช้ซ้ำหลายหน้า (ไม่มี state ของแอป รับทุกอย่างผ่าน props)
 * ============================================================
 * Button, Field/TextAreaField  → ฟอร์มพื้นฐาน
 * NavBar, PageShell            → โครงหน้าหลัง login
 * AuthCard, BackLink           → โครงหน้า login/register และลิงก์ย้อนกลับ
 */
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
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

export function Button({
  variant = "primary",
  full,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
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
      <label htmlFor={id} className="mb-1 block text-sm text-ink-soft">
        {label}
      </label>
      <input id={id} className={`${fieldControl} ${className}`} {...rest} />
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}
export function TextAreaField({
  label,
  hint,
  className = "",
  ...rest
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-soft">
        {label}
      </label>
      <textarea
        id={id}
        className={`${fieldControl} leading-relaxed ${className}`}
        {...rest}
      />
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
interface NavItem {
  view: ViewName;
  label: string;
  adminOnly?: boolean;
  matchViews: ViewName[];
}
const navItems: NavItem[] = [
  {
    view: "notes",
    label: "คลังโน้ต (Notes)",
    matchViews: ["notes", "note-detail"],
  },
  {
    view: "subjects",
    label: "วิกิวิชาการ (Wiki)",
    matchViews: ["subjects", "topics", "note", "editor"],
  },
  {
    view: "ocr",
    label: "แปลงภาพเป็นข้อความ",
    matchViews: ["ocr"],
  },
  {
    view: "dashboard",
    label: "ภาพรวมระบบ",
    adminOnly: true,
    matchViews: ["dashboard"],
  },
];

export function NavBar({ user, current, onNavigate, onLogout }: NavBarProps) {
  const visible = navItems.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );
  return (
    <header className="border-b border-paper-rule bg-white sticky top-0 z-40 shadow-xs">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <button
          onClick={() => onNavigate("notes")}
          className="text-base font-bold tracking-tight text-ink hover:opacity-85 transition-opacity flex items-center gap-1.5"
        >
          <span className="rounded bg-ink text-white px-1.5 py-0.5 text-xs font-mono">
            CE
          </span>
          <span>Notes Hub</span>
          <span className="text-xs text-ink-mute font-normal">วิศวะคอมฯ</span>
        </button>
        <ul className="flex items-center gap-1.5 text-sm">
          {visible.map((item) => {
            const active = item.matchViews.includes(current);
            return (
              <li key={item.view}>
                <button
                  onClick={() => onNavigate(item.view)}
                  aria-current={active ? "page" : undefined}
                  className={
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-all " +
                    (active
                      ? "bg-marker-deep/20 text-ink ring-1 ring-marker-deep/40 shadow-xs font-semibold"
                      : "text-ink-soft hover:text-ink hover:bg-paper-rule/60")
                  }
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-ink-mute text-xs sm:text-sm">
            {user.full_name}
            {user.role === "admin" && (
              <span className="ml-1 rounded bg-pen/10 text-pen px-1.5 py-0.5 text-xs font-medium">
                Admin
              </span>
            )}
          </span>
          <button
            onClick={onLogout}
            className="text-pen hover:underline text-xs sm:text-sm"
          >
            ออกจากระบบ
          </button>
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
export function PageShell({
  user,
  current,
  onNavigate,
  onLogout,
  title,
  description,
  breadcrumb,
  actions,
  width = "narrow",
  children,
}: PageShellProps) {
  const max = width === "wide" ? "max-w-5xl" : "max-w-3xl";
  return (
    <div className="min-h-screen bg-paper">
      <NavBar
        user={user}
        current={current}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className={`mx-auto ${max} px-5 py-8 sm:py-10`}>
        {breadcrumb && <div className="mb-5">{breadcrumb}</div>}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
              <span className="marker-underline">{title}</span>
            </h1>
            {description && (
              <p className="mt-2 max-w-[60ch] text-ink-soft">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}

// ---- BackLink ---------------------------------------------------------

export function BackLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="text-sm text-pen hover:underline">
      ← {label}
    </button>
  );
}

// ---- AuthCard: โครงหน้า login / register ใช้ร่วมกัน -----------------------

interface AuthCardProps {
  title: string;
  subtitle: string;
  panelTitle?: string;
  panelSubtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}
export function AuthCard({ title, subtitle, panelTitle, panelSubtitle, children, footer }: AuthCardProps) {
  return (
    <main className="min-h-screen bg-paper lg:grid lg:grid-cols-2">
      <section className="auth-visual relative flex min-h-[280px] flex-col justify-between overflow-hidden px-6 py-6 text-white sm:px-10 sm:py-8 lg:min-h-screen lg:px-12 lg:py-10 xl:px-16">
        <div aria-hidden="true" className="auth-grid absolute inset-0" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded bg-marker text-sm font-bold text-ink shadow-lg">CE</span>
          <div>
            <p className="text-lg font-semibold leading-tight">Notes Hub</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">Computer Engineering · KMITL</p>
          </div>
        </div>

        <div className="relative z-10 mt-10 max-w-xl lg:my-auto lg:py-16">
          <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-marker">บันทึกความรู้ · KMITL</p>
          <h1 className="max-w-[15ch] whitespace-pre-line text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[42px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[42ch] text-sm leading-7 text-white/75 sm:text-base">
            {subtitle}
          </p>
        </div>

        <div aria-hidden="true" className="auth-note-art pointer-events-none absolute bottom-12 right-12 hidden h-52 w-64 rotate-[5deg] rounded-sm p-5 xl:block">
          <div className="flex items-center justify-between border-b border-paper-rule pb-3">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-pen">FIELD NOTES</span>
            <span className="rounded-sm bg-marker px-2 py-1 text-[9px] font-bold text-ink">CE / 01</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-2 w-3/4 rounded-full bg-ink/80" />
            <div className="h-1.5 w-full rounded-full bg-ink/15" />
            <div className="h-1.5 w-5/6 rounded-full bg-ink/15" />
            <div className="mt-5 h-7 w-2/3 rounded-sm bg-marker/80" />
            <div className="h-1.5 w-4/5 rounded-full bg-ink/15" />
          </div>
          <div className="absolute -bottom-3 -left-3 size-8 rounded-full border-[6px] border-pen/80 bg-paper" />
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-280px)] items-center justify-center px-5 py-10 sm:px-8 lg:min-h-screen lg:px-12">
        <div className="auth-enter w-full max-w-md">
          <div className="mb-5">
            {panelTitle && <h2 className="mt-2 text-2xl font-semibold text-ink">{panelTitle}</h2>}
            {panelSubtitle && <p className="mt-1 text-sm text-ink-soft">{panelSubtitle}</p>}
          </div>
          <div className="rounded-sheet border border-paper-rule bg-white p-5 shadow-sheet sm:p-8">
            {children}
          </div>
          <div className="mt-5 text-center text-sm text-ink-soft">{footer}</div>
        </div>
      </section>
    </main>
  );
}

// ---- Modal ----------------------------------------------------------------

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-sheet border border-paper-rule bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-ink-soft">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded p-1 text-ink-mute hover:bg-paper-rule hover:text-ink transition-colors"
            title="ปิด"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
