import { useState } from "react";
import BackLink from "../components/BackLink";
import Button from "../components/Button";
import PageShell from "../components/PageShell";
import { Field, TextAreaField } from "../components/Field";
import type { Note, User, ViewName } from "../types";

interface EditorViewProps {
  user: User;
  note: Note | undefined;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onSave: (content: string, summary: string) => void;
  onCancel: () => void;
}

export default function EditorView({
  user,
  note,
  onNavigate,
  onLogout,
  onSave,
  onCancel,
}: EditorViewProps) {
  const [content, setContent] = useState(note?.content ?? "");
  const [summary, setSummary] = useState("");

  const changed = content.trim() !== (note?.content ?? "").trim();

  return (
    <PageShell
      user={user}
      current="editor"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={`แก้ไข: ${note?.title ?? "โน้ต"}`}
      description="การแก้ไขจะถูกเก็บเป็นเวอร์ชันใหม่ ไม่ทับเนื้อหาเดิม"
      breadcrumb={<BackLink label="กลับไปอ่านโน้ต (ไม่บันทึก)" onClick={onCancel} />}
    >
      <div className="space-y-4 rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
        <TextAreaField
          label="เนื้อหาโน้ต"
          className="h-72"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Field
          label="สรุปสิ่งที่แก้"
          placeholder="เช่น เพิ่มตัวอย่าง 3NF, แก้คำผิด"
          hint="เพื่อนร่วมวิชาจะเห็นข้อความนี้ในประวัติการแก้ไข"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2 border-t border-paper-rule pt-4">
          <Button disabled={!changed} onClick={() => onSave(content, summary)}>
            บันทึกเวอร์ชันใหม่
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
