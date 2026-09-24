/**
 * ชนิดข้อมูลที่ backend ส่งให้ frontend — ต้องตรงกับ frontend/src/types.ts เสมอ
 * (โปรเจกต์เล็กพอที่จะดูแลสองไฟล์คู่กันได้ ถ้าโตขึ้นค่อยแยกเป็น shared package)
 */
export type Role = "student" | "admin";

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
