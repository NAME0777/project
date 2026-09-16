import type { Note } from "../types";

const normalization = [
  "Normalization คือกระบวนการจัดโครงสร้างตารางเพื่อลดความซ้ำซ้อนของข้อมูล",
  "",
  "1NF — ทุกคอลัมน์เก็บค่าเดียว (atomic value) ห้ามเก็บเป็นลิสต์",
  "2NF — ผ่าน 1NF และไม่มี partial dependency กับคีย์หลักแบบผสม",
  "3NF — ผ่าน 2NF และไม่มี transitive dependency ระหว่างคอลัมน์ที่ไม่ใช่คีย์",
].join("\n");

export const initialNotes: Note[] = [
  {
    id: 203,
    subjectId: 2,
    title: "Normalization",
    content: normalization,
    revisions: [
      {
        id: 2,
        editor: "มิว ธ.",
        date: "8 ก.ย. 69 14:30",
        summary: "เพิ่มตัวอย่าง 3NF",
        content: normalization,
      },
      {
        id: 1,
        editor: "ปาล์ม พ.",
        date: "5 ก.ย. 69 09:10",
        summary: "สร้างโน้ตครั้งแรก",
        content:
          "Normalization คือกระบวนการจัดโครงสร้างตารางเพื่อลดความซ้ำซ้อนของข้อมูล\n\n1NF — ทุกคอลัมน์เก็บค่าเดียว",
      },
    ],
  },
  {
    id: 103,
    subjectId: 1,
    title: "Tree และ Binary Search Tree",
    content: [
      "Tree คือโครงสร้างข้อมูลแบบลำดับชั้น ประกอบด้วย Node และ Edge",
      "",
      "Binary Search Tree (BST) คือ Tree ที่แต่ละโหนดมีลูกได้ไม่เกิน 2 โหนด",
      "กติกา: ค่าทางซ้ายน้อยกว่าโหนดแม่ ค่าทางขวามากกว่าโหนดแม่",
      "ค้นหาเฉลี่ย O(log n) แต่ถ้าต้นไม้เอียงจนเป็นเส้นตรงจะกลายเป็น O(n)",
    ].join("\n"),
    revisions: [
      {
        id: 1,
        editor: "ตั้นน้ำ ก.",
        date: "6 ก.ย. 69 16:05",
        summary: "สร้างจากภาพที่สแกน",
        content: "Tree คือโครงสร้างข้อมูลแบบลำดับชั้น ประกอบด้วย Node และ Edge",
      },
    ],
  },
];

export const dashboardStats = [
  { label: "โน้ตทั้งหมด", value: "1,284" },
  { label: "ผู้ใช้งาน", value: "612" },
  { label: "ครั้งที่ฟังเสียง", value: "3,905" },
  { label: "วิชาที่คนอ่านมากที่สุด", value: "CS204" },
];

export const recentEdits = [
  { who: "มิว ธ.", what: 'แก้ไข "Normalization"', subject: "CS310", date: "8 ก.ย. 69" },
  { who: "ปาล์ม พ.", what: 'สร้างโน้ต "ER Diagram"', subject: "CS310", date: "7 ก.ย. 69" },
  { who: "ตั้นน้ำ ก.", what: 'อัปโหลดภาพ "Tree Structure"', subject: "CS204", date: "6 ก.ย. 69" },
];
