/**
 * ============================================================
 * STORE — ข้อมูลตั้งต้น + การอ่าน/แก้ไขข้อมูล (in-memory)
 * ============================================================
 * นี่คือ "ฐานข้อมูล" ของ API ตอนนี้เก็บไว้ในหน่วยความจำ (รีสตาร์ตแล้วหาย)
 * ต่อฐานข้อมูลจริง: แทนที่อาเรย์ด้านล่างด้วยการ query จาก Postgres/MySQL/ฯลฯ
 * แล้วเปลี่ยนฟังก์ชันในไฟล์นี้ให้เป็น async ทั้งหมด route จะยังเรียกใช้ได้เหมือนเดิม
 */
import type { Note, Revision, Subject, Topic } from "./types.js";

// ---- รายวิชา + หัวข้อบทเรียน -------------------------------------------

export const subjects: Subject[] = [
  { id: 1, code: "CS204", name: "โครงสร้างข้อมูลและขั้นตอนวิธี", term: "1/2569" },
  { id: 2, code: "CS310", name: "ระบบฐานข้อมูล", term: "1/2569" },
  { id: 3, code: "CS255", name: "วิศวกรรมซอฟต์แวร์", term: "1/2569" },
];

export const topics: Topic[] = [
  { id: 1, subjectId: 1, order: 1, title: "Array และ Linked List", noteId: 101 },
  { id: 2, subjectId: 1, order: 2, title: "Stack และ Queue", noteId: 102 },
  { id: 3, subjectId: 1, order: 3, title: "Tree และ Binary Search Tree", noteId: 103 },
  { id: 5, subjectId: 2, order: 1, title: "รู้จักระบบฐานข้อมูล", noteId: 201 },
  { id: 6, subjectId: 2, order: 2, title: "ER Diagram", noteId: 202 },
  { id: 7, subjectId: 2, order: 3, title: "Normalization", noteId: 203 },
  { id: 8, subjectId: 3, order: 1, title: "SDLC Models", noteId: 301 },
];

export function getSubject(subjectId: number): Subject | undefined {
  return subjects.find((s) => s.id === subjectId);
}

export function getTopics(subjectId: number): Topic[] {
  return topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order);
}

// ---- โน้ต ---------------------------------------------------------------

const normalization = [
  "Normalization คือกระบวนการจัดโครงสร้างตารางเพื่อลดความซ้ำซ้อนของข้อมูล",
  "",
  "1NF — ทุกคอลัมน์เก็บค่าเดียว (atomic value) ห้ามเก็บเป็นลิสต์",
  "2NF — ผ่าน 1NF และไม่มี partial dependency กับคีย์หลักแบบผสม",
  "3NF — ผ่าน 2NF และไม่มี transitive dependency ระหว่างคอลัมน์ที่ไม่ใช่คีย์",
].join("\n");

export const notes: Note[] = [
  {
    id: 203,
    subjectId: 2,
    title: "Normalization",
    content: normalization,
    revisions: [
      { id: 2, editor: "มิว ธ.", date: "8 ก.ย. 69 14:30", summary: "เพิ่มตัวอย่าง 3NF", content: normalization },
      {
        id: 1,
        editor: "ปาล์ม พ.",
        date: "5 ก.ย. 69 09:10",
        summary: "สร้างโน้ตครั้งแรก",
        content: "Normalization คือกระบวนการจัดโครงสร้างตารางเพื่อลดความซ้ำซ้อนของข้อมูล\n\n1NF — ทุกคอลัมน์เก็บค่าเดียว",
      },
    ],
  },
  {
    id: 103,
    subjectId: 1,
    title: "Tree และ Binary Search Tree",
    content: [
      "Tree คือโครงสร้างข้อมูลแบบลำดับชั้น ประกอบด้วย Node และ Edge",
      "",
      "Binary Search Tree (BST) คือ Tree ที่แต่ละโหนดมีลูกได้ไม่เกิน 2 โหนด",
      "กติกา: ค่าทางซ้ายน้อยกว่าโหนดแม่ ค่าทางขวามากกว่าโหนดแม่",
      "ค้นหาเฉลี่ย O(log n) แต่ถ้าต้นไม้เอียงจนเป็นเส้นตรงจะกลายเป็น O(n)",
    ].join("\n"),
    revisions: [
      {
        id: 1,
        editor: "ตั้นน้ำ ก.",
        date: "6 ก.ย. 69 16:05",
        summary: "สร้างจากภาพที่สแกน",
        content: "Tree คือโครงสร้างข้อมูลแบบลำดับชั้น ประกอบด้วย Node และ Edge",
      },
    ],
  },
];

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function getNote(noteId: number): Note | undefined {
  return notes.find((n) => n.id === noteId);
}

/** บันทึกเวอร์ชันใหม่แบบวิกิ — ของเดิมไม่ถูกทับ เก็บไว้ใน revisions */
export function saveRevision(noteId: number, content: string, summary: string, editor: string): Note | undefined {
  const note = getNote(noteId);
  if (!note) return undefined;
  const nextId = note.revisions.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const revision: Revision = {
    id: nextId,
    editor,
    date: thaiDate.format(new Date()),
    summary: summary.trim() || "แก้ไขเนื้อหา",
    content,
  };
  note.content = content;
  note.revisions = [revision, ...note.revisions];
  return note;
}

export function createNote(subjectId: number, title: string, content: string, editor: string): Note {
  const note: Note = {
    id: Date.now(),
    subjectId,
    title,
    content,
    revisions: [{ id: 1, editor, date: thaiDate.format(new Date()), summary: "สร้างจากภาพที่สแกน", content }],
  };
  notes.unshift(note);
  return note;
}

// ---- ข้อมูลหน้าภาพรวม (dashboard) --------------------------------------

export const dashboardStats = [
  { label: "โน้ตทั้งหมด", value: "1,284" },
  { label: "ผู้ใช้งาน", value: "612" },
  { label: "ครั้งที่ฟังเสียง", value: "3,905" },
  { label: "วิชาที่คนอ่านมากที่สุด", value: "CS204" },
];

export const recentEdits = [
  { who: "มิว ธ.", what: 'แก้ไข "Normalization"', subject: "CS310", date: "8 ก.ย. 69" },
  { who: "ปาล์ม พ.", what: 'สร้างโน้ต "ER Diagram"', subject: "CS310", date: "7 ก.ย. 69" },
  { who: "ตั้นน้ำ ก.", what: 'อัปโหลดภาพ "Tree Structure"', subject: "CS204", date: "6 ก.ย. 69" },
];
