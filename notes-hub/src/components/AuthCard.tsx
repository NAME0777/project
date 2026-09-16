import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** โครงหน้าสำหรับเข้าสู่ระบบและสมัครสมาชิก ใช้ร่วมกันสองหน้า */
export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7">
          <p className="text-sm text-ink-mute">คณะวิทยาการคอมพิวเตอร์</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            <span className="marker-underline">{title}</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
        </div>

        <div className="rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
          {children}
        </div>

        <div className="mt-4 text-center text-sm text-ink-soft">{footer}</div>
      </div>
    </div>
  );
}
