import type { ReactNode } from "react";
import NavBar from "./NavBar";
import type { User, ViewName } from "../types";

interface PageShellProps {
  user: User;
  current: ViewName;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  title: string;
  description?: string;
  /** แถบด้านบนสุด เช่น ปุ่มย้อนกลับ หรือเส้นทางของหน้า */
  breadcrumb?: ReactNode;
  /** ปุ่มที่อยู่ระดับเดียวกับหัวข้อหน้า */
  actions?: ReactNode;
  width?: "narrow" | "wide";
  children: ReactNode;
}

export default function PageShell({
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
