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
import { NotesHubView, NoteFileDetailView } from "./views/NotesHubViews";
import { OcrView, DashboardView } from "./views/ToolViews";
import type { ViewName } from "./types";

export default function App() {
  const { route, go, reset, back, replace } = useRouter({ name: "notes" });
  const { user, login, googleLogin, logout, error: loginError, pending: loginPending, checking } = useAuth();
  const catalog = useCatalog(route.subjectId);
  const { note, loading: noteLoading, saveRevision, reload: reloadNote } = useNote(route.noteId);

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
          if (ok) reset("notes");
        }}
        onGoogleLogin={async (credential) => {
          const ok = await googleLogin(credential);
          if (ok) reset("notes");
        }}
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
          onWriteWiki={() =>
            go("editor", { subjectId: route.subjectId })
          }
          onOpenNote={(topicId, noteId, hasNote) => {
            if (hasNote && noteId) {
              go("note", { subjectId: route.subjectId, topicId, noteId });
            } else {
              // ยังไม่มีโน้ต -> ให้ไปหน้าเขียนวิกิบทเรียนได้ทันที
              go("editor", { subjectId: route.subjectId, topicId });
            }
          }}
          onCreateTopic={catalog.createTopic}
          onUpdateTopic={catalog.updateTopic}
          onDeleteTopic={catalog.deleteTopic}
        />
      );

    case "note": {
      const currentTopic = catalog.topics.find((t) => t.id === route.topicId);
      return (
        <NoteView
          key={`${route.topicId ?? "notopic"}-${route.noteId ?? "nonote"}`}
          user={user}
          note={note}
          loading={noteLoading}
          topicTitle={currentTopic?.title}
          subjectCode={catalog.subjects.find((s) => s.id === (note?.subject || route.subjectId))?.code}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={() => {
            if (route.subjectId) {
              go("topics", { subjectId: route.subjectId });
            } else {
              back();
            }
          }}
          onEdit={() =>
            go("editor", { subjectId: route.subjectId, topicId: route.topicId, noteId: route.noteId })
          }
          onRollback={async (content, summary) => {
            await saveRevision(content, summary);
            await reloadNote?.();
          }}
          onDelete={async () => {
            if (note) {
              await api.deleteNote(note.id);
              await catalog.reloadTopics?.();
              if (route.subjectId) {
                go("topics", { subjectId: route.subjectId });
              } else {
                back();
              }
            }
          }}
        />
      );
    }

    case "editor": {
      const currentTopic = catalog.topics.find((t) => t.id === route.topicId);
      return (
        <EditorView
          key={`${route.topicId ?? "notopic"}-${route.noteId ?? "nonote"}`}
          user={user}
          note={note}
          defaultTitle={currentTopic?.title}
          onNavigate={navigate}
          onLogout={handleLogout}
          onCancel={back}
          onSave={async (formData) => {
            const data = formData as { title: string; content: string; summary: string };

            if (note && route.noteId) {
              // 1. มีโน้ตเดิมอยู่แล้ว -> บันทึก Revision ใหม่
              await saveRevision(data.content || "", data.summary || "แก้ไขโน้ต");

              // 2. อัปเดตชื่อหัวข้อ / โน้ต (ถ้ามีการแก้ชื่อ)
              if (data.title && data.title !== note.title) {
                await api.updateNote(note.id, { title: data.title });
              }
              if (catalog.updateTopic && data.title && route.topicId) {
                await catalog.updateTopic(route.topicId, data.title);
              }
              await reloadNote?.();
              await catalog.reloadTopics?.();
              back();
            } else if (route.subjectId) {
              // 3. สร้างโน้ตวิกิใหม่ -> บันทึกลลง DB
              const created = await api.createNote(
                route.subjectId,
                data.title || currentTopic?.title || "หัวข้อบทเรียน",
                data.content || "",
                null,
                route.topicId
              );
              await catalog.reloadTopics?.();
              // แทนที่หน้า editor ด้วยหน้าอ่านวิกิที่เพิ่งสร้างทันที โหลดข้อมูลขึ้นมาทันที ไม่ต้องรีเฟรช
              replace("note", {
                subjectId: route.subjectId,
                topicId: route.topicId,
                noteId: created.id,
              });
            } else {
              back();
            }
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

    case "notes":
      return (
        <NotesHubView
          user={user}
          subjects={catalog.subjects}
          onNavigate={navigate}
          onLogout={handleLogout}
          onSelectNote={(noteId) => go("note-detail", { noteId })}
          onCreateSubject={catalog.createSubject}
        />
      );

    case "note-detail":
      return (
        <NoteFileDetailView
          user={user}
          noteId={route.noteId}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={back}
        />
      );

    case "subjects":
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

    default:
      return (
        <NotesHubView
          user={user}
          subjects={catalog.subjects}
          onNavigate={navigate}
          onLogout={handleLogout}
          onSelectNote={(noteId) => go("note-detail", { noteId })}
          onCreateSubject={catalog.createSubject}
        />
      );
  }
}