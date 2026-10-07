export type Role = "student" | "admin";

export type ViewName =
  | "login"
  | "register"
  | "notes"
  | "note-detail"
  | "subjects"
  | "topics"
  | "note"
  | "editor"
  | "ocr"
  | "dashboard";

export interface Route {
  name: ViewName;
  subjectId?: number;
  topicId?: number;
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
  subject: number;
  order: number;
  title: string;
  note_id: number | null;
  has_note: boolean;
}

export interface Revision {
  id: number;
  editor_name: string;
  summary: string;
  content: string;
  created_at: string; // ISO date string จาก Django — format ตอนแสดงผลด้วย formatThaiDate()
}

export interface Note {
  id: number;
  subject: number;
  subject_code?: string;
  subject_name?: string;
  title: string;
  content: string;
  author?: number | null;
  author_id?: number | null;
  author_name?: string;
  source_file?: string | null;
  created_at: string;
  updated_at: string;
  revisions: Revision[];
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  student_id: string | null;
}
