import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE_RESULT = [
  "Tree คือโครงสร้างข้อมูลแบบลำดับชั้น ประกอบด้วย Node และ Edge",
  "Binary Search Tree (BST) คือ Tree ที่แต่ละโหนดมีลูกได้ไม่เกิน 2 โหนด",
  "กติกา: ค่าทางซ้ายน้อยกว่าโหนดแม่ ค่าทางขวามากกว่าโหนดแม่",
].join("\n");

const MAX_SIZE = 8 * 1024 * 1024;

/** ขั้นตอนอัปโหลดภาพ → แปลงข้อความ (ตอนนี้จำลองผล รอต่อ API จริงที่ run()) */
export function useOcr() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // ยกเลิก timer ถ้าผู้ใช้เปลี่ยนหน้าไปก่อน
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const selectFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("ไฟล์นี้ไม่ใช่รูปภาพ เลือกไฟล์ JPG หรือ PNG");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("ไฟล์ใหญ่เกิน 8 MB ลองย่อขนาดภาพก่อน");
      return;
    }
    setError(null);
    setFileName(file.name);
    setText(null);
  }, []);

  const run = useCallback(() => {
    setProcessing(true);
    timerRef.current = window.setTimeout(() => {
      setText(SAMPLE_RESULT);
      setProcessing(false);
    }, 1200);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setFileName(null);
    setText(null);
    setProcessing(false);
    setError(null);
  }, []);

  return { fileName, text, setText, processing, error, selectFile, run, reset };
}
