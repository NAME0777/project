import type { Revision } from "../../types";

interface RevisionListProps {
  revisions: Revision[];
}

/** ไทม์ไลน์การแก้ไข เวอร์ชันล่าสุดอยู่บนสุด */
export default function RevisionList({ revisions }: RevisionListProps) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 text-lg font-semibold text-ink">ประวัติการแก้ไข</h2>
      <p className="mb-4 text-sm text-ink-soft">
        ทุกครั้งที่บันทึกจะเก็บเป็นเวอร์ชันใหม่ ของเดิมยังอยู่ครบ
      </p>

      <ol className="border-l border-paper-rule pl-5">
        {revisions.map((revision, index) => (
          <li key={revision.id} className="relative pb-5 last:pb-0">
            <span
              aria-hidden
              className={
                "absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper " +
                (index === 0 ? "bg-marker-deep" : "bg-paper-rule")
              }
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-medium text-ink">{revision.editor}</span>
              <span className="text-sm text-ink-mute">{revision.date}</span>
              {index === 0 && (
                <span className="rounded bg-marker px-1.5 py-0.5 text-xs text-ink">เวอร์ชันปัจจุบัน</span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{revision.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
