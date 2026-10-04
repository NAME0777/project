/**
 * ============================================================
 * HOOKS — ตรรกะฝั่ง frontend ทั้งหมด (ไม่มี JSX เลยทั้งไฟล์)
 * ============================================================
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Note, Route, Subject, Topic, User, ViewName } from "./types";

type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>;

// ---- useRouter --------------------------------------------------------------

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

// ---- useAuth ------------------------------------------------------------------
// role มาจากบัญชีจริงใน DB เสมอ (ไม่ใช่ให้ผู้ใช้เลือกเองตอน login แบบเวอร์ชันก่อนหน้า)

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // ถ้ามี token ค้างจากครั้งก่อน (รีเฟรชหน้า) ลองขอโปรไฟล์ตัวเองมาเช็คว่ายังใช้ได้ไหม
  useEffect(() => {
    if (!api.isLoggedIn()) {
      setChecking(false);
      return;
    }
    api
      .me()
      .then((me) => setUser(me as User))
      .catch(() => api.logout())
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setPending(true);
    setError(null);
    try {
      const loggedIn = await api.login(email, password);
      setUser(loggedIn as User);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  return { user, login, logout, error, pending, checking };
}

// ---- useCatalog ------------------------------------------------------------

export function useCatalog(subjectId: number | undefined) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const reloadSubjects = useCallback(() => {
    setSubjectsLoading(true);
    return api
      .getSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setSubjectsLoading(false));
  }, []);

  const reloadTopics = useCallback(() => {
    if (subjectId === undefined) return Promise.resolve();
    setTopicsLoading(true);
    return api
      .getTopics(subjectId)
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));
  }, [subjectId]);

  useEffect(() => {
    reloadSubjects();
  }, [reloadSubjects]);

  useEffect(() => {
    reloadTopics();
  }, [reloadTopics]);

  const createSubject = useCallback(
    async (subject: { code: string; name: string; term: string }) => {
      await api.createSubject(subject);
      await reloadSubjects();
    },
    [reloadSubjects]
  );

  const deleteSubject = useCallback(
    async (id: number) => {
      await api.deleteSubject(id);
      await reloadSubjects();
    },
    [reloadSubjects]
  );

  const createTopic = useCallback(
    async (subject: number, order: number, title: string) => {
      await api.createTopic(subject, order, title);
      await reloadTopics();
    },
    [reloadTopics]
  );

  const updateTopic = useCallback(
    async (id: number, title: string) => {
      await api.updateTopic(id, title);
      await reloadTopics();
    },
    [reloadTopics]
  );

  const deleteTopic = useCallback(
    async (id: number) => {
      await api.deleteTopic(id);
      await reloadTopics();
    },
    [reloadTopics]
  );

  return {
    subjects,
    subjectsLoading,
    topics,
    topicsLoading,
    loading: subjectsLoading,
    createSubject,
    deleteSubject,
    createTopic,
    updateTopic,
    deleteTopic,
  };
}

// ---- useNote ------------------------------------------------------------------

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
    async (content: string, summary: string) => {
      if (noteId === undefined) return;
      const updated = await api.saveRevision(noteId, content, summary);
      setNote(updated);
    },
    [noteId]
  );

  return { note, loading, saveRevision, reload: load };
}

// ---- useSpeech (client-only, ไม่เกี่ยวกับ backend) ---------------------------

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

// ---- useOcr ------------------------------------------------------------------

const MAX_SIZE = 15 * 1024 * 1024;

export function useOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = useCallback((selected: File | null) => {
    if (!selected) return;
    const isImage = selected.type.startsWith("image/");
    const isPdf = selected.type === "application/pdf";
    if (!isImage && !isPdf) return setError("รองรับเฉพาะไฟล์รูปภาพ (JPG/PNG) หรือ PDF เท่านั้น");
    if (selected.size > MAX_SIZE) return setError("ไฟล์ใหญ่เกิน 15 MB ลองย่อขนาดหรือลดจำนวนหน้าก่อน");
    setError(null);
    setFile(selected);
    setText(null);
  }, []);

  const run = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const { text: result } = await api.runOcr(file);
      setText(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "แปลงข้อความไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setText(null);
    setProcessing(false);
    setError(null);
  }, []);

  return { fileName: file?.name ?? null, file, text, setText, processing, error, selectFile, run, reset };
}

// ---- useDashboard --------------------------------------------------------------

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
