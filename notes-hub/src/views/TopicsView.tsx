import BackLink from "../components/BackLink";
import PageShell from "../components/PageShell";
import { getSubject, getTopics } from "../data/subjects";
import type { Note, User, ViewName } from "../types";

interface TopicsViewProps {
  user: User;
  subjectId: number | undefined;
  notes: Note[];
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onOpenNote: (noteId: number) => void;
  onBack: () => void;
}

export default function TopicsView({
  user,
  subjectId,
  notes,
  onNavigate,
  onLogout,
  onOpenNote,
  onBack,
}: TopicsViewProps) {
  const subject = getSubject(subjectId);
  const topics = getTopics(subjectId);
  const hasNote = (noteId: number) => notes.some((n) => n.id === noteId);

  return (
    <PageShell
      user={user}
      current="topics"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={subject?.name ?? "ไม่พบรายวิชา"}
      description={subject ? `${subject.code} · ภาคการศึกษา ${subject.term}` : undefined}
      breadcrumb={<BackLink label="รายวิชาทั้งหมด" onClick={onBack} />}
    >
      <ol className="divide-y divide-paper-rule overflow-hidden rounded-sheet border border-paper-rule bg-white shadow-sheet">
        {topics.map((topic) => {
          const ready = hasNote(topic.noteId);
          return (
            <li key={topic.id}>
              <button
                onClick={() => onOpenNote(topic.noteId)}
                disabled={!ready}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-paper disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <span className="w-6 shrink-0 text-sm text-ink-mute">{topic.order}</span>
                <span className={ready ? "text-ink" : "text-ink-mute"}>{topic.title}</span>
                <span className="ml-auto shrink-0 text-sm text-ink-mute">
                  {ready ? "อ่านโน้ต" : "ยังไม่มีใครเขียน"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {topics.length === 0 && (
        <p className="rounded-sheet border border-dashed border-paper-rule p-8 text-center text-ink-soft">
          วิชานี้ยังไม่มีหัวข้อบทเรียน เริ่มด้วยการอัปโหลดภาพโน้ตของคุณได้เลย
        </p>
      )}
    </PageShell>
  );
}
