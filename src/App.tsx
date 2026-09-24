/**
 * ============================================================
 * APP — ตัวเลือกหน้า (routing) + จุดเชื่อมข้อมูลจาก backend อย่างเดียว
 * ============================================================
 * ไม่มี UI ของตัวเอง ไม่มีข้อมูลฮาร์ดโค้ด ทุกอย่างมาจาก hooks.ts (./api.ts)
 */
import { api } from "./api";
import { useAuth, useCatalog, useNote, useRouter } from "./hooks";
import { LoginView, RegisterView } from "./views/AuthViews";
import { SubjectsView, TopicsView } from "./views/CatalogViews";
import { NoteView, EditorView } from "./views/NoteViews";
import { OcrView, DashboardView } from "./views/ToolViews";
import type { ViewName } from "./types";

export default function App() {
  const { route, go, reset, back } = useRouter();
  const { user, login, logout, error: loginError } = useAuth();
  const catalog = useCatalog(route.subjectId);
  const { note, loading: noteLoading, saveRevision } = useNote(route.noteId);

  const handleLogout = () => {
    logout();
    reset("login");
  };

  const navigate = (view: ViewName) => go(view);

  if (!user || route.name === "login") {
    return (
      <LoginView
        onLogin={async (email, role) => {
          const ok = await login(email, role);
          if (ok) reset("subjects");
        }}
        onGoRegister={() => go("register")}
        error={loginError}
      />
    );
  }

  switch (route.name) {
    case "register":
      return (
        <RegisterView
          onRegistered={async (form) => {
            await api.register(form);
            reset("login");
          }}
          onGoLogin={() => reset("login")}
        />
      );

    case "topics":
      return (
        <TopicsView
          user={user}
          subject={catalog.subjects.find((s) => s.id === route.subjectId)}
          topics={catalog.topics}
          loading={catalog.loading}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={back}
          onOpenNote={(noteId) => go("note", { subjectId: route.subjectId, noteId })}
        />
      );

    case "note":
      return (
        <NoteView
          user={user}
          note={note}
          loading={noteLoading}
          subjectCode={catalog.subjects.find((s) => s.id === note?.subjectId)?.code}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={back}
          onEdit={() => go("editor", { subjectId: route.subjectId, noteId: route.noteId })}
        />
      );

    case "editor":
      return (
        <EditorView
          key={route.noteId} // บังคับให้ฟอร์มเริ่มใหม่เมื่อสลับโน้ต ไม่ค้างเนื้อหาของโน้ตก่อนหน้า
          user={user}
          note={note}
          onNavigate={navigate}
          onLogout={handleLogout}
          onCancel={back}
          onSave={async (content, summary) => {
            await saveRevision(content, summary, user.name);
            back();
          }}
        />
      );

    case "ocr":
      return (
        <OcrView
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
          onSaveNote={async (content) => {
            const created = await api.createNote(1, "โน้ตจากภาพที่สแกน", content, user.name);
            go("note", { subjectId: created.subjectId, noteId: created.id });
          }}
        />
      );

    case "dashboard":
      if (user.role !== "admin") {
        return (
          <SubjectsView
            user={user}
            subjects={catalog.subjects}
            loading={catalog.loading}
            onNavigate={navigate}
            onLogout={handleLogout}
            onOpenSubject={(subjectId) => go("topics", { subjectId })}
          />
        );
      }
      return <DashboardView user={user} onNavigate={navigate} onLogout={handleLogout} />;

    case "subjects":
    default:
      return (
        <SubjectsView
          user={user}
          subjects={catalog.subjects}
          loading={catalog.loading}
          onNavigate={navigate}
          onLogout={handleLogout}
          onOpenSubject={(subjectId) => go("topics", { subjectId })}
        />
      );
  }
}
