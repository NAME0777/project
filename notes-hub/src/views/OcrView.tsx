import Button from "../components/Button";
import PageShell from "../components/PageShell";
import { TextAreaField } from "../components/Field";
import { useOcr } from "../hooks/useOcr";
import type { User, ViewName } from "../types";

interface OcrViewProps {
  user: User;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onSaveNote: (content: string) => void;
}

export default function OcrView({ user, onNavigate, onLogout, onSaveNote }: OcrViewProps) {
  const ocr = useOcr();

  return (
    <PageShell
      user={user}
      current="ocr"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="แปลงภาพโน้ตเป็นข้อความ"
      description="ถ่ายรูปสมุดจดหรือสไลด์ ระบบจะดึงข้อความออกมาให้ตรวจก่อนบันทึกเป็นโน้ต"
    >
      <div className="space-y-5 rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
        <div className="rounded border border-dashed border-paper-rule bg-paper px-6 py-10 text-center">
          <p className="text-ink-soft">ลากไฟล์มาวาง หรือ</p>
          <label className="mt-2 inline-block cursor-pointer rounded bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft">
            เลือกไฟล์ภาพ
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => ocr.selectFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-3 text-sm text-ink-mute">รองรับ JPG และ PNG ขนาดไม่เกิน 8 MB</p>
          {ocr.fileName && <p className="mt-3 text-sm text-ink">ไฟล์ที่เลือก: {ocr.fileName}</p>}
        </div>

        {ocr.error && (
          <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">
            {ocr.error}
          </p>
        )}

        {ocr.fileName && ocr.text === null && (
          <Button onClick={ocr.run} disabled={ocr.processing}>
            {ocr.processing ? "กำลังแปลงข้อความ…" : "เริ่มแปลงข้อความ"}
          </Button>
        )}

        {ocr.text !== null && (
          <div className="space-y-3">
            <TextAreaField
              label="ข้อความที่อ่านได้"
              hint="ตรวจคำที่อ่านผิดก่อนบันทึก โดยเฉพาะสูตรและตัวเลข"
              className="h-48"
              value={ocr.text}
              onChange={(e) => ocr.setText(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="confirm"
                onClick={() => {
                  onSaveNote(ocr.text ?? "");
                  ocr.reset();
                }}
              >
                บันทึกเป็นโน้ตใหม่
              </Button>
              <Button variant="quiet" onClick={ocr.reset}>
                เริ่มใหม่
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
