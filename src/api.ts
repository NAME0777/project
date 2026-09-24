/**
 * ============================================================
 * API — จุดเดียวที่ frontend คุยกับ backend (ไฟล์อื่นห้ามใช้ fetch() ตรง ๆ)
 * ============================================================
 * ตอน dev: Vite proxy `/api` ไปที่ backend (ดู vite.config.ts) ไม่ต้องตั้ง CORS
 * ตอน build จริง: ตั้ง VITE_API_URL ให้ชี้ไปโดเมนของ backend จริง
 */
import type { Note, Role, Subject, Topic } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `คำขอไม่สำเร็จ (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  login: (email: string, role: Role) =>
    request<{ user: { name: string; email: string; role: Role } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

  register: (form: { name: string; studentId: string; email: string; password: string }) =>
    request<{ ok: true }>("/auth/register", { method: "POST", body: JSON.stringify(form) }),

  getSubjects: () => request<Subject[]>("/subjects"),

  getTopics: (subjectId: number) => request<Topic[]>(`/subjects/${subjectId}/topics`),

  getNote: (noteId: number) => request<Note>(`/notes/${noteId}`),

  saveRevision: (noteId: number, content: string, summary: string, editor: string) =>
    request<Note>(`/notes/${noteId}/revisions`, {
      method: "POST",
      body: JSON.stringify({ content, summary, editor }),
    }),

  createNote: (subjectId: number, title: string, content: string, editor: string) =>
    request<Note>("/notes", { method: "POST", body: JSON.stringify({ subjectId, title, content, editor }) }),

  runOcr: (fileName: string) => request<{ text: string }>("/ocr", { method: "POST", body: JSON.stringify({ fileName }) }),

  getDashboard: () =>
    request<{ stats: { label: string; value: string }[]; recentEdits: { who: string; what: string; subject: string; date: string }[] }>(
      "/dashboard"
    ),
};
