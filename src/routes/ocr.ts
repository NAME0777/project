/**
 * ---- /api/ocr — แปลงภาพเป็นข้อความ --------------------------------------
 * ตอนนี้ยังเป็น mock (คืนข้อความตัวอย่างเสมอ) ต่อ OCR engine จริง (Tesseract,
 * Google Vision, ฯลฯ) ได้ตรงจุดที่คอมเมนต์ไว้ด้านล่าง — โครงสร้าง request/response
 * ของ route จะไม่ต้องเปลี่ยน
 */
import { Router } from "express";

export const ocrRouter = Router();

const SAMPLE_RESULT = [
  "Tree คือโครงสร้างข้อมูลแบบลำดับชั้น ประกอบด้วย Node และ Edge",
  "Binary Search Tree (BST) คือ Tree ที่แต่ละโหนดมีลูกได้ไม่เกิน 2 โหนด",
  "กติกา: ค่าทางซ้ายน้อยกว่าโหนดแม่ ค่าทางขวามากกว่าโหนดแม่",
].join("\n");

ocrRouter.post("/", async (req, res) => {
  const { fileName } = req.body as { fileName?: string };
  if (!fileName) return res.status(400).json({ error: "ไม่พบชื่อไฟล์ภาพ" });

  // TODO: ส่งไฟล์จริงเข้า OCR engine ตรงนี้ แล้วคืนข้อความที่อ่านได้แทน SAMPLE_RESULT
  await new Promise((resolve) => setTimeout(resolve, 900));
  res.json({ text: SAMPLE_RESULT });
});
