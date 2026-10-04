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
  const { user, login, logout, error: loginError, pending: loginPending, checking } = useAuth();
  const catalog = useCatalog(route.subjectId);
  const { note, loading: noteLoading, saveRevision } = useNote(route.noteId);

  const handleLogout = () => {
    logout();
    reset("login");
  };

  const navigate = (view: ViewName) => go(view);

  // รอเช็ค token ค้างจากครั้งก่อน (รีเฟรชหน้า) ก่อนตัดสินใจว่าจะพาไปหน้าไหน
  if (checking) return null;

  if (!user || route.name === "login") {
    return (
      <LoginView
        onLogin={async (email, password) => {
          const ok = await login(email, password);
          if (ok) reset("subjects");
        }}
        onGoRegister={() => go("register")}
        error={loginError}
        pending={loginPending}
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
          loading={catalog.topicsLoading}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={back}
          onOpenNote={(noteId) => go("note", { subjectId: route.subjectId, noteId })}
          onCreateTopic={catalog.createTopic}
          onUpdateTopic={catalog.updateTopic}
          onDeleteTopic={catalog.deleteTopic}
        />
      );

    case "note": {
      const currentTopic = catalog.topics.find((t) => t.id === route.noteId);
      return (
        <NoteView
          key={route.noteId} // บังคับให้โหลดคอมโพเนนต์ใหม่เสมอเมื่อเปลี่ยน Note ID
          user={user}
          note={note}
          loading={noteLoading}
          topicTitle={currentTopic?.title}
          subjectCode={catalog.subjects.find((s) => s.id === (note?.subject || route.subjectId))?.code}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={back}
          onEdit={() => go("editor", { subjectId: route.subjectId, noteId: route.noteId })}
        />
      );
    }

    case "editor": {
  const topicForEdit = catalog.topics.find((t) => t.id === route.noteId);
  return (
    <EditorView
      key={route.noteId} // บังคับให้ฟอร์มโหลดใหม่เมื่อสลับโน้ต
      user={user}
      note={note}
      defaultTitle={topicForEdit?.title}
      onNavigate={navigate}
      onLogout={handleLogout}
      onCancel={back}
      onSave={async (formData) => {
        const data = formData as any;

        // 1. บันทึกเนื้อหาโน้ต (Revision)
        await saveRevision(data.content || "", data.summary || "แก้ไขโน้ต");

        // 2. อัปเดตชื่อหัวข้อ (ถ้ามี)
        if (catalog.updateTopic && data.title && route.noteId) {
          await catalog.updateTopic(route.noteId, data.title);
        }

        // 3. ย้อนกลับไปหน้าก่อนหน้า (ถอยกลับโดยไม่ reload หน้า เพื่อไม่ให้หลุด Login)
        back();
      }}
    />
  );
}

    case "ocr":
      return (
        <OcrView
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
          onSaveNote={async (content, sourceFile) => {
            const firstSubject = catalog.subjects[0];
            if (!firstSubject) return;
            const created = await api.createNote(firstSubject.id, "โน้ตจากภาพที่สแกน", content, sourceFile);
            go("note", { subjectId: created.subject, noteId: created.id });
          }}
        />
      );

    case "dashboard":
      if (user.role !== "admin") {
        return (
          <SubjectsView
            user={user}
            subjects={catalog.subjects}
            loading={catalog.subjectsLoading}
            onNavigate={navigate}
            onLogout={handleLogout}
            onOpenSubject={(subjectId) => go("topics", { subjectId })}
            onCreateSubject={catalog.createSubject}
            onDeleteSubject={catalog.deleteSubject}
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
          loading={catalog.subjectsLoading}
          onNavigate={navigate}
          onLogout={handleLogout}
          onOpenSubject={(subjectId) => go("topics", { subjectId })}
          onCreateSubject={catalog.createSubject}
          onDeleteSubject={catalog.deleteSubject}
        />
      );
  }
}