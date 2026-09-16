import { useAuth } from "./hooks/useAuth";
import { useNotes } from "./hooks/useNotes";
import { useRouter } from "./hooks/useRouter";
import LoginView from "./views/LoginView";
import RegisterView from "./views/RegisterView";
import SubjectsView from "./views/SubjectsView";
import TopicsView from "./views/TopicsView";
import NoteView from "./views/NoteView";
import EditorView from "./views/EditorView";
import OcrView from "./views/OcrView";
import DashboardView from "./views/DashboardView";
import type { ViewName } from "./types";

/**
 * ไฟล์นี้ทำหน้าที่เดียว: เลือกว่าจะแสดงหน้าไหน และส่ง state/ฟังก์ชันลงไปให้หน้านั้น
 * ไม่มีการประกาศคอมโพเนนต์ซ้อนข้างใน ทุกหน้าถูก import มาจากไฟล์ของตัวเอง
 */
export default function App() {
  const { route, go, reset, back } = useRouter();
  const { user, login, logout } = useAuth();
  const { notes, getNote, saveRevision, createNote } = useNotes();

  const currentNote = getNote(route.noteId);

  const handleLogout = () => {
    logout();
    reset("login");
  };

  const navigate = (view: ViewName) => go(view);

  if (!user || route.name === "login") {
    return <LoginView onLogin={(email, role) => { login(email, role); reset("subjects"); }} onGoRegister={() => go("register")} />;
  }

  switch (route.name) {
    case "register":
      return <RegisterView onRegistered={() => reset("login")} onGoLogin={() => reset("login")} />;

    case "topics":
      return (
        <TopicsView
          user={user}
          subjectId={route.subjectId}
          notes={notes}
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
          note={currentNote}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={back}
          onEdit={() => go("editor", { subjectId: route.subjectId, noteId: route.noteId })}
        />
      );

    case "editor":
      return (
        <EditorView
          // key บังคับให้ฟอร์มเริ่มใหม่เมื่อสลับโน้ต ไม่ค้างเนื้อหาของโน้ตก่อนหน้า
          key={route.noteId}
          user={user}
          note={currentNote}
          onNavigate={navigate}
          onLogout={handleLogout}
          onCancel={back}
          onSave={(content, summary) => {
            if (route.noteId === undefined) return;
            saveRevision(route.noteId, content, summary, user.name);
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
          onSaveNote={(content) => {
            const noteId = createNote(1, "โน้ตจากภาพที่สแกน", content, user.name);
            go("note", { subjectId: 1, noteId });
          }}
        />
      );

    case "dashboard":
      if (user.role !== "admin") {
        return (
          <SubjectsView
            user={user}
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
          onNavigate={navigate}
          onLogout={handleLogout}
          onOpenSubject={(subjectId) => go("topics", { subjectId })}
        />
      );
  }
}
