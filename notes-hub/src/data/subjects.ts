import type { Subject, Topic } from "../types";

export const subjects: Subject[] = [
  { id: 1, code: "CS204", name: "โครงสร้างข้อมูลและขั้นตอนวิธี", term: "1/2569" },
  { id: 2, code: "CS310", name: "ระบบฐานข้อมูล", term: "1/2569" },
  { id: 3, code: "CS255", name: "วิศวกรรมซอฟต์แวร์", term: "1/2569" },
];

export const topics: Topic[] = [
  { id: 1, subjectId: 1, order: 1, title: "Array และ Linked List", noteId: 101 },
  { id: 2, subjectId: 1, order: 2, title: "Stack และ Queue", noteId: 102 },
  { id: 3, subjectId: 1, order: 3, title: "Tree และ Binary Search Tree", noteId: 103 },
  { id: 5, subjectId: 2, order: 1, title: "รู้จักระบบฐานข้อมูล", noteId: 201 },
  { id: 6, subjectId: 2, order: 2, title: "ER Diagram", noteId: 202 },
  { id: 7, subjectId: 2, order: 3, title: "Normalization", noteId: 203 },
  { id: 8, subjectId: 3, order: 1, title: "SDLC Models", noteId: 301 },
];

export function getSubject(subjectId: number | undefined): Subject | undefined {
  return subjects.find((s) => s.id === subjectId);
}

/** หัวข้อของวิชาหนึ่ง เรียงตามลำดับบทเรียน */
export function getTopics(subjectId: number | undefined): Topic[] {
  return topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order);
}

/** นับหัวข้อจากข้อมูลจริง จะได้ไม่ต้องกรอกเลขเองแล้วไม่ตรงกัน */
export function countTopics(subjectId: number): number {
  return topics.filter((t) => t.subjectId === subjectId).length;
}
