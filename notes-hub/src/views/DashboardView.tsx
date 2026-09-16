import PageShell from "../components/PageShell";
import { dashboardStats, recentEdits } from "../data/notes";
import type { User, ViewName } from "../types";

interface DashboardViewProps {
  user: User;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
}

export default function DashboardView({ user, onNavigate, onLogout }: DashboardViewProps) {
  return (
    <PageShell
      user={user}
      current="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      width="wide"
      title="ภาพรวมระบบ"
      description="ดูว่าคลังโน้ตถูกใช้งานมากแค่ไหน และใครแก้อะไรไปบ้าง"
    >
      <dl className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="rounded-sheet border border-paper-rule bg-white p-5 shadow-sheet">
            <dt className="text-sm text-ink-mute">{stat.label}</dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-sheet border border-paper-rule bg-white shadow-sheet">
        <h2 className="border-b border-paper-rule px-5 py-4 text-lg font-semibold text-ink">
          การแก้ไขล่าสุด
        </h2>
        <ul className="divide-y divide-paper-rule">
          {recentEdits.map((edit) => (
            <li key={`${edit.who}-${edit.date}`} className="flex flex-wrap gap-x-3 gap-y-1 px-5 py-4">
              <span className="font-medium text-ink">{edit.who}</span>
              <span className="text-ink-soft">{edit.what}</span>
              <span className="text-sm text-pen">{edit.subject}</span>
              <span className="ml-auto text-sm text-ink-mute">{edit.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
