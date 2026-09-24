/**
 * ============================================================
 * VIEWS — อ่านโน้ต / ประวัติการแก้ไข / แก้ไขโน้ต
 * ============================================================
 */
import { useState } from "react";
import { BackLink, Button, Field, PageShell, TextAreaField } from "../ui";
import { useSpeech } from "../hooks";
import type { Note, Revision, User, ViewName } from "../types";

// ---- RevisionList: ไทม์ไลน์การแก้ไข เวอร์ชันล่าสุดอยู่บนสุด ------------------

function RevisionList({ revisions }: { revisions: Revision[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 text-lg font-semibold text-ink">ประวัติการแก้ไข</h2>
      <p className="mb-4 text-sm text-ink-soft">ทุกครั้งที่บันทึกจะเก็บเป็นเวอร์ชันใหม่ ของเดิมยังอยู่ครบ</p>
      <ol className="border-l border-paper-rule pl-5">
        {revisions.map((revision, index) => (
          <li key={revision.id} className="relative pb-5 last:pb-0">
            <span aria-hidden className={"absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper " + (index === 0 ? "bg-marker-deep" : "bg-paper-rule")} />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-medium text-ink">{revision.editor}</span>
              <span className="text-sm text-ink-mute">{revision.date}</span>
              {index === 0 && <span className="rounded bg-marker px-1.5 py-0.5 text-xs text-ink">เวอร์ชันปัจจุบัน</span>}
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{revision.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---- NoteView --------------------------------------------------------------

interface NoteViewProps {
  user: User;
  note: Note | undefined;
  loading: boolean;
  subjectCode: string | undefined;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onEdit: () => void;
  onBack: () => void;
}
export function NoteView({ user, note, loading, subjectCode, onNavigate, onLogout, onEdit, onBack }: NoteViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const speech = useSpeech();

  if (loading) {
    return (
      <PageShell user={user} current="note" onNavigate={onNavigate} onLogout={onLogout}
        title="กำลังโหลด…" breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}>
        <span />
      </PageShell>
    );
  }

  if (!note) {
    return (
      <PageShell user={user} current="note" onNavigate={onNavigate} onLogout={onLogout}
        title="ไม่พบโน้ตนี้" description="โน้ตอาจถูกลบไปแล้ว กลับไปเลือกหัวข้ออื่นได้"
        breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}>
        <span />
      </PageShell>
    );
  }

  const lastEdit = note.revisions[0];

  return (
    <PageShell user={user} current="note" onNavigate={onNavigate} onLogout={onLogout}
      title={note.title}
      description={lastEdit ? `${subjectCode ?? ""} · แก้ไขล่าสุดโดย ${lastEdit.editor} เมื่อ ${lastEdit.date}` : subjectCode}
      breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}
      actions={
        <>
          {speech.supported && <Button variant="quiet" onClick={() => speech.toggle(note.content)}>{speech.isPlaying ? "หยุดอ่าน" : "อ่านออกเสียง"}</Button>}
          <Button variant="quiet" onClick={() => setShowHistory((v) => !v)}>{showHistory ? "ซ่อนประวัติ" : `ประวัติ ${note.revisions.length} เวอร์ชัน`}</Button>
          <Button onClick={() => { speech.stop(); onEdit(); }}>แก้ไขโน้ต</Button>
        </>
      }>
      <article className="rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet sm:p-8">
        {speech.isPlaying && <p className="mb-5 rounded border border-ok/25 bg-ok-soft px-3 py-2 text-sm text-ok">กำลังอ่านออกเสียงโน้ตนี้</p>}
        <div className="max-w-[68ch] whitespace-pre-line text-[15px] leading-[1.9] text-ink-soft">{note.content}</div>
      </article>
      {showHistory && <RevisionList revisions={note.revisions} />}
    </PageShell>
  );
}

// ---- EditorView ------------------------------------------------------------

interface EditorViewProps {
  user: User;
  note: Note | undefined;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onSave: (content: string, summary: string) => void;
  onCancel: () => void;
}
export function EditorView({ user, note, onNavigate, onLogout, onSave, onCancel }: EditorViewProps) {
  const [content, setContent] = useState(note?.content ?? "");
  const [summary, setSummary] = useState("");
  const changed = content.trim() !== (note?.content ?? "").trim();

  return (
    <PageShell user={user} current="editor" onNavigate={onNavigate} onLogout={onLogout}
      title={`แก้ไข: ${note?.title ?? "โน้ต"}`} description="การแก้ไขจะถูกเก็บเป็นเวอร์ชันใหม่ ไม่ทับเนื้อหาเดิม"
      breadcrumb={<BackLink label="กลับไปอ่านโน้ต (ไม่บันทึก)" onClick={onCancel} />}>
      <div className="space-y-4 rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
        <TextAreaField label="เนื้อหาโน้ต" className="h-72" value={content} onChange={(e) => setContent(e.target.value)} />
        <Field
          label="สรุปสิ่งที่แก้"
          placeholder="เช่น เพิ่มตัวอย่าง 3NF, แก้คำผิด"
          hint="เพื่อนร่วมวิชาจะเห็นข้อความนี้ในประวัติการแก้ไข"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-paper-rule pt-4">
          <Button disabled={!changed} onClick={() => onSave(content, summary)}>บันทึกเวอร์ชันใหม่</Button>
          <Button variant="quiet" onClick={onCancel}>ยกเลิก</Button>
          {!changed && <span className="text-sm text-ink-mute">ยังไม่มีอะไรเปลี่ยน</span>}
        </div>
      </div>
    </PageShell>
  );
}
