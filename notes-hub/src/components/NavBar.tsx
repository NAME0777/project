import type { User, ViewName } from "../types";

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
}

const items: NavItem[] = [
  { view: "subjects", label: "รายวิชา" },
  { view: "ocr", label: "แปลงภาพเป็นข้อความ" },
  { view: "dashboard", label: "ภาพรวมระบบ", adminOnly: true },
];

export default function NavBar({ user, current, onNavigate, onLogout }: NavBarProps) {
  const visible = items.filter((item) => !item.adminOnly || user.role === "admin");

  return (
    <header className="border-b border-paper-rule bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <button
          onClick={() => onNavigate("subjects")}
          className="text-base font-semibold tracking-tight text-ink"
        >
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
                  className={
                    "rounded px-2.5 py-1.5 transition-colors " +
                    (active ? "bg-marker font-medium text-ink" : "text-ink-soft hover:text-ink")
                  }
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-ink-mute">
            {user.name}
            {user.role === "admin" && " · ผู้ดูแล"}
          </span>
          <button onClick={onLogout} className="text-pen hover:underline">
            ออกจากระบบ
          </button>
        </div>
      </nav>
    </header>
  );
}
