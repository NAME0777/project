/**
 * ============================================================
 * VIEWS — แปลงภาพเป็นข้อความ (OCR) และภาพรวมระบบ (เฉพาะผู้ดูแล)
 * ============================================================
 */
import { Button, PageShell, TextAreaField } from "../ui";
import { useDashboard, useOcr } from "../hooks";
import type { User, ViewName } from "../types";

// ---- OcrView -----------------------------------------------------------

interface OcrViewProps {
  user: User;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onSaveNote: (content: string) => void;
}
export function OcrView({ user, onNavigate, onLogout, onSaveNote }: OcrViewProps) {
  const ocr = useOcr();

  return (
    <PageShell user={user} current="ocr" onNavigate={onNavigate} onLogout={onLogout}
      title="แปลงภาพโน้ตเป็นข้อความ" description="ถ่ายรูปสมุดจดหรือสไลด์ ระบบจะดึงข้อความออกมาให้ตรวจก่อนบันทึกเป็นโน้ต">
      <div className="space-y-5 rounded-sheet border border-paper-rule bg-white p-6 shadow-sheet">
        <div className="rounded border border-dashed border-paper-rule bg-paper px-6 py-10 text-center">
          <p className="text-ink-soft">ลากไฟล์มาวาง หรือ</p>
          <label className="mt-2 inline-block cursor-pointer rounded bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft">
            เลือกไฟล์ภาพ
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => ocr.selectFile(e.target.files?.[0] ?? null)} />
          </label>
          <p className="mt-3 text-sm text-ink-mute">รองรับ JPG และ PNG ขนาดไม่เกิน 8 MB</p>
          {ocr.fileName && <p className="mt-3 text-sm text-ink">ไฟล์ที่เลือก: {ocr.fileName}</p>}
        </div>

        {ocr.error && <p className="rounded border border-redpen/30 bg-redpen-soft px-3 py-2 text-sm text-redpen">{ocr.error}</p>}

        {ocr.fileName && ocr.text === null && (
          <Button onClick={ocr.run} disabled={ocr.processing}>{ocr.processing ? "กำลังแปลงข้อความ…" : "เริ่มแปลงข้อความ"}</Button>
        )}

        {ocr.text !== null && (
          <div className="space-y-3">
            <TextAreaField label="ข้อความที่อ่านได้" hint="ตรวจคำที่อ่านผิดก่อนบันทึก โดยเฉพาะสูตรและตัวเลข" className="h-48" value={ocr.text} onChange={(e) => ocr.setText(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button variant="confirm" onClick={() => { onSaveNote(ocr.text ?? ""); ocr.reset(); }}>บันทึกเป็นโน้ตใหม่</Button>
              <Button variant="quiet" onClick={ocr.reset}>เริ่มใหม่</Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ---- DashboardView (เฉพาะ role admin — ตรวจสิทธิ์ที่ App.tsx) -------------

interface DashboardViewProps {
  user: User;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
}
export function DashboardView({ user, onNavigate, onLogout }: DashboardViewProps) {
  const { data, loading } = useDashboard();

  return (
    <PageShell user={user} current="dashboard" onNavigate={onNavigate} onLogout={onLogout} width="wide"
      title="ภาพรวมระบบ" description="ดูว่าคลังโน้ตถูกใช้งานมากแค่ไหน และใครแก้อะไรไปบ้าง">
      {loading || !data ? (
        <p className="text-ink-soft">กำลังโหลดข้อมูล…</p>
      ) : (
        <>
          <dl className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.stats.map((stat) => (
              <div key={stat.label} className="rounded-sheet border border-paper-rule bg-white p-5 shadow-sheet">
                <dt className="text-sm text-ink-mute">{stat.label}</dt>
                <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <section className="rounded-sheet border border-paper-rule bg-white shadow-sheet">
            <h2 className="border-b border-paper-rule px-5 py-4 text-lg font-semibold text-ink">การแก้ไขล่าสุด</h2>
            <ul className="divide-y divide-paper-rule">
              {data.recentEdits.map((edit) => (
                <li key={`${edit.who}-${edit.date}`} className="flex flex-wrap gap-x-3 gap-y-1 px-5 py-4">
                  <span className="font-medium text-ink">{edit.who}</span>
                  <span className="text-ink-soft">{edit.what}</span>
                  <span className="text-sm text-pen">{edit.subject}</span>
                  <span className="ml-auto text-sm text-ink-mute">{edit.date}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </PageShell>
  );
}
