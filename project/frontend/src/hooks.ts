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

  const replace = useCallback((name: ViewName, params: Omit<Route, "name"> = {}) => {
    setStack((prev) => (prev.length > 0 ? [...prev.slice(0, -1), { name, ...params }] : [{ name, ...params }]));
  }, []);

  return { route, go, reset, back, replace, canGoBack: stack.length > 1 };
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

  const googleLogin = useCallback(async (credential: string) => {
    setPending(true);
    setError(null);
    try {
      const loggedIn = await api.googleLogin(credential);
      setUser(loggedIn as User);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  return { user, login, googleLogin, logout, error, pending, checking };
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
      const created = await api.createSubject(subject);
      await reloadSubjects();
      return created;
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
    reloadTopics,
    reloadSubjects,
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
  const [error, setError] = useState<string | null>(null);
  const playbackId = useRef(0);
  const activeAudio = useRef<HTMLAudioElement | null>(null);
  const activeUrl = useRef<string | null>(null);
  const supported = typeof window !== "undefined" && "Audio" in window;

  const stop = useCallback(() => {
    playbackId.current += 1;
    activeAudio.current?.pause();
    if (activeAudio.current) activeAudio.current.src = "";
    activeAudio.current = null;
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
    activeUrl.current = null;
    setIsPlaying(false);
    setError(null);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      stop();
      if (!text.trim()) {
        setIsPlaying(false);
        return;
      }
      const initialLanguage = /[\u0E00-\u0E7F]/.test(text) ? "th-TH" : "en-US";
      const languageRuns: { text: string; lang: string }[] = [];
      let currentLanguage = initialLanguage;

      for (const part of text.match(/[\u0E00-\u0E7F]+|[A-Za-z]+|[^A-Za-z\u0E00-\u0E7F]+/g) ?? [text]) {
        if (/[\u0E00-\u0E7F]/.test(part)) currentLanguage = "th-TH";
        else if (/[A-Za-z]/.test(part)) currentLanguage = "en-US";

        const previousRun = languageRuns[languageRuns.length - 1];
        if (previousRun?.lang === currentLanguage) {
          previousRun.text += part;
        } else {
          languageRuns.push({ text: part, lang: currentLanguage });
        }
      }

      const runs: typeof languageRuns = [];
      for (const run of languageRuns) {
        let remaining = run.text;
        while (remaining.length > 2000) {
          let splitAt = remaining.lastIndexOf(" ", 2000);
          if (splitAt < 1) splitAt = 2000;
          runs.push({ text: remaining.slice(0, splitAt).trim(), lang: run.lang });
          remaining = remaining.slice(splitAt).trimStart();
        }
        if (remaining) runs.push({ text: remaining, lang: run.lang });
      }

      const currentPlaybackId = playbackId.current;
      const speakRun = async (index: number) => {
        if (playbackId.current !== currentPlaybackId) return;
        const run = runs[index];
        if (!run) {
          setIsPlaying(false);
          return;
        }

        try {
          const blob = await api.synthesizeSpeech(run.text, run.lang);
          if (playbackId.current !== currentPlaybackId) return;
          const url = URL.createObjectURL(blob);
          activeUrl.current = url;
          const audio = new Audio(url);
          activeAudio.current = audio;
          const releaseAudio = () => {
            if (activeAudio.current === audio) activeAudio.current = null;
            if (activeUrl.current === url) {
              URL.revokeObjectURL(url);
              activeUrl.current = null;
            }
          };
          audio.onended = () => {
            releaseAudio();
            void speakRun(index + 1);
          };
          audio.onerror = () => {
            releaseAudio();
            if (playbackId.current === currentPlaybackId) {
              setIsPlaying(false);
              setError("เล่นเสียงไม่สำเร็จ กรุณาลองใหม่");
            }
          };
          await audio.play();
        } catch (cause) {
          if (playbackId.current !== currentPlaybackId) return;
          setIsPlaying(false);
          setError(cause instanceof Error ? cause.message : "สร้างเสียงอ่านไม่สำเร็จ กรุณาลองใหม่");
        }
      };

      setIsPlaying(true);
      void speakRun(0);
    },
    [supported, stop]
  );

  const toggle = useCallback((text: string) => (isPlaying ? stop() : speak(text)), [isPlaying, speak, stop]);

  useEffect(() => stop, [stop]);

  return { isPlaying, supported, error, speak, stop, toggle };
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
