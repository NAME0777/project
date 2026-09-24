/**
 * ============================================================
 * HOOKS — ตรรกะฝั่ง frontend ทั้งหมด (ไม่มี JSX เลยทั้งไฟล์)
 * ============================================================
 * ทุก hook ที่ต้องใช้ข้อมูลจะเรียกผ่าน `api` (./api.ts) เท่านั้น
 * ไม่มีข้อมูลฮาร์ดโค้ดในไฟล์นี้ — backend คือแหล่งข้อมูลจริงแหล่งเดียว
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Note, Role, Route, Subject, Topic, User, ViewName } from "./types";

type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>;

// ---- useRouter: หน้าปัจจุบัน + ประวัติสำหรับปุ่มย้อนกลับ -------------------

export function useRouter(initial: Route = { name: "login" }) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const route = stack[stack.length - 1];

  const go = useCallback((name: ViewName, params: Omit<Route, "name"> = {}) => {
    setStack((prev) => [...prev, { name, ...params }]);
  }, []);

  const reset = useCallback((name: ViewName, params: Omit<Route, "name"> = {}) => {
    setStack([{ name, ...params }]);
  }, []);

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  return { route, go, reset, back, canGoBack: stack.length > 1 };
}

// ---- useAuth: ผู้ใช้ที่ล็อกอินอยู่ (ยืนยันตัวตนผ่าน backend) ----------------

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const login = useCallback(async (email: string, role: Role) => {
    setPending(true);
    setError(null);
    try {
      const { user: loggedIn } = await api.login(email, role);
      setUser(loggedIn);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return { user, login, logout, error, pending };
}

// ---- useCatalog: รายวิชาทั้งหมด + หัวข้อของวิชาที่เลือก (ดึงจาก backend) ----

export function useCatalog(subjectId: number | undefined) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดรายวิชาทั้งหมดครั้งเดียวตอนเปิดแอป
  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  // โหลดหัวข้อใหม่ทุกครั้งที่เปลี่ยนวิชา
  useEffect(() => {
    if (subjectId === undefined) return;
    setLoading(true);
    api
      .getTopics(subjectId)
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const countTopics = useCallback(
    (id: number) => (id === subjectId ? topics.length : undefined),
    [subjectId, topics]
  );

  return { subjects, topics, loading, countTopics };
}

// ---- useNote: โน้ตหนึ่งฉบับ + บันทึกเวอร์ชันใหม่แบบวิกิ ---------------------

export function useNote(noteId: number | undefined) {
  const [note, setNote] = useState<Note | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (noteId === undefined) {
      setNote(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getNote(noteId)
      .then(setNote)
      .catch(() => setNote(undefined))
      .finally(() => setLoading(false));
  }, [noteId]);

  useEffect(load, [load]);

  const saveRevision = useCallback(
    async (content: string, summary: string, editor: string) => {
      if (noteId === undefined) return;
      const updated = await api.saveRevision(noteId, content, summary, editor);
      setNote(updated);
    },
    [noteId]
  );

  return { note, loading, saveRevision, reload: load };
}

// ---- useSpeech: อ่านออกเสียงด้วย Web Speech API (ทำงานในเบราว์เซอร์ล้วน) ----

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "th-TH";
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    },
    [supported]
  );

  const toggle = useCallback((text: string) => (isPlaying ? stop() : speak(text)), [isPlaying, speak, stop]);

  useEffect(() => stop, [stop]);

  return { isPlaying, supported, speak, stop, toggle };
}

// ---- useOcr: อัปโหลดภาพ → ตรวจไฟล์ → เรียก backend แปลงข้อความ --------------

const MAX_SIZE = 8 * 1024 * 1024;

export function useOcr() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("ไฟล์นี้ไม่ใช่รูปภาพ เลือกไฟล์ JPG หรือ PNG");
    if (file.size > MAX_SIZE) return setError("ไฟล์ใหญ่เกิน 8 MB ลองย่อขนาดภาพก่อน");
    setError(null);
    setFileName(file.name);
    setText(null);
  }, []);

  const run = useCallback(async () => {
    if (!fileName) return;
    setProcessing(true);
    setError(null);
    try {
      const { text: result } = await api.runOcr(fileName);
      setText(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "แปลงข้อความไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  }, [fileName]);

  const reset = useCallback(() => {
    setFileName(null);
    setText(null);
    setProcessing(false);
    setError(null);
  }, []);

  return { fileName, text, setText, processing, error, selectFile, run, reset };
}

// ---- useDashboard: สถิติภาพรวม (เฉพาะหน้า admin) ---------------------------

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
