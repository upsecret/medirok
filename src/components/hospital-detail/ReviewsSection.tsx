import type { Hospital } from "@/types";

// 실방문 후기 섹션 — 후기 없으면 렌더하지 않음
export function ReviewsSection({ hospital }: { hospital: Hospital }) {
  if (hospital.reviews.length === 0) return null;
  return (
    <section className="section-space bg-white border-b border-[var(--color-surface-border)]">
      <div className="container-page max-w-5xl">
        <div className="mb-6 flex justify-between items-end gap-4">
          <div>
            <p className="eyebrow">VERIFIED REVIEWS</p>
            <h2 className="mt-2">실방문 후기 ({hospital.reviewCount})</h2>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">최신순</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {hospital.reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-bg)] p-5"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base text-[var(--color-warning)]">{"★".repeat(r.rating)}</span>
                  {r.isReceiptVerified && (
                    <span className="badge-certified text-[9px]">영수증</span>
                  )}
                  {r.isPhoneVerified && (
                    <span className="text-[9px] bg-[var(--color-info)] text-white px-1.5 py-0.5 rounded">
                      전화
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {r.reviewerName} · {r.visitedAt.slice(5)}
                </span>
              </div>
              <p className="text-base leading-relaxed">{r.content}</p>
              {(r.treatmentName || r.ageGroup) && (
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">
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
