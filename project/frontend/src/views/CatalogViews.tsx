/**
 * ============================================================
 * VIEWS — รายวิชาทั้งหมด และหัวข้อบทเรียนของแต่ละวิชา
 * ============================================================
 * ข้อมูลวิชา/หัวข้อมาจาก useCatalog() (เรียก backend)
 * ปุ่มเพิ่ม/ลบ แสดงเฉพาะผู้ดูแลระบบ (role=admin) — นักศึกษาดูได้อย่างเดียว
 */
import { useState } from "react";
import { BackLink, Button, Field, PageShell } from "../ui";
import type { Subject, Topic, User, ViewName } from "../types";

// ---- SubjectsView ----------------------------------------------------------

interface SubjectsViewProps {
  user: User;
  subjects: Subject[];
  loading: boolean;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onOpenSubject: (subjectId: number) => void;
  onCreateSubject: (subject: { code: string; name: string; term: string }) => Promise<void>;
  onDeleteSubject: (id: number) => Promise<void>;
}

export function SubjectsView({
  user,
  subjects,
  loading,
  onNavigate,
  onLogout,
  onOpenSubject,
  onCreateSubject,
  onDeleteSubject,
}: SubjectsViewProps) {
  const isAdmin = user.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", term: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.term.trim()) {
      setError("กรอกให้ครบทุกช่อง");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onCreateSubject(form);
      setForm({ code: "", name: "", term: "" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มรายวิชาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number, name: string) => {
    if (!window.confirm(`ลบวิชา "${name}" ทิ้งเลยไหม? หัวข้อและโน้ตในวิชานี้จะหายไปด้วย`)) return;
    setDeletingId(id);
    try {
      await onDeleteSubject(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell
      user={user}
      current="subjects"
      onNavigate={onNavigate}
      onLogout={onLogout}
      width="wide"
      title="รายวิชาทั้งหมด"
      description="เลือกวิชาเพื่อดูหัวข้อบทเรียนและโน้ตที่รุ่นพี่เขียนไว้"
      actions={
        <Button variant="quiet" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "ยกเลิก" : "+ เพิ่มรายวิชา"}
        </Button>
      }
    >
      {showForm && (
        <div className="mb-5 grid gap-3 rounded-sheet border border-paper-rule bg-white p-5 shadow-sheet sm:grid-cols-3">
          <Field label="รหัสวิชา" placeholder="CS999" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          <Field label="ชื่อวิชา" placeholder="ชื่อวิชาใหม่" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Field label="ภาคการศึกษา" placeholder="1/2569" value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))} />
          {error && <p className="sm:col-span-3 rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">{error}</p>}
          <div className="sm:col-span-3">
            <Button onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกรายวิชา"}</Button>
          </div>
        </div>
      )}

      {loading && subjects.length === 0 ? (
        <p className="text-ink-soft">กำลังโหลดรายวิชา…</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject.id} className="relative">
              <button onClick={() => onOpenSubject(subject.id)} className="h-full w-full rounded-sheet border border-paper-rule bg-white p-5 text-left shadow-sheet hover:border-ink-mute">
                <span className="text-sm font-medium tracking-wide text-pen">{subject.code}</span>
                <span className="mt-1.5 block text-lg font-semibold leading-snug text-ink">{subject.name}</span>
                <span className="mt-4 block border-t border-paper-rule pt-3 text-sm text-ink-mute">ภาค {subject.term}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); remove(subject.id, subject.name); }}
                  disabled={deletingId === subject.id}
                  className="absolute right-3 top-3 rounded px-2 py-1 text-xs text-redpen hover:bg-redpen-soft disabled:opacity-50"
                >
                  {deletingId === subject.id ? "กำลังลบ…" : "ลบ"}
                </button>
              )}
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
  onCreateTopic: (subject: number, order: number, title: string) => Promise<void>;
  onUpdateTopic: (id: number, title: string) => Promise<void>;
  onDeleteTopic: (id: number) => Promise<void>;
}

export function TopicsView({
  user,
  subject,
  topics,
  loading,
  onNavigate,
  onLogout,
  onOpenNote,
  onBack,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
}: TopicsViewProps) {
  const isAdmin = user.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const nextOrder = topics.reduce((max, t) => Math.max(max, t.order), 0) + 1;

  const submit = async () => {
    if (!subject) return;
    if (!title.trim()) return setError("กรอกชื่อหัวข้อก่อน");
    setError(null);
    setSaving(true);
    try {
      await onCreateTopic(subject.id, nextOrder, title.trim());
      setTitle("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มหัวข้อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditingTitle(topic.title);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditError(null);
  };

  const saveEdit = async (id: number) => {
    const title = editingTitle.trim();
    if (!title) {
      setEditError("กรอกชื่อหัวข้อก่อน");
      return;
    }

    setEditError(null);
    setUpdatingId(id);
    try {
      await onUpdateTopic(id, title);
      cancelEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "แก้ไขหัวข้อไม่สำเร็จ");
    } finally {
      setUpdatingId(null);
    }
  };

  const remove = async (id: number, title: string) => {
    if (!window.confirm(`ลบหัวข้อ "${title}" ทิ้งเลยไหม?`)) return;
    setDeletingId(id);
    try {
      await onDeleteTopic(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell
      user={user}
      current="topics"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={subject?.name ?? "ไม่พบรายวิชา"}
      description={subject ? `${subject.code} · ภาคการศึกษา ${subject.term}` : undefined}
      breadcrumb={<BackLink label="รายวิชาทั้งหมด" onClick={onBack} />}
      actions={
        subject ? (
          <Button variant="quiet" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "ยกเลิก" : "+ เพิ่มหัวข้อบทเรียน"}
          </Button>
        ) : undefined
      }
    >
      {showForm && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-sheet border border-paper-rule bg-white p-5 shadow-sheet">
          <div className="min-w-[240px] flex-1">
            <Field label={`หัวข้อที่ ${nextOrder}`} placeholder="ชื่อหัวข้อบทเรียนใหม่" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Button onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกหัวข้อ"}</Button>
          {error && <p className="w-full rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">{error}</p>}
        </div>
      )}

      {loading ? (
        <p className="text-ink-soft">กำลังโหลดหัวข้อ…</p>
      ) : (
        <ol className="divide-y divide-paper-rule overflow-hidden rounded-sheet border border-paper-rule bg-white shadow-sheet">
          {topics.map((topic) => {
            const noteTargetId = topic.note_id || topic.id;

            return (
              <li key={topic.id} className="flex items-center gap-4 px-5 py-4">
                <span className="w-6 shrink-0 text-sm text-ink-mute">{topic.order}</span>

                {editingId === topic.id ? (
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(topic.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="min-w-[220px] flex-1 rounded border border-paper-rule px-3 py-2 text-ink outline-none focus:border-pen"
                    />
                    {editError && <p className="w-full text-sm text-redpen">{editError}</p>}
                    <button
                      onClick={() => saveEdit(topic.id)}
                      disabled={updatingId === topic.id}
                      className="rounded px-2 py-1 text-xs text-pen hover:bg-paper-rule disabled:opacity-50"
                    >
                      {updatingId === topic.id ? "กำลังบันทึก…" : "บันทึก"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={updatingId === topic.id}
                      className="rounded px-2 py-1 text-xs text-ink-mute hover:bg-paper-rule disabled:opacity-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onOpenNote(noteTargetId)}
                      className="flex flex-1 items-center gap-4 text-left hover:opacity-80"
                    >
                      <span className="text-ink font-medium">{topic.title}</span>
                      <span className={`ml-auto shrink-0 text-sm ${topic.has_note ? "text-pen font-medium" : "text-ink-mute"}`}>
                        {topic.has_note ? "อ่านโน้ต" : "ยังไม่มีใครเขียน (คลิกเพื่อเริ่มเขียน)"}
                      </span>
                    </button>

                    {isAdmin && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => startEdit(topic)}
                          className="rounded px-2 py-1 text-xs text-pen hover:bg-paper-rule"
                        >
                          แก้ไขหัวข้อ
                        </button>
                        <button
                          onClick={() => remove(topic.id, topic.title)}
                          disabled={deletingId === topic.id}
                          className="rounded px-2 py-1 text-xs text-redpen hover:bg-redpen-soft disabled:opacity-50"
                        >
                          {deletingId === topic.id ? "กำลังลบ…" : "ลบ"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {!loading && topics.length === 0 && (
        <p className="rounded-sheet border border-dashed border-paper-rule p-8 text-center text-ink-soft">
          วิชานี้ยังไม่มีหัวข้อบทเรียน เริ่มด้วยการเพิ่มหัวข้อใหม่ได้เลย
        </p>
      )}
    </PageShell>
  );
}