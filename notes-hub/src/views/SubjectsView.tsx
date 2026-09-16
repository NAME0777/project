import PageShell from "../components/PageShell";
import { countTopics, subjects } from "../data/subjects";
import type { User, ViewName } from "../types";

interface SubjectsViewProps {
  user: User;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onOpenSubject: (subjectId: number) => void;
}

export default function SubjectsView({
  user,
  onNavigate,
  onLogout,
  onOpenSubject,
}: SubjectsViewProps) {
  return (
    <PageShell
      user={user}
      current="subjects"
      onNavigate={onNavigate}
      onLogout={onLogout}
      width="wide"
      title="รายวิชาทั้งหมด"
      description="เลือกวิชาเพื่อดูหัวข้อบทเรียนและโน้ตที่รุ่นพี่เขียนไว้"
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <li key={subject.id}>
            <button
              onClick={() => onOpenSubject(subject.id)}
              className="h-full w-full rounded-sheet border border-paper-rule bg-white p-5 text-left shadow-sheet hover:border-ink-mute"
            >
              <span className="text-sm font-medium tracking-wide text-pen">{subject.code}</span>
              <span className="mt-1.5 block text-lg font-semibold leading-snug text-ink">
                {subject.name}
              </span>
              <span className="mt-4 block border-t border-paper-rule pt-3 text-sm text-ink-mute">
                {countTopics(subject.id)} หัวข้อ · ภาค {subject.term}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
