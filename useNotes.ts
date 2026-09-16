import { useCallback, useMemo, useState } from "react";
import type { Note, Revision } from "../types";
import { initialNotes } from "../data/notes";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** คลังโน้ตทั้งหมด + การบันทึกเวอร์ชันใหม่แบบวิกิ (ของเดิมไม่ถูกทับ) */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const byId = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);

  const getNote = useCallback((noteId: number | undefined) => {
    return noteId === undefined ? undefined : byId.get(noteId);
  }, [byId]);

  const saveRevision = useCallback(
    (noteId: number, content: string, summary: string, editor: string) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== noteId) return note;
          const nextId = note.revisions.reduce((max, r) => Math.max(max, r.id), 0) + 1;
          const revision: Revision = {
            id: nextId,
            editor,
            date: thaiDate.format(new Date()),
            summary: summary.trim() || "แก้ไขเนื้อหา",
            content,
          };
          return { ...note, content, revisions: [revision, ...note.revisions] };
        })
      );
    },
    []
  );

  const createNote = useCallback((subjectId: number, title: string, content: string, editor: string) => {
    const id = Date.now();
    setNotes((prev) => [
      {
        id,
        subjectId,
        title,
        content,
        revisions: [
          {
            id: 1,
            editor,
            date: thaiDate.format(new Date()),
            summary: "สร้างจากภาพที่สแกน",
            content,
          },
        ],
      },
      ...prev,
    ]);
    return id;
  }, []);

  return { notes, getNote, saveRevision, createNote };
}
