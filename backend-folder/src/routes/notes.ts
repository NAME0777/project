/**
 * ---- /api/notes — อ่านโน้ต, บันทึกเวอร์ชันใหม่, สร้างโน้ตใหม่ ------------
 */
import { Router } from "express";
import { createNote, getNote, saveRevision } from "../store.js";

export const notesRouter = Router();

notesRouter.get("/:id", (req, res) => {
  const note = getNote(Number(req.params.id));
  if (!note) return res.status(404).json({ error: "ไม่พบโน้ตนี้" });
  res.json(note);
});

notesRouter.post("/:id/revisions", (req, res) => {
  const { content, summary, editor } = req.body as { content?: string; summary?: string; editor?: string };
  if (!content?.trim()) return res.status(400).json({ error: "เนื้อหาโน้ตห้ามว่าง" });
  if (!editor?.trim()) return res.status(400).json({ error: "ไม่ทราบผู้แก้ไข" });

  const note = saveRevision(Number(req.params.id), content, summary ?? "", editor);
  if (!note) return res.status(404).json({ error: "ไม่พบโน้ตนี้" });
  res.json(note);
});

notesRouter.post("/", (req, res) => {
  const { subjectId, title, content, editor } = req.body as {
    subjectId?: number;
    title?: string;
    content?: string;
    editor?: string;
  };
  if (!subjectId) return res.status(400).json({ error: "ไม่ทราบวิชาที่จะบันทึกโน้ต" });
  if (!content?.trim()) return res.status(400).json({ error: "เนื้อหาโน้ตห้ามว่าง" });
  if (!editor?.trim()) return res.status(400).json({ error: "ไม่ทราบผู้สร้างโน้ต" });

  const note = createNote(subjectId, title?.trim() || "โน้ตจากภาพที่สแกน", content, editor);
  res.status(201).json(note);
});
