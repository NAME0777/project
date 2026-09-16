import { useState } from "react";
import BackLink from "../components/BackLink";
import Button from "../components/Button";
import PageShell from "../components/PageShell";
import RevisionList from "./note/RevisionList";
import { useSpeech } from "../hooks/useSpeech";
import { getSubject } from "../data/subjects";
import type { Note, User, ViewName } from "../types";

interface NoteViewProps {
  user: User;
  note: Note | undefined;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onEdit: () => void;
  onBack: () => void;
}

export default function NoteView({
  user,
  note,
  onNavigate,
  onLogout,
  onEdit,
  onBack,
}: NoteViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const speech = useSpeech();

  if (!note) {
    return (
      <PageShell
        user={user}
        current="note"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title="ไม่พบโน้ตนี้"
        description="โน้ตอาจถูกลบไปแล้ว กลับไปเลือกหัวข้ออื่นได้"
        breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}
      >
        <span />
      </PageShell>
    );
  }

  const subject = getSubject(note.subjectId);
  const lastEdit = note.revisions[0];

  return (
    <PageShell
      user={user}
      current="note"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={note.title}
      description={
        lastEdit ? `${subject?.code} · แก้ไขล่าสุดโดย ${lastEdit.editor} เมื่อ ${lastEdit.date}` : subject?.code
      }
      breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}
      actions={
        <>
          {speech.supported && (
            <Button variant="quiet" onClick={() => speech.toggle(note.content)}>
              {speech.isPlaying ? "หยุดอ่าน" : "อ่านออกเสียง"}
            </Button>
          )}
          <Button variant="quiet" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? "ซ่อนประวัติ" : `ประวัติ ${note.revisions.length} เวอร์ชัน`}
          </Button>
          <Button
            onClick={() => {
              speech.stop();
              onEdit();
            }}
          >
            แก้ไขโน้ต
          </Button>
        </>
      }
    >
      <article className="rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet sm:p-8">
        {speech.isPlaying && (
          <p className="mb-5 rounded border border-ok/25 bg-ok-soft px-3 py-2 text-sm text-ok">
            กำลังอ่านออกเสียงโน้ตนี้
          </p>
        )}
        <div className="max-w-[68ch] whitespace-pre-line text-[15px] leading-[1.9] text-ink-soft">
          {note.content}
        </div>
      </article>

      {showHistory && <RevisionList revisions={note.revisions} />}
    </PageShell>
  );
}
