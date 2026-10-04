/**
 * ============================================================
 * VIEWS — อ่านโน้ต / ประวัติการแก้ไข / แก้ไขโน้ต
 * ============================================================
 */
import { useState } from "react";
import { BackLink, Button, Field, PageShell, TextAreaField } from "../ui";
import { useSpeech } from "../hooks";
import { formatThaiDate } from "../api";
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
            <span
              aria-hidden
              className={
                "absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper " +
                (index === 0 ? "bg-marker-deep" : "bg-paper-rule")
              }
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-medium text-ink">{revision.editor_name || "ไม่ทราบผู้แก้ไข"}</span>
              <span className="text-sm text-ink-mute">{formatThaiDate(revision.created_at)}</span>
              {index === 0 && (
                <span className="rounded bg-marker px-1.5 py-0.5 text-xs text-ink">เวอร์ชันปัจจุบัน</span>
              )}
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
  topicTitle?: string; // เพิ่มกรณีต้องการส่งชื่อหัวข้อเริ่มต้นเข้ามา
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onEdit: () => void;
  onBack: () => void;
}

export function NoteView({
  user,
  note,
  loading,
  subjectCode,
  topicTitle,
  onNavigate,
  onLogout,
  onEdit,
  onBack,
}: NoteViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const speech = useSpeech();

  if (loading) {
    return (
      <PageShell
        user={user}
        current="note"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title="กำลังโหลด…"
        breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}
      >
        <span />
      </PageShell>
    );
  }

  // **จุดที่แก้ไข**: หากยังไม่มีโน้ต ให้แสดง UI แนะนำและปุ่มกดเพื่อสร้างโน้ตใหม่
  if (!note) {
    return (
      <PageShell
        user={user}
        current="note"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title={topicTitle || "ยังไม่มีโน้ตสำหรับหัวข้อนี้"}
        description={
          subjectCode
            ? `${subjectCode} · ยังไม่มีการสร้างเนื้อหาในหัวข้อนี้`
            : "ยังไม่มีการสร้างเนื้อหาในหัวข้อนี้ สามารถสร้างใหม่ได้ทันที"
        }
        breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}
        actions={
          <Button onClick={onEdit}>
            + สร้างโน้ตใหม่
          </Button>
        }
      >
        <div className="rounded-sheet border border-dashed border-paper-rule bg-white p-12 text-center shadow-sheet">
          <p className="mb-4 text-base text-ink-soft">
            ยังไม่มีเนื้อหาในหัวข้อนี้ คลิกปุ่มด้านล่างเพื่อเริ่มเขียนโน้ต
          </p>
          <Button onClick={onEdit}>
            เริ่มเขียนโน้ต
          </Button>
        </div>
      </PageShell>
    );
  }

  const lastEdit = note.revisions && note.revisions.length > 0 ? note.revisions[0] : null;

  return (
    <PageShell
      user={user}
      current="note"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={note.title}
      description={
        lastEdit
          ? `${subjectCode ?? ""} · แก้ไขล่าสุดโดย ${lastEdit.editor_name || "ไม่ทราบผู้แก้ไข"} เมื่อ ${formatThaiDate(lastEdit.created_at)}`
          : subjectCode
      }
      breadcrumb={<BackLink label="หัวข้อบทเรียน" onClick={onBack} />}
      actions={
        <>
          {speech.supported && (
            <Button variant="quiet" onClick={() => speech.toggle(note.content)}>
              {speech.isPlaying ? "หยุดอ่าน" : "อ่านออกเสียง"}
            </Button>
          )}
          {note.revisions && note.revisions.length > 0 && (
            <Button variant="quiet" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? "ซ่อนประวัติ" : `ประวัติ ${note.revisions.length} เวอร์ชัน`}
            </Button>
          )}
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
          {note.content || "ไม่มีเนื้อหา"}
        </div>
      </article>
      {showHistory && note.revisions && <RevisionList revisions={note.revisions} />}
    </PageShell>
  );
}

// ---- EditorView ------------------------------------------------------------

interface EditorViewProps {
  user: User;
  note: Note | undefined;
  defaultTitle?: string; // เพิ่มเพื่อรับชื่อหัวข้อเริ่มต้นกรณีสร้างใหม่
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onSave: (data: { title: string; content: string; summary: string }) => void;
  onCancel: () => void;
}

export function EditorView({
  user,
  note,
  defaultTitle,
  onNavigate,
  onLogout,
  onSave,
  onCancel,
}: EditorViewProps) {
  // หากไม่มี note ให้ตั้งค่าเริ่มต้นจาก defaultTitle หรือคำว่า "หัวข้อใหม่"
  const [title, setTitle] = useState(note?.title ?? defaultTitle ?? "หัวข้อใหม่");
  const [content, setContent] = useState(note?.content ?? "");
  const [summary, setSummary] = useState(note ? "" : "สร้างโน้ตใหม่");

  // เช็กการเปลี่ยนแปลงของทั้งหัวข้อและเนื้อหาโน้ต
  const isNew = !note;
  const titleChanged = title.trim() !== (note?.title ?? "").trim();
  const contentChanged = content.trim() !== (note?.content ?? "").trim();
  const changed = isNew ? (title.trim() !== "" || content.trim() !== "") : (titleChanged || contentChanged);

  return (
    <PageShell
      user={user}
      current="editor"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={isNew ? `สร้างโน้ตใหม่: ${title}` : `แก้ไข: ${note?.title ?? "โน้ต"}`}
      description={isNew ? "สร้างเนื้อหาโน้ตใหม่สำหรับหัวข้อนี้" : "การแก้ไขจะถูกเก็บเป็นเวอร์ชันใหม่ ไม่ทับเนื้อหาเดิม"}
      breadcrumb={<BackLink label="กลับไปอ่านโน้ต (ไม่บันทึก)" onClick={onCancel} />}
    >
      <div className="space-y-4 rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
        {/* ช่องสำหรับแก้ไขชื่อหัวข้อบทเรียน */}
        <Field
          label="หัวข้อบทเรียน"
          placeholder="ระบุหัวข้อบทเรียน..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {/* ช่องแก้ไขเนื้อหาโน้ต */}
        <TextAreaField
          label="เนื้อหาโน้ต"
          className="h-72"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {/* ช่องบันทึกสรุปการแก้ไข */}
        <Field
          label="สรุปสิ่งที่แก้"
          placeholder="เช่น สร้างโน้ตใหม่, แก้ไขชื่อหัวข้อ, เพิ่มตัวอย่าง 3NF"
          hint="เพื่อนร่วมวิชาจะเห็นข้อความนี้ในประวัติการแก้ไข"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-paper-rule pt-4">
          <Button
            disabled={!changed || !title.trim()}
            onClick={() => onSave({ title, content, summary })}
          >
            {isNew ? "สร้างและบันทึก" : "บันทึกเวอร์ชันใหม่"}
          </Button>
          <Button variant="quiet" onClick={onCancel}>
            ยกเลิก
          </Button>
          {!changed && <span className="text-sm text-ink-mute">ยังไม่มีอะไรเปลี่ยน</span>}
        </div>
      </div>
    </PageShell>
  );
}