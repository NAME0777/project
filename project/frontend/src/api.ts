/**
 * ============================================================
 * API — จุดเดียวที่ frontend คุยกับ backend Django (ไฟล์อื่นห้าม fetch() ตรง ๆ)
 * ============================================================
 * ใช้ JWT (djangorestframework-simplejwt): เก็บ access/refresh token ไว้ใน
 * localStorage แนบ "Authorization: Bearer <access>" อัตโนมัติทุก request
 * ตอน dev: Vite proxy `/api` ไปที่ backend Django (ดู vite.config.ts)
 */
import type { Note, Role, Subject, Topic } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "notes-hub-tokens";

interface Tokens {
  access: string;
  refresh: string;
}

function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function saveTokens(tokens: Tokens | null) {
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const tokens = loadTokens();
  const headers: Record<string, string> = {};
  const isFormData = options?.body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (tokens) headers.Authorization = `Bearer ${tokens.access}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...options?.headers } });

  if (res.status === 401 && tokens) {
    // access token หมดอายุ — ล้าง token แล้วให้ฝั่ง UI พาไปหน้า login ใหม่
    saveTokens(null);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error?: string; detail?: string }).error ??
      (body as { error?: string; detail?: string }).detail ??
      Object.values(body as Record<string, unknown>)[0] ??
      `คำขอไม่สำเร็จ (${res.status})`;
    throw new Error(Array.isArray(message) ? message[0] : String(message));
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

interface AuthResponse {
  user: { id: number; email: string; full_name: string; role: Role; student_id: string | null };
  access: string;
  refresh: string;
}

export const api = {
  login: async (email: string, password: string) => {
    const data = await request<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveTokens({ access: data.access, refresh: data.refresh });
    return data.user;
  },

  register: async (form: { full_name: string; student_id: string; email: string; password: string }) => {
    const data = await request<AuthResponse>("/auth/register/", { method: "POST", body: JSON.stringify(form) });
    saveTokens({ access: data.access, refresh: data.refresh });
    return data.user;
  },

  logout: () => saveTokens(null),

  isLoggedIn: () => loadTokens() !== null,

  me: () => request<AuthResponse["user"]>("/auth/me/"),

  getSubjects: () => request<Subject[]>("/subjects/").then((r) => (Array.isArray(r) ? r : (r as { results: Subject[] }).results)),

  createSubject: (subject: { code: string; name: string; term: string }) =>
    request<Subject>("/subjects/", { method: "POST", body: JSON.stringify(subject) }),

  deleteSubject: (id: number) => request<void>(`/subjects/${id}/`, { method: "DELETE" }),

  getTopics: (subjectId: number) => request<Topic[]>(`/subjects/${subjectId}/topics/`),

  createTopic: (subject: number, order: number, title: string) =>
    request<Topic>("/subjects/topics/", { method: "POST", body: JSON.stringify({ subject, order, title }) }),

  updateTopic: (id: number, title: string) =>
    request<Topic>(`/subjects/topics/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  deleteTopic: (id: number) => request<void>(`/subjects/topics/${id}/`, { method: "DELETE" }),

  getNote: (noteId: number) => request<Note>(`/notes/${noteId}/`),

  deleteNote: (noteId: number) => request<void>(`/notes/${noteId}/`, { method: "DELETE" }),

  getNotes: (params?: { subject?: number; hasFile?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.subject) q.set("subject", String(params.subject));
    if (params?.hasFile) q.set("has_file", "true");
    if (params?.search) q.set("search", params.search);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request<Note[]>(`/notes/${qs}`).then((r) =>
      Array.isArray(r) ? r : (r as { results: Note[] }).results || []
    );
  },

  saveRevision: (noteId: number, content: string, summary: string) =>
    request<Note>(`/notes/${noteId}/revisions/`, { method: "POST", body: JSON.stringify({ content, summary }) }),

  createNote: (
    subject: number,
    title: string,
    content: string,
    sourceFile?: File | null,
    topicId?: number
  ) => {
    const form = new FormData();
    form.set("subject", String(subject));
    form.set("title", title);
    form.set("content", content);
    if (sourceFile) form.set("source_file", sourceFile);
    if (topicId) form.set("topic", String(topicId));
    return request<Note>("/notes/", { method: "POST", body: form });
  },

  updateNote: (
    noteId: number,
    data: { title?: string; content?: string; sourceFile?: File | null; summary?: string }
  ) => {
    const form = new FormData();
    if (data.title !== undefined) form.set("title", data.title);
    if (data.content !== undefined) form.set("content", data.content);
    if (data.summary !== undefined) form.set("summary", data.summary);
    if (data.sourceFile) form.set("source_file", data.sourceFile);
    return request<Note>(`/notes/${noteId}/`, { method: "PATCH", body: form });
  },

  runOcr: (file: File) => {
    const form = new FormData();
    form.set("file", file);
    return request<{ text: string }>("/ocr/", { method: "POST", body: form });
  },

  getDashboard: () =>
    request<{ stats: { label: string; value: string }[]; recentEdits: { who: string; what: string; subject: string; date: string }[] }>(
      "/dashboard/"
    ),
};

/** แปลง ISO date จาก Django ให้เป็นรูปแบบไทยอ่านง่าย */
export function formatThaiDate(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
