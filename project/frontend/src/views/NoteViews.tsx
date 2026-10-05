/**
 * ============================================================
 * VIEWS — อ่านโน้ต / ประวัติการแก้ไข / แก้ไขโน้ต
 * ============================================================
 */
import { useState } from "react";
import { BackLink, Button, Field, Modal, PageShell, TextAreaField } from "../ui";
import { useSpeech } from "../hooks";
import { formatThaiDate } from "../api";
import { computeLineDiff } from "../utils/diff";
import type { Note, Revision, User, ViewName } from "../types";

// ---- RevisionList: ไทม์ไลน์การแก้ไข + Diff Viewer เปรียบเทียบเวอร์ชัน ----

interface RevisionListProps {
  revisions: Revision[];
  onRollback?: (content: string, summary: string) => Promise<void>;
}

function RevisionList({ revisions, onRollback }: RevisionListProps) {
  const [diffModal, setDiffModal] = useState<{
    open: boolean;
    oldRev: Revision | null;
    newRev: Revision | null;
  }>({ open: false, oldRev: null, newRev: null });

  const [rollbackModal, setRollbackModal] = useState<{
    open: boolean;
    rev: Revision | null;
    versionIndex: number;
    submitting: boolean;
  }>({ open: false, rev: null, versionIndex: 0, submitting: false });

  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    rev: Revision | null;
    versionIndex: number;
  }>({ open: false, rev: null, versionIndex: 0 });

  const [compareOldId, setCompareOldId] = useState<number>(
    revisions.length > 1 ? revisions[1].id : revisions[0]?.id || 0
  );
  const [compareNewId, setCompareNewId] = useState<number>(revisions[0]?.id || 0);

  const openDiff = (oldRev: Revision, newRev: Revision) => {
    setDiffModal({ open: true, oldRev, newRev });
  };

  const handleCustomCompare = () => {
    const oldRev = revisions.find((r) => r.id === compareOldId) || null;
    const newRev = revisions.find((r) => r.id === compareNewId) || null;
    if (oldRev && newRev) {
      setDiffModal({ open: true, oldRev, newRev });
    }
  };

  const diffResult =
    diffModal.oldRev && diffModal.newRev
      ? computeLineDiff(diffModal.oldRev.content, diffModal.newRev.content)
      : null;

  return (
    <section className="mt-8 rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">ประวัติการแก้ไขและเวอร์ชัน (Revision History)</h2>
          <p className="text-sm text-ink-soft">
            ทุกครั้งที่บันทึกจะเก็บเป็นเวอร์ชันใหม่ สามารถเปรียบเทียบ (Diff) หรือย้อนกลับ (Rollback) ไปใช้เวอร์ชันเดิมได้
          </p>
        </div>

        {revisions.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 rounded border border-paper-rule bg-paper/50 p-2 text-xs">
            <span className="text-ink-soft">เปรียบเทียบ:</span>
            <select
              value={compareOldId}
              onChange={(e) => setCompareOldId(Number(e.target.value))}
              className="rounded border border-paper-rule bg-white px-2 py-1 text-ink"
            >
              {revisions.map((r, i) => (
                <option key={r.id} value={r.id}>
                  v{revisions.length - i}: {formatThaiDate(r.created_at)} ({r.editor_name || "ไม่ระบุ"})
                </option>
              ))}
            </select>
            <span className="text-ink-soft">กับ:</span>
            <select
              value={compareNewId}
              onChange={(e) => setCompareNewId(Number(e.target.value))}
              className="rounded border border-paper-rule bg-white px-2 py-1 text-ink"
            >
              {revisions.map((r, i) => (
                <option key={r.id} value={r.id}>
                  v{revisions.length - i}: {formatThaiDate(r.created_at)} ({r.editor_name || "ไม่ระบุ"})
                </option>
              ))}
            </select>
            <Button variant="quiet" className="px-2.5 py-1 text-xs" onClick={handleCustomCompare}>
              🔍 ดู Diff
            </Button>
          </div>
        )}
      </div>

      <ol className="border-l border-paper-rule pl-5 ml-2 mt-6">
        {revisions.map((revision, index) => {
          const prevRevision = index < revisions.length - 1 ? revisions[index + 1] : null;
          const versionNumber = revisions.length - index;

          return (
            <li key={revision.id} className="relative pb-6 last:pb-0">
              <span
                aria-hidden
                className={
                  "absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white " +
                  (index === 0 ? "bg-pen ring-2 ring-pen/20" : "bg-paper-rule")
                }
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="font-semibold text-ink text-sm">
                    {revision.editor_name || "ไม่ทราบผู้แก้ไข"}
                  </span>
                  <span className="text-xs font-mono text-pen font-semibold">
                    v{versionNumber}
                  </span>
                  <span className="text-xs text-ink-mute">
                    {formatThaiDate(revision.created_at)}
                  </span>
                  {index === 0 && (
                    <span className="rounded bg-ok-soft px-1.5 py-0.5 text-[11px] font-semibold text-ok">
                      เวอร์ชันปัจจุบัน
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {index > 0 && (
                    <button
                      onClick={() => setPreviewModal({ open: true, rev: revision, versionIndex: versionNumber })}
                      className="inline-flex items-center gap-1 rounded border border-paper-rule bg-paper px-2 py-1 text-xs font-medium text-ink hover:bg-paper-rule/60 transition-colors"
                    >
                      <span>👁️ ดูเนื้อหา</span>
                    </button>
                  )}

                  {prevRevision && (
                    <button
                      onClick={() => openDiff(prevRevision, revision)}
                      className="inline-flex items-center gap-1 rounded border border-paper-rule bg-paper px-2 py-1 text-xs font-medium text-pen hover:bg-paper-rule/60 transition-colors"
                    >
                      <span>🔍 ดู Diff</span>
                    </button>
                  )}

                  {index > 0 && onRollback && (
                    <button
                      onClick={() =>
                        setRollbackModal({
                          open: true,
                          rev: revision,
                          versionIndex: versionNumber,
                          submitting: false,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded border border-pen/30 bg-pen/5 px-2.5 py-1 text-xs font-medium text-pen hover:bg-pen/15 transition-colors"
                    >
                      <span>⏪ ย้อนกลับเป็นเวอร์ชันนี้</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{revision.summary || "-"}</p>
            </li>
          );
        })}
      </ol>

      {/* Modal 1: Diff Viewer */}
      <Modal
        isOpen={diffModal.open}
        onClose={() => setDiffModal({ open: false, oldRev: null, newRev: null })}
        title="ตัวเปรียบเทียบเนื้อหา (Diff Viewer)"
        description={
          diffModal.oldRev && diffModal.newRev
            ? `เปรียบเทียบ: "${diffModal.oldRev.summary || "เวอร์ชันก่อนหน้า"}" ➔ "${diffModal.newRev.summary || "เวอร์ชันใหม่"}"`
            : undefined
        }
      >
        <div className="space-y-4">
          {diffResult && (
            <div className="flex items-center justify-between border-b border-paper-rule pb-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="rounded bg-green-100 text-green-700 px-2 py-0.5 font-semibold">
                  +{diffResult.additions} บรรทัดที่เพิ่ม
                </span>
                <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 font-semibold">
                  -{diffResult.deletions} บรรทัดที่ลบ
                </span>
              </div>
              <span className="text-ink-mute">
                แก้ไขโดย: {diffModal.newRev?.editor_name || "ไม่ระบุ"}
              </span>
            </div>
          )}

          <div className="max-h-[460px] overflow-y-auto rounded-lg border border-paper-rule bg-paper/60 p-3 font-mono text-xs leading-relaxed">
            {diffResult && diffResult.lines.length > 0 ? (
              <div className="divide-y divide-paper-rule/40">
                {diffResult.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      "flex items-start gap-2 py-1 px-2 rounded-xs " +
                      (line.type === "added"
                        ? "bg-green-100/80 text-green-800 font-medium"
                        : line.type === "removed"
                        ? "bg-red-100/80 text-red-800 line-through opacity-85"
                        : "text-ink-soft")
                    }
                  >
                    <span className="select-none font-bold w-4 shrink-0 text-center">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    <span className="whitespace-pre-wrap break-all">{line.text || " "}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-ink-mute">ไม่มีข้อความที่เปลี่ยนแปลงระหว่าง 2 เวอร์ชันนี้</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-paper-rule">
            {onRollback && diffModal.oldRev && (
              <Button
                variant="confirm"
                className="text-xs"
                onClick={() => {
                  const targetRev = diffModal.oldRev;
                  setDiffModal({ open: false, oldRev: null, newRev: null });
                  if (targetRev) {
                    const vIndex =
                      revisions.length - revisions.findIndex((r) => r.id === targetRev.id);
                    setRollbackModal({
                      open: true,
                      rev: targetRev,
                      versionIndex: vIndex,
                      submitting: false,
                    });
                  }
                }}
              >
                ⏪ ย้อนกลับไปใช้เวอร์ชันก่อนหน้านี้
              </Button>
            )}
            <Button variant="quiet" onClick={() => setDiffModal({ open: false, oldRev: null, newRev: null })}>
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Preview Revision Content */}
      <Modal
        isOpen={previewModal.open}
        onClose={() => setPreviewModal({ open: false, rev: null, versionIndex: 0 })}
        title={`เนื้อหาเวอร์ชัน v${previewModal.versionIndex}`}
        description={
          previewModal.rev
            ? `แก้ไขโดย: ${previewModal.rev.editor_name || "ไม่ระบุ"} · เมื่อ ${formatThaiDate(previewModal.rev.created_at)} · "${previewModal.rev.summary || "ไม่มีสรุป"}"`
            : undefined
        }
      >
        <div className="space-y-4">
          <div className="max-h-[460px] overflow-y-auto rounded-lg border border-paper-rule bg-paper/40 p-4 text-sm text-ink-soft whitespace-pre-line leading-relaxed">
            {previewModal.rev?.content || "ไม่มีเนื้อหา"}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-paper-rule">
            {onRollback && previewModal.rev && (
              <Button
                variant="confirm"
                className="text-xs"
                onClick={() => {
                  const rev = previewModal.rev;
                  const vIndex = previewModal.versionIndex;
                  setPreviewModal({ open: false, rev: null, versionIndex: 0 });
                  if (rev) {
                    setRollbackModal({ open: true, rev, versionIndex: vIndex, submitting: false });
                  }
                }}
              >
                ⏪ ย้อนกลับไปใช้เวอร์ชันนี้
              </Button>
            )}
            <Button variant="quiet" onClick={() => setPreviewModal({ open: false, rev: null, versionIndex: 0 })}>
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Confirm Rollback */}
      <Modal
        isOpen={rollbackModal.open}
        onClose={() => {
          if (!rollbackModal.submitting) {
            setRollbackModal({ open: false, rev: null, versionIndex: 0, submitting: false });
          }
        }}
        title={`ยืนยันการย้อนเนื้อหากลับไปยังเวอร์ชัน v${rollbackModal.versionIndex}`}
        description="ระบบจะนำเนื้อหาของเวอร์ชันนี้มาบันทึกเป็นเวอร์ชันใหม่ล่าสุด โดยไม่ลบประวัติการแก้ไขก่อนหน้า"
      >
        <div className="space-y-4">
          {rollbackModal.rev && (
            <div className="rounded border border-pen/20 bg-pen/5 p-3.5 text-xs text-ink space-y-1.5">
              <p className="font-semibold text-pen">ข้อมูลเวอร์ชันที่จะย้อนกลับ:</p>
              <p>• <strong>เวอร์ชัน:</strong> v{rollbackModal.versionIndex}</p>
              <p>• <strong>ผู้เขียน:</strong> {rollbackModal.rev.editor_name || "ไม่ระบุ"}</p>
              <p>• <strong>บันทึกเมื่อ:</strong> {formatThaiDate(rollbackModal.rev.created_at)}</p>
              <p>• <strong>คำอธิบายเดิม:</strong> {rollbackModal.rev.summary || "-"}</p>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-soft">ตัวอย่างเนื้อหาที่จะถูกนำมาใช้:</p>
            <div className="max-h-48 overflow-y-auto rounded border border-paper-rule bg-paper/60 p-3 font-mono text-xs leading-relaxed text-ink-soft whitespace-pre-line">
              {rollbackModal.rev?.content || "ไม่มีเนื้อหา"}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-paper-rule">
            <Button
              variant="quiet"
              disabled={rollbackModal.submitting}
              onClick={() => setRollbackModal({ open: false, rev: null, versionIndex: 0, submitting: false })}
            >
              ยกเลิก
            </Button>
            <Button
              disabled={rollbackModal.submitting}
              onClick={async () => {
                if (!rollbackModal.rev || !onRollback) return;
                setRollbackModal((prev) => ({ ...prev, submitting: true }));
                try {
                  const summary = `ย้อนกลับไปยังเวอร์ชัน v${rollbackModal.versionIndex} (${formatThaiDate(rollbackModal.rev.created_at)})`;
                  await onRollback(rollbackModal.rev.content, summary);
                  setRollbackModal({ open: false, rev: null, versionIndex: 0, submitting: false });
                } catch (err) {
                  alert(err instanceof Error ? err.message : "ย้อนเวอร์ชันไม่สำเร็จ");
                  setRollbackModal((prev) => ({ ...prev, submitting: false }));
                }
              }}
            >
              {rollbackModal.submitting ? "กำลังย้อนกลับ…" : "ยืนยันย้อนกลับเวอร์ชันนี้"}
            </Button>
          </div>
        </div>
      </Modal>
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
  onRollback?: (content: string, summary: string) => Promise<void>;
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
  onRollback,
}: NoteViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);
  const speech = useSpeech();

  const handleRollback = async (content: string, summary: string) => {
    speech.stop();
    if (onRollback) {
      await onRollback(content, summary);
      setRollbackSuccess(`ย้อนกลับเนื้อหาสำเร็จ (${summary})`);
      setTimeout(() => setRollbackSuccess(null), 6000);
    }
  };

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
              {showHistory ? "ซ่อนประวัติ" : `ประวัติการแก้ไข (${note.revisions.length})`}
            </Button>
          )}
          <Button
            onClick={() => {
              speech.stop();
              onEdit();
            }}
          >
            แก้ไขเนื้อหา
          </Button>
        </>
      }
    >
      {rollbackSuccess && (
        <div className="mb-5 flex items-center justify-between rounded border border-ok/30 bg-ok-soft px-4 py-3 text-sm text-ok">
          <span>✅ {rollbackSuccess}</span>
          <button onClick={() => setRollbackSuccess(null)} className="text-ok font-bold hover:opacity-80">
            ×
          </button>
        </div>
      )}

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
      {showHistory && note.revisions && (
        <RevisionList revisions={note.revisions} onRollback={handleRollback} />
      )}
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