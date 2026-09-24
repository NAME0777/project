/**
 * ============================================================
 * VIEWS — รายวิชาทั้งหมด และหัวข้อบทเรียนของแต่ละวิชา
 * ============================================================
 * ข้อมูลวิชา/หัวข้อมาจาก useCatalog() (เรียก backend) ไม่มีข้อมูลฮาร์ดโค้ดในไฟล์นี้
 */
import { BackLink, PageShell } from "../ui";
import type { Subject, Topic, User, ViewName } from "../types";

// ---- SubjectsView ----------------------------------------------------------

interface SubjectsViewProps {
  user: User;
  subjects: Subject[];
  loading: boolean;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onOpenSubject: (subjectId: number) => void;
}
export function SubjectsView({ user, subjects, loading, onNavigate, onLogout, onOpenSubject }: SubjectsViewProps) {
  return (
    <PageShell user={user} current="subjects" onNavigate={onNavigate} onLogout={onLogout} width="wide"
      title="รายวิชาทั้งหมด" description="เลือกวิชาเพื่อดูหัวข้อบทเรียนและโน้ตที่รุ่นพี่เขียนไว้">
      {loading && subjects.length === 0 ? (
        <p className="text-ink-soft">กำลังโหลดรายวิชา…</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <button onClick={() => onOpenSubject(subject.id)} className="h-full w-full rounded-sheet border border-paper-rule bg-white p-5 text-left shadow-sheet hover:border-ink-mute">
                <span className="text-sm font-medium tracking-wide text-pen">{subject.code}</span>
                <span className="mt-1.5 block text-lg font-semibold leading-snug text-ink">{subject.name}</span>
                <span className="mt-4 block border-t border-paper-rule pt-3 text-sm text-ink-mute">ภาค {subject.term}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

// ---- TopicsView -------------------------------------------------------------

interface TopicsViewProps {
  user: User;
  subject: Subject | undefined;
  topics: Topic[];
  loading: boolean;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onOpenNote: (noteId: number) => void;
  onBack: () => void;
}
export function TopicsView({ user, subject, topics, loading, onNavigate, onLogout, onOpenNote, onBack }: TopicsViewProps) {
  return (
    <PageShell user={user} current="topics" onNavigate={onNavigate} onLogout={onLogout}
      title={subject?.name ?? "ไม่พบรายวิชา"}
      description={subject ? `${subject.code} · ภาคการศึกษา ${subject.term}` : undefined}
      breadcrumb={<BackLink label="รายวิชาทั้งหมด" onClick={onBack} />}>
      {loading ? (
        <p className="text-ink-soft">กำลังโหลดหัวข้อ…</p>
      ) : (
        <ol className="divide-y divide-paper-rule overflow-hidden rounded-sheet border border-paper-rule bg-white shadow-sheet">
          {topics.map((topic) => (
            <li key={topic.id}>
              <button onClick={() => onOpenNote(topic.noteId)} disabled={!topic.hasNote}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-paper disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <span className="w-6 shrink-0 text-sm text-ink-mute">{topic.order}</span>
                <span className={topic.hasNote ? "text-ink" : "text-ink-mute"}>{topic.title}</span>
                <span className="ml-auto shrink-0 text-sm text-ink-mute">{topic.hasNote ? "อ่านโน้ต" : "ยังไม่มีใครเขียน"}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {!loading && topics.length === 0 && (
        <p className="rounded-sheet border border-dashed border-paper-rule p-8 text-center text-ink-soft">
          วิชานี้ยังไม่มีหัวข้อบทเรียน เริ่มด้วยการอัปโหลดภาพโน้ตของคุณได้เลย
        </p>
      )}
    </PageShell>
  );
}
