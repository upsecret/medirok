import type { Hospital } from "@/types";

// 실방문 후기 섹션 — 후기 없으면 렌더하지 않음
export function ReviewsSection({ hospital }: { hospital: Hospital }) {
  if (hospital.reviews.length === 0) return null;
  return (
    <section className="py-5 bg-white border-b border-[var(--color-surface-border)]">
      <div className="container-page">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-base font-medium">실방문 후기 ({hospital.reviewCount})</h2>
          <span className="text-xs text-[var(--color-text-muted)]">최신순 ▾</span>
        </div>
        <div className="space-y-2">
          {hospital.reviews.map((r) => (
            <div
              key={r.id}
              className="bg-[var(--color-surface-bg)] border border-[var(--color-surface-border)] rounded-md p-3"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{"★".repeat(r.rating)}</span>
                  {r.isReceiptVerified && (
                    <span className="badge-certified text-[9px]">영수증</span>
                  )}
                  {r.isPhoneVerified && (
                    <span className="text-[9px] bg-[var(--color-info)] text-white px-1.5 py-0.5 rounded">
                      전화
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {r.reviewerName} · {r.visitedAt.slice(5)}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{r.content}</p>
              {(r.treatmentName || r.ageGroup) && (
                <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
                  {r.treatmentName} · {r.ageGroup}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
