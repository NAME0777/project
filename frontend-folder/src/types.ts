// ชนิดข้อมูลกลางของทั้งแอป — ไฟล์นี้ไม่ควร import อะไรเลย
export type Role = "student" | "admin";

export type ViewName =
  | "login"
  | "register"
  | "subjects"
  | "topics"
  | "note"
  | "editor"
  | "ocr"
  | "dashboard";

/** ตำแหน่งปัจจุบันของผู้ใช้ + พารามิเตอร์ที่หน้านั้นต้องใช้ */
export interface Route {
  name: ViewName;
  subjectId?: number;
  noteId?: number;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  term: string;
}

export interface Topic {
  id: number;
  subjectId: number;
  order: number;
  title: string;
  noteId: number;
  /** backend แนบมาให้ว่ามีโน้ตของหัวข้อนี้อยู่แล้วหรือยัง */
  hasNote?: boolean;
}

export interface Revision {
  id: number;
  editor: string;
  date: string;
  summary: string;
  content: string;
}

export interface Note {
  id: number;
  subjectId: number;
  title: string;
  content: string;
  revisions: Revision[];
}

export interface User {
  name: string;
  email: string;
  role: Role;
}
