/**
 * ============================================================
 * VIEWS — คลังโน้ต (Notes Hub - สไตล์ Clearnote)
 * ============================================================
 * แสดงรายการโน้ตทั้งหมดในรูปแบบ Grid Cards เน้นการแชร์และดาวน์โหลดไฟล์
 * พรีวิวเอกสาร PDF/รูปภาพได้ทันที โดยไม่มีประวัติ Revision ยุ่งยาก
 */
import { useEffect, useState } from "react";
import { api, formatThaiDate } from "../api";
import { BackLink, Button, Field, Modal, PageShell, TextAreaField } from "../ui";
import { mergeImagesToPdf } from "../utils/pdf";
import type { Note, Subject, User, ViewName } from "../types";

// ---- Helper: ตรวจสอบประเภทไฟล์ ----
function getFileType(url?: string | null): "pdf" | "image" | "none" {
  if (!url) return "none";
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) return "image";
  return "pdf";
}

// ---- Helper: ดาวน์โหลดไฟล์จริงลงเครื่องผ่าน Blob (ไม่เด้งเปิดแท็บใหม่) ----
async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);
  } catch {
    // Fallback: หาก fetch blob ข้าม Origin มีปัญหา ให้ fallback เปิดแท็บเพื่อดาวน์โหลด
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 200);
  }
}

// ---- NotesHubView: หน้ารวมการ์ดโน้ตทั้งหมด ----

interface NotesHubViewProps {
  user: User;
  subjects: Subject[];
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onSelectNote: (noteId: number) => void;
}

export function NotesHubView({
  user,
  subjects,
  onNavigate,
  onLogout,
  onSelectNote,
}: NotesHubViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<number | "all">("all");

  // Upload Modal State
  const [showModal, setShowModal] = useState(false);
  const [uploadSubject, setUploadSubject] = useState<number>(subjects[0]?.id || 0);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // ตั้งค่า Default Subject เมื่อ subjects โหลดเสร็จ
  useEffect(() => {
    if (subjects.length > 0 && uploadSubject === 0) {
      setUploadSubject(subjects[0].id);
    }
  }, [subjects, uploadSubject]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await api.getNotes({
        subject: selectedSubject === "all" ? undefined : selectedSubject,
        hasFile: true,
        search: search.trim() ? search.trim() : undefined,
      });
      setNotes(data);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedSubject]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNotes();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setModalError("กรุณาระบุชื่อโน้ตสรุป");
      return;
    }
    if (!uploadSubject) {
      setModalError("กรุณาเลือกรายวิชา");
      return;
    }
    if (uploadFiles.length === 0) {
      setModalError("กรุณาเลือกไฟล์เอกสารแนบ (PDF หรือ รูปภาพ)");
      return;
    }

    setModalError(null);
    setUploading(true);
    try {
      let fileToSend: File;
      const isSinglePdf =
        uploadFiles.length === 1 &&
        (uploadFiles[0].type === "application/pdf" ||
          uploadFiles[0].name.toLowerCase().endsWith(".pdf"));

      if (isSinglePdf) {
        fileToSend = uploadFiles[0];
      } else {
        // หากเลือกรูปภาพ (1 รูป หรือ หลายรูป) ให้รวมเป็น PDF เล่มเดียวอัตโนมัติ
        setProgressText(
          uploadFiles.length > 1
            ? `กำลังรวม ${uploadFiles.length} รูปภาพเป็นเอกสาร PDF…`
            : "กำลังเตรียมไฟล์เอกสาร PDF…"
        );
        const pdfFileName = `${uploadTitle.trim().replace(/[/\\?%*:|"<>]/g, "_")}.pdf`;
        fileToSend = await mergeImagesToPdf(uploadFiles, pdfFileName);
      }

      setProgressText("กำลังอัปโหลดไฟล์ขึ้นสู่ระบบ…");
      const created = await api.createNote(
        uploadSubject,
        uploadTitle.trim(),
        uploadContent,
        fileToSend
      );
      setModalSuccess(
        `อัปโหลดโน้ตสรุปเรียบร้อยแล้ว! ${
          uploadFiles.length > 1 ? `(รวม ${uploadFiles.length} หน้าเป็น PDF)` : ""
        }`
      );
      setTimeout(() => {
        setShowModal(false);
        setUploadTitle("");
        setUploadContent("");
        setUploadFiles([]);
        setProgressText("");
        setModalSuccess(null);
        setUploading(false);
        loadNotes();
        onSelectNote(created.id);
      }, 700);
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
      setUploading(false);
      setProgressText("");
    }
  };

  return (
    <PageShell
      user={user}
      current="notes"
      onNavigate={onNavigate}
      onLogout={onLogout}
      width="wide"
      title="คลังโน้ตสรุป (Notes Hub)"
      description="ศูนย์รวมโน้ตสรุปบทเรียนและเอกสารประกอบการเรียนจากรุ่นพี่และเพื่อนร่วมภาควิชา"
      actions={
        <Button
          onClick={() => {
            setModalError(null);
            setModalSuccess(null);
            setShowModal(true);
          }}
        >
          + อัปโหลดโน้ตสรุป
        </Button>
      }
    >
      {/* แถบค้นหาและตัวกรอง */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-sheet border border-paper-rule bg-white p-4 shadow-sheet">
        <form onSubmit={handleSearchSubmit} className="flex min-w-[240px] flex-1 items-center gap-2">
          <input
            type="text"
            placeholder="ค้นหาชื่อโน้ตสรุป หรือหัวข้อบทเรียน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-paper-rule px-3 py-2 text-sm text-ink outline-none focus:border-pen"
          />
          <Button type="submit" variant="quiet">
            ค้นหา
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSubject(val === "all" ? "all" : Number(val));
            }}
            className="rounded border border-paper-rule bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pen"
          >
            <option value="all">ทุกรายวิชา ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid รายการโน้ตสไตล์ Clearnote */}
      {loading ? (
        <div className="py-12 text-center text-ink-soft">กำลังโหลดคลังโน้ตสรุป…</div>
      ) : notes.length === 0 ? (
        <div className="rounded-sheet border border-dashed border-paper-rule bg-white p-12 text-center shadow-sheet">
          <p className="text-base text-ink-soft mb-3">ยังไม่พบโน้ตสรุปตามเงื่อนไขที่เลือก</p>
          <Button
            onClick={() => {
              setModalError(null);
              setModalSuccess(null);
              setShowModal(true);
            }}
          >
            เริ่มอัปโหลดโน้ตเป็นคนแรก
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const fileType = getFileType(note.source_file);
            const author = note.author_name || note.revisions?.[note.revisions.length - 1]?.editor_name || "นักศึกษา";
            const latestEditor = note.revisions?.[0]?.editor_name;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className="group flex flex-col justify-between rounded-sheet border border-paper-rule bg-white p-5 shadow-sheet hover:border-ink-mute hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  {/* แถบด้านบน: แท็กวิชา + ชนิดไฟล์ */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded bg-paper px-2 py-0.5 text-xs font-semibold text-pen tracking-wide">
                      {note.subject_code || "วิชา"}
                    </span>
                    {fileType === "pdf" && (
                      <span className="flex items-center gap-1 rounded bg-red-100 text-red-700 px-2 py-0.5 text-[11px] font-bold tracking-wider">
                        PDF
                      </span>
                    )}
                    {fileType === "image" && (
                      <span className="flex items-center gap-1 rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px] font-bold tracking-wider">
                        IMAGE
                      </span>
                    )}
                    {fileType === "none" && (
                      <span className="rounded bg-paper-rule text-ink-mute px-2 py-0.5 text-[11px]">
                        สรุป
                      </span>
                    )}
                  </div>

                  {/* ชื่อโน้ต */}
                  <h3 className="text-base font-semibold leading-snug text-ink group-hover:text-pen transition-colors line-clamp-2">
                    {note.title}
                  </h3>

                  {/* ตัวอย่างเนื้อหาย่อ */}
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft line-clamp-3">
                    {note.content || "ไม่มีคำอธิบายเพิ่มเติม"}
                  </p>
                </div>

                {/* Footer ข้อมูลวันที่และผู้แชร์ */}
                <div className="mt-4 pt-3 border-t border-paper-rule flex items-center justify-between text-xs text-ink-mute">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium text-ink truncate">โดย {author}</span>
                    {latestEditor && latestEditor !== author && (
                      <span className="text-[11px] text-ink-mute truncate hidden sm:inline">
                        (แก้: {latestEditor})
                      </span>
                    )}
                    <span>·</span>
                    <span>{formatThaiDate(note.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {note.source_file && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const fileUrl = note.source_file;
                          if (!fileUrl) return;
                          const targetName = decodeURIComponent(
                            fileUrl.split("/").pop()?.split("?")[0] ||
                              `${note.title.trim()}.${fileType === "pdf" ? "pdf" : "png"}`
                          );
                          downloadFile(fileUrl, targetName);
                        }}
                        title="ดาวน์โหลดไฟล์เอกสารลงเครื่อง"
                        className="rounded border border-paper-rule bg-white px-2 py-0.5 text-[11px] font-medium text-ink hover:border-pen hover:text-pen hover:bg-paper transition-all"
                      >
                        โหลด
                      </button>
                    )}
                    <span className="text-pen font-medium group-hover:underline">
                      เปิดดู →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal อัปโหลดโน้ตสรุป */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!uploading) {
            setShowModal(false);
            setModalError(null);
            setModalSuccess(null);
          }
        }}
        title="อัปโหลดโน้ตสรุป (Notes Hub)"
        description="แบ่งปันชีทสรุปหรือไฟล์เอกสารประกอบการเรียนให้กับเพื่อนร่วมสาขา"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink-soft">รายวิชา *</label>
            <select
              value={uploadSubject}
              onChange={(e) => setUploadSubject(Number(e.target.value))}
              disabled={uploading}
              className="w-full rounded border border-paper-rule bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pen"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} (ภาค {s.term})
                </option>
              ))}
            </select>
          </div>

          <Field
            label="ชื่อโน้ตสรุป *"
            placeholder="เช่น สรุปสูตร Midterm, สรุปเนื้อหาบทที่ 1-3"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            disabled={uploading}
            required
          />

          <TextAreaField
            label="คำอธิบายสรุป / ประเด็นสำคัญ"
            placeholder="เขียนคำอธิบายสั้นๆ เกี่ยวกับโน้ตชุดนี้ เช่น เน้นออกสอบจุดไหน..."
            className="h-24"
            value={uploadContent}
            onChange={(e) => setUploadContent(e.target.value)}
            disabled={uploading}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-ink-soft">
                เลือกไฟล์เอกสาร (PDF หรือ รูปภาพหลายรูป)
              </label>
              {uploadFiles.length > 0 && (
                <span className="text-xs font-semibold text-pen">
                  {uploadFiles.length === 1 &&
                  (uploadFiles[0].type === "application/pdf" ||
                    uploadFiles[0].name.toLowerCase().endsWith(".pdf"))
                    ? "เลือกแล้ว 1 ไฟล์ PDF"
                    : `เลือกแล้ว ${uploadFiles.length} รูปภาพ (รวมเป็น 1 PDF)`}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5 rounded border border-dashed border-paper-rule bg-paper/50 p-4">
              <input
                id="notes_hub_file_input"
                type="file"
                multiple
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  const selectedList = e.target.files ? Array.from(e.target.files) : [];
                  if (selectedList.length === 0) return;

                  const hasPdf = selectedList.some(
                    (f) =>
                      f.type === "application/pdf" ||
                      f.name.toLowerCase().endsWith(".pdf")
                  );
                  if (hasPdf && selectedList.length > 1) {
                    setModalError(
                      "หากต้องการแนบไฟล์ PDF กรุณาเลือกไฟล์ PDF เพียง 1 ไฟล์ (หรือเลือกรูปภาพหลายรูป)"
                    );
                    return;
                  }

                  setModalError(null);
                  setUploadFiles((prev) => {
                    if (hasPdf) return [selectedList[0]];
                    const nonPdfs = prev.filter(
                      (f) =>
                        f.type !== "application/pdf" &&
                        !f.name.toLowerCase().endsWith(".pdf")
                    );
                    return [...nonPdfs, ...selectedList];
                  });
                }}
                disabled={uploading}
                className="block w-full text-sm text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-paper hover:file:bg-ink-soft cursor-pointer"
              />

              {uploadFiles.length > 0 && (
                <div className="space-y-2 mt-1">
                  <div className="flex items-center justify-between text-xs text-ink-mute">
                    <span>
                      {uploadFiles.length > 1
                        ? `ลำดับหน้าในเล่ม (${uploadFiles.length} หน้า):`
                        : "เอกสารที่เลือก:"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFiles([]);
                        const el = document.getElementById(
                          "notes_hub_file_input"
                        ) as HTMLInputElement | null;
                        if (el) el.value = "";
                      }}
                      className="text-redpen hover:underline"
                    >
                      ล้างไฟล์ทั้งหมด
                    </button>
                  </div>

                  <ul className="max-h-44 overflow-y-auto divide-y divide-paper-rule rounded border border-paper-rule bg-white">
                    {uploadFiles.map((file, idx) => (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between px-3 py-2 text-xs text-ink"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-paper-rule text-[10px] font-bold text-ink-mute">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[200px] sm:max-w-xs font-medium">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-ink-mute shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFiles((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="ml-2 text-redpen hover:underline shrink-0"
                        >
                          ลบ
                        </button>
                      </li>
                    ))}
                  </ul>

                  {uploadFiles.length > 1 && (
                    <div className="rounded bg-ok-soft/70 px-3 py-2 text-xs text-ok flex items-center gap-1.5 border border-ok/20">
                      <span>
                        ระบบจะแปลงและรวมทั้ง <strong>{uploadFiles.length} รูปภาพ</strong> เป็นไฟล์ PDF สรุปบทเรียน 1 เล่มให้อัตโนมัติ
                      </span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-ink-mute">
                สามารถเลือกรูปภาพหลายรูปพร้อมกัน (Ctrl/Shift + คลิก) เพื่อรวมเป็นสมุดโน้ต PDF เล่มเดียว หรือเลือกไฟล์ PDF
              </p>
            </div>
          </div>

          {modalError && (
            <div className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">
              {modalError}
            </div>
          )}

          {modalSuccess && (
            <div className="rounded border border-ok/30 bg-ok-soft px-3 py-2 text-sm text-ok">
              {modalSuccess}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-paper-rule pt-4">
            <Button
              type="button"
              variant="quiet"
              onClick={() => setShowModal(false)}
              disabled={uploading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={uploading || !uploadTitle.trim() || uploadFiles.length === 0}
            >
              {uploading ? (progressText || "กำลังบันทึกและอัปโหลด…") : "บันทึกและอัปโหลด"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}

// ---- NoteFileDetailView: หน้ารายละเอียดโน้ตแบบคลังไฟล์ (Preview & Download) ----

interface NoteFileDetailViewProps {
  user: User;
  noteId: number | undefined;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onBack: () => void;
  onDelete?: (noteId: number) => Promise<void> | void;
}

export function NoteFileDetailView({
  user,
  noteId,
  onNavigate,
  onLogout,
  onBack,
  onDelete,
}: NoteFileDetailViewProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State สำหรับการแก้ไขข้อมูลโน้ต
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // State สำหรับการดาวน์โหลดไฟล์ลงเครื่อง
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!noteId) return;
    setLoading(true);
    api
      .getNote(noteId)
      .then(setNote)
      .catch(() => setNote(null))
      .finally(() => setLoading(false));
  }, [noteId]);

  if (loading) {
    return (
      <PageShell
        user={user}
        current="note-detail"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title="กำลังโหลดโน้ต…"
        breadcrumb={<BackLink label="กลับไปคลังโน้ต" onClick={onBack} />}
      >
        <div className="py-12 text-center text-ink-soft">กำลังโหลดข้อมูลเอกสาร…</div>
      </PageShell>
    );
  }

  if (!note) {
    return (
      <PageShell
        user={user}
        current="note-detail"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title="ไม่พบโน้ตนี้"
        breadcrumb={<BackLink label="กลับไปคลังโน้ต" onClick={onBack} />}
      >
        <div className="rounded-sheet border border-dashed border-paper-rule bg-white p-8 text-center">
          <p className="text-ink-soft mb-3">โน้ตที่คุณกำลังหาอาจถูกลบหรือไม่มีอยู่ในระบบ</p>
          <Button onClick={onBack}>กลับไปยังคลังโน้ต</Button>
        </div>
      </PageShell>
    );
  }

  const fileType = getFileType(note.source_file);
  const authorName = note.author_name || note.revisions?.[note.revisions.length - 1]?.editor_name || "ไม่ระบุผู้เขียน";
  const lastEditorName = note.revisions?.[0]?.editor_name;
  const fileName = note.source_file
    ? decodeURIComponent(note.source_file.split("/").pop()?.split("?")[0] || "ไฟล์เอกสาร")
    : null;

  // ตรวจสอบสิทธิ์ Author หรือ Admin
  const canEdit = Boolean(
    user.role === "admin" ||
      (note.author_id && note.author_id === user.id) ||
      (note.author && note.author === user.id)
  );

  const canDelete = Boolean(
    user.role === "admin" ||
      (note.author_id && note.author_id === user.id) ||
      (note.author && note.author === user.id)
  );

  const handleOpenEdit = () => {
    setEditTitle(note.title);
    setEditContent(note.content || "");
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError("กรุณาระบุชื่อโน้ตสรุป");
      return;
    }
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const updated = await api.updateNote(note.id, {
        title: editTitle.trim(),
        content: editContent,
        summary: "แก้ไขข้อมูลโน้ต",
      });
      setNote(updated);
      setShowEditModal(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDownload = async () => {
    if (!note.source_file || isDownloading) return;
    setIsDownloading(true);
    const targetName =
      fileName || `${note.title.trim()}.${fileType === "pdf" ? "pdf" : "png"}`;
    try {
      await downloadFile(note.source_file, targetName);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <PageShell
      user={user}
      current="note-detail"
      onNavigate={onNavigate}
      onLogout={onLogout}
      width="wide"
      title={note.title}
      description={`${note.subject_code ? `${note.subject_code} — ` : ""}สร้างโดย ${authorName} เมื่อ ${formatThaiDate(note.created_at)}${
        lastEditorName && lastEditorName !== authorName ? ` · แก้ไขล่าสุดโดย ${lastEditorName}` : ""
      }`}
      breadcrumb={<BackLink label="กลับไปคลังโน้ตทั้งหมด" onClick={onBack} />}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {note.source_file && (
            <>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="shadow-xs"
              >
                <span>{isDownloading ? "กำลังดาวน์โหลด…" : "ดาวน์โหลดไฟล์"}</span>
              </Button>
              <a
                href={note.source_file}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-paper-rule bg-white px-3 py-2 text-sm font-medium text-ink hover:border-ink-mute transition-colors"
              >
                <span>เปิดแท็บใหม่</span>
                <span aria-hidden>↗</span>
              </a>
            </>
          )}
          {canEdit && (
            <Button
              variant="quiet"
              onClick={handleOpenEdit}
              className="border border-paper-rule text-ink hover:border-pen hover:text-pen"
            >
              แก้ไขข้อมูล
            </Button>
          )}
          {canDelete && (
            <Button
              variant="quiet"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="text-redpen border border-redpen/30 hover:bg-redpen-soft hover:border-redpen"
            >
              ลบโน้ต
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* แถบแจ้งเตือนข้อมูลไฟล์ */}
        {note.source_file ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-sheet border border-paper-rule bg-white p-4 shadow-sheet">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pen text-white font-bold text-xs shadow-xs">
                {fileType === "pdf" ? "PDF" : "IMG"}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{fileName}</p>
                <p className="text-xs text-ink-mute">คลิกดาวน์โหลดหรือเปิดดูเนื้อหาในเอกสารด้านล่าง</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-xs font-semibold text-pen hover:underline cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? "กำลังดาวน์โหลด…" : "ดาวน์โหลดลงเครื่อง"}
            </button>
          </div>
        ) : (
          <div className="rounded-sheet border border-dashed border-paper-rule bg-white p-4 text-xs text-ink-soft">
            โน้ตนี้เป็นบันทึกข้อความสรุป (ยังไม่มีไฟล์แนบต้นฉบับ)
          </div>
        )}

        {/* ตัวพรีวิวไฟล์ (File Preview) */}
        {note.source_file && (
          <div className="overflow-hidden rounded-sheet border border-paper-rule bg-white shadow-sheet">
            <div className="border-b border-paper-rule bg-paper/60 px-4 py-2.5 flex items-center justify-between text-xs text-ink-soft font-medium">
              <div className="flex items-center gap-2">
                <span>ตัวอย่างเอกสาร (Preview)</span>
                <span className="text-ink-mute">·</span>
                <span className="font-semibold text-ink">{fileName}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="text-pen hover:underline font-semibold"
                >
                  โหลดไฟล์
                </button>
                <a
                  href={note.source_file}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink hover:text-pen"
                >
                  เปิดแท็บใหม่ ↗
                </a>
              </div>
            </div>

            {fileType === "pdf" ? (
              <div className="relative w-full bg-paper/30">
                <iframe
                  src={note.source_file}
                  className="w-full h-[700px] border-0"
                  title={`พรีวิว: ${note.title}`}
                />
              </div>
            ) : fileType === "image" ? (
              <div className="flex justify-center p-6 bg-paper/30">
                <img
                  src={note.source_file}
                  alt={note.title}
                  className="max-h-[700px] max-w-full rounded object-contain shadow-xs"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-ink-soft">
                <p>ไฟล์นี้ไม่รองรับการแสดงตัวอย่างในเบราว์เซอร์</p>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="mt-3 inline-block rounded bg-ink px-4 py-2 text-xs font-medium text-paper"
                >
                  {isDownloading ? "กำลังดาวน์โหลด…" : "คลิกเพื่อดาวน์โหลดไฟล์"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* คำอธิบายและเนื้อหาโน้ตย่อ */}
        <div className="rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-ink">คำอธิบายและเนื้อหาโน้ตย่อ</h2>
            {canEdit && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="text-xs font-medium text-pen hover:underline"
              >
                แก้ไขคำอธิบาย
              </button>
            )}
          </div>
          <div className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {note.content || "ไม่มีคำอธิบายเพิ่มเติม"}
          </div>
        </div>

        {/* Modal แก้ไขข้อมูลโน้ต */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            if (!isSavingEdit) {
              setShowEditModal(false);
              setEditError(null);
            }
          }}
          title="แก้ไขข้อมูลโน้ตสรุป"
          description="แก้ไขชื่อโน้ตและคำอธิบายสรุปบทเรียน"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Field
              label="ชื่อโน้ตสรุป *"
              placeholder="ระบุชื่อโน้ตสรุป..."
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={isSavingEdit}
              required
            />

            <TextAreaField
              label="คำอธิบายสรุป / ประเด็นสำคัญ"
              placeholder="เขียนคำอธิบายเกี่ยวกับโน้ตชุดนี้ เช่น จุดที่เน้นออกสอบ..."
              className="h-36"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSavingEdit}
            />

            {editError && (
              <div className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">
                {editError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-paper-rule pt-4">
              <Button
                type="button"
                variant="quiet"
                disabled={isSavingEdit}
                onClick={() => setShowEditModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSavingEdit || !editTitle.trim()}
              >
                {isSavingEdit ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal ยืนยันการลบโน้ต */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
          title="ยืนยันการลบโน้ตสรุป"
          description={`คุณต้องการลบโน้ต "${note.title}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        >
          <div className="space-y-4">
            <div className="rounded border border-redpen/20 bg-redpen-soft p-3.5 text-xs text-redpen leading-relaxed">
              <strong>คำเตือน:</strong> การลบโน้ตจะลบไฟล์แนบต้นฉบับและข้อมูลทั้งหมดออกจากระบบอย่างถาวร
            </div>

            {deleteError && (
              <div className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-paper-rule pt-4">
              <Button
                type="button"
                variant="quiet"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                className="bg-redpen text-white hover:bg-red-700"
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError(null);
                  try {
                    await api.deleteNote(note.id);
                    if (onDelete) await onDelete(note.id);
                    setShowDeleteModal(false);
                    onBack();
                  } catch (err) {
                    setDeleteError(err instanceof Error ? err.message : "ลบโน้ตไม่สำเร็จ");
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "กำลังลบ…" : "ยืนยันลบโน้ต"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageShell>
  );
}
