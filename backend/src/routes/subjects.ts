/**
 * ---- /api/subjects — รายวิชาและหัวข้อบทเรียน (อ่านอย่างเดียว) -----------
 */
import { Router } from "express";
import { getNote, getTopics, subjects } from "../store.js";

export const subjectsRouter = Router();

subjectsRouter.get("/", (_req, res) => {
  res.json(subjects);
});

subjectsRouter.get("/:id/topics", (req, res) => {
  const subjectId = Number(req.params.id);
  if (Number.isNaN(subjectId)) return res.status(400).json({ error: "subjectId ไม่ถูกต้อง" });

  // แนบ hasNote ไปด้วย เพื่อให้ frontend รู้ว่าหัวข้อไหนกดเข้าไปอ่านได้ โดยไม่ต้องยิง request แยก
  const list = getTopics(subjectId).map((topic) => ({
    ...topic,
    hasNote: getNote(topic.noteId) !== undefined,
  }));
  res.json(list);
});
